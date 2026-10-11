// FindIt — تطبيق ماك صغير للبحث عن الملفات بالاسم، بدون الاعتماد على Spotlight.
import SwiftUI
import AppKit

@main
struct FindItApp: App {
    var body: some Scene {
        WindowGroup("FindIt") {
            ContentView()
        }
        .windowResizability(.contentMinSize)
    }
}

// MARK: - Model

struct FoundFile: Identifiable, Hashable, Sendable {
    let id = UUID()
    let url: URL

    var name: String { url.lastPathComponent }
    var folder: String {
        let path = url.deletingLastPathComponent().path
        let home = NSHomeDirectory()
        return path.hasPrefix(home) ? "~" + path.dropFirst(home.count) : path
    }
}

enum Scope: String, CaseIterable, Identifiable {
    case home = "مجلدي"
    case whole = "كل الجهاز"
    var id: String { rawValue }

    var root: URL {
        switch self {
        case .home: return FileManager.default.homeDirectoryForCurrentUser
        case .whole: return URL(fileURLWithPath: "/")
        }
    }
}

/// بيقارن اسم الملف مع اللي كتبه المستخدم: جزء من الاسم، أو نمط فيه * و ?
struct Matcher: @unchecked Sendable {
    private let query: String
    private let predicate: NSPredicate?

    init(_ query: String) {
        self.query = query
        if query.contains("*") || query.contains("?") {
            predicate = NSPredicate(format: "SELF LIKE[cd] %@", query)
        } else {
            predicate = nil
        }
    }

    func matches(_ name: String) -> Bool {
        if let predicate { return predicate.evaluate(with: name) }
        return name.range(of: query, options: [.caseInsensitive, .diacriticInsensitive]) != nil
    }
}

// MARK: - Search

enum SearchConfig {
    static let maxResults = 500

    // مجلدات ضخمة ما فيها ملفات شخصية — منتخطاها لنسرّع البحث
    static let skippedNames: Set<String> = ["node_modules", "Caches", "DerivedData", ".git"]
    static let skippedPaths: Set<String> = [
        "/System", "/Volumes", "/private", "/dev", "/cores",
        NSHomeDirectory() + "/Library/Containers",
        NSHomeDirectory() + "/Library/Group Containers",
    ]
}

@MainActor
final class Searcher: ObservableObject {
    @Published private(set) var results: [FoundFile] = []
    @Published private(set) var isSearching = false
    @Published private(set) var hitLimit = false

    private var task: Task<Void, Never>?

    func search(_ rawQuery: String, scope: Scope) {
        task?.cancel()
        results = []
        hitLimit = false

        let query = rawQuery.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else {
            isSearching = false
            return
        }
        isSearching = true

        let root = scope.root
        let matcher = Matcher(query)

        task = Task.detached(priority: .userInitiated) { [weak self] in
            let fm = FileManager.default
            guard let enumerator = fm.enumerator(
                at: root,
                includingPropertiesForKeys: [.isDirectoryKey],
                options: [.skipsHiddenFiles, .skipsPackageDescendants],
                errorHandler: { _, _ in true }
            ) else { return }

            var batch: [FoundFile] = []
            var found = 0
            var lastFlush = Date()

            while let url = enumerator.nextObject() as? URL {
                if Task.isCancelled { return }

                let name = url.lastPathComponent
                if SearchConfig.skippedNames.contains(name) || SearchConfig.skippedPaths.contains(url.path) {
                    enumerator.skipDescendants()
                    continue
                }

                if matcher.matches(name) {
                    batch.append(FoundFile(url: url))
                    found += 1
                    if found >= SearchConfig.maxResults { break }
                }

                if !batch.isEmpty && Date().timeIntervalSince(lastFlush) > 0.15 {
                    let chunk = batch
                    batch.removeAll()
                    lastFlush = Date()
                    await self?.append(chunk)
                }
            }

            if Task.isCancelled { return }
            let chunk = batch
            let limited = found >= SearchConfig.maxResults
            await self?.finish(chunk, hitLimit: limited)
        }
    }

    private func append(_ chunk: [FoundFile]) {
        results.append(contentsOf: chunk)
    }

    private func finish(_ chunk: [FoundFile], hitLimit: Bool) {
        results.append(contentsOf: chunk)
        self.hitLimit = hitLimit
        isSearching = false
    }
}

// MARK: - UI

struct ContentView: View {
    @StateObject private var searcher = Searcher()
    @State private var query = ""
    @State private var scope: Scope = .home
    @State private var selection: FoundFile.ID?
    @FocusState private var searchFocused: Bool

    private var selectedFile: FoundFile? {
        searcher.results.first { $0.id == selection }
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                Image(systemName: "magnifyingglass")
                    .font(.title2)
                    .foregroundStyle(.secondary)
                TextField("اكتب اسم الملف…", text: $query)
                    .textFieldStyle(.plain)
                    .font(.title2)
                    .focused($searchFocused)
                    .onSubmit { searcher.search(query, scope: scope) }
                Picker("", selection: $scope) {
                    ForEach(Scope.allCases) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .frame(width: 180)
            }
            .padding(14)

            Divider()

            List(searcher.results, selection: $selection) { file in
                FileRow(file: file)
            }
            .contextMenu(forSelectionType: FoundFile.ID.self) { ids in
                if let file = file(for: ids) {
                    Button("أظهر بالفايندر") { reveal(file) }
                    Button("افتح") { open(file) }
                    Divider()
                    Button("انسخ المسار") { copyPath(file) }
                }
            } primaryAction: { ids in
                if let file = file(for: ids) { reveal(file) }
            }
            .overlay { emptyState }

            Divider()

            HStack {
                statusText
                Spacer()
                Button("انسخ المسار") { if let f = selectedFile { copyPath(f) } }
                    .disabled(selectedFile == nil)
                Button("افتح") { if let f = selectedFile { open(f) } }
                    .disabled(selectedFile == nil)
                Button("أظهر بالفايندر") { if let f = selectedFile { reveal(f) } }
                    .keyboardShortcut(.defaultAction)
                    .disabled(selectedFile == nil)
            }
            .padding(10)
        }
        .frame(minWidth: 680, minHeight: 440)
        .onAppear { searchFocused = true }
        // بحث تلقائي بعد ما توقف عن الكتابة شوي
        .task(id: "\(scope.rawValue)|\(query)") {
            try? await Task.sleep(nanoseconds: 350_000_000)
            if !Task.isCancelled { searcher.search(query, scope: scope) }
        }
    }

    @ViewBuilder
    private var statusText: some View {
        if searcher.isSearching {
            HStack(spacing: 6) {
                ProgressView().controlSize(.small)
                Text("عم دوّر… (\(searcher.results.count))")
            }
            .foregroundStyle(.secondary)
        } else if !query.isEmpty {
            Text(searcher.hitLimit
                 ? "أول \(SearchConfig.maxResults) نتيجة — جرّب اسم أدق"
                 : "\(searcher.results.count) نتيجة")
                .foregroundStyle(.secondary)
        }
    }

    @ViewBuilder
    private var emptyState: some View {
        if searcher.results.isEmpty && !searcher.isSearching {
            VStack(spacing: 8) {
                Image(systemName: query.isEmpty ? "doc.text.magnifyingglass" : "questionmark.folder")
                    .font(.system(size: 40))
                Text(query.isEmpty
                     ? "اكتب اسم الملف أو جزء منه — بتقدر تستعمل * مثل report*.pdf"
                     : (scope == .home ? "ما لقيت شي بمجلدك — جرّب «كل الجهاز»" : "ما لقيت أي ملف بهالاسم"))
            }
            .foregroundStyle(.secondary)
        }
    }

    private func file(for ids: Set<FoundFile.ID>) -> FoundFile? {
        guard let id = ids.first else { return nil }
        return searcher.results.first { $0.id == id }
    }

    private func reveal(_ file: FoundFile) {
        NSWorkspace.shared.activateFileViewerSelecting([file.url])
    }

    private func open(_ file: FoundFile) {
        NSWorkspace.shared.open(file.url)
    }

    private func copyPath(_ file: FoundFile) {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(file.url.path, forType: .string)
    }
}

struct FileRow: View {
    let file: FoundFile

    var body: some View {
        HStack(spacing: 10) {
            Image(nsImage: NSWorkspace.shared.icon(forFile: file.url.path))
                .resizable()
                .frame(width: 28, height: 28)
            VStack(alignment: .leading, spacing: 2) {
                Text(file.name)
                    .lineLimit(1)
                Text(file.folder)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .truncationMode(.middle)
            }
        }
        .padding(.vertical, 2)
    }
}
