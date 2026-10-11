// يرسم أيقونة FindIt (1024×1024 PNG): أرضية سودا، أوراق مدرّجة، وعدسة ذهبية بإيد حمرا
// الاستعمال: make_icon <output.png>
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let size = 1024
let ctx = CGContext(
    data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0,
    space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
// نحسب الإحداثيات من فوق لتحت متل التصميم العادي
ctx.translateBy(x: 0, y: CGFloat(size))
ctx.scaleBy(x: 1, y: -1)

func color(_ hex: UInt32, _ alpha: CGFloat = 1) -> CGColor {
    CGColor(srgbRed: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255, alpha: alpha)
}

func roundedRect(_ r: CGRect, _ radius: CGFloat) -> CGPath {
    CGPath(roundedRect: r, cornerWidth: radius, cornerHeight: radius, transform: nil)
}

func linearGradient(_ path: CGPath, _ top: CGColor, _ bottom: CGColor, from: CGPoint, to: CGPoint) {
    ctx.saveGState()
    ctx.addPath(path)
    ctx.clip()
    let g = CGGradient(colorsSpace: nil, colors: [top, bottom] as CFArray, locations: [0, 1])!
    ctx.drawLinearGradient(g, start: from, end: to, options: [])
    ctx.restoreGState()
}

// MARK: - الأرضية (مربع الماك بزوايا مدوّرة)

let tile = CGRect(x: 100, y: 100, width: 824, height: 824)
let tilePath = roundedRect(tile, 185)

ctx.saveGState()
ctx.setShadow(offset: CGSize(width: 0, height: 12), blur: 28, color: color(0x000000, 0.45))
ctx.addPath(tilePath)
ctx.setFillColor(color(0x0B0B0B))
ctx.fillPath()
ctx.restoreGState()
linearGradient(tilePath, color(0x2B2B2B), color(0x050505),
               from: CGPoint(x: 512, y: 100), to: CGPoint(x: 512, y: 924))

// خط ذهبي رفيع على الحافة
ctx.addPath(roundedRect(tile.insetBy(dx: 6, dy: 6), 179))
ctx.setStrokeColor(color(0xD4A537, 0.35))
ctx.setLineWidth(4)
ctx.strokePath()

// MARK: - الأوراق المدرّجة

func drawDocuments() {
    let docs: [(CGFloat, CGFloat, UInt32)] = [
        (330, 200, 0x3A3A3A),
        (285, 245, 0x6E6E6E),
        (240, 290, 0xEDE7D8),
    ]
    for (x, y, fill) in docs {
        let r = CGRect(x: x, y: y, width: 340, height: 440)
        ctx.saveGState()
        ctx.setShadow(offset: CGSize(width: 0, height: 10), blur: 22, color: color(0x000000, 0.55))
        ctx.addPath(roundedRect(r, 28))
        ctx.setFillColor(color(fill))
        ctx.fillPath()
        ctx.restoreGState()
    }
    // أسطر النص على الورقة الأمامية — السطر الأحمر هو «الملف اللي لقيناه»
    let widths: [CGFloat] = [250, 200, 230, 170, 215, 140]
    for (i, w) in widths.enumerated() {
        let found = i == 2
        let line = CGRect(x: 285, y: 355 + CGFloat(i) * 52, width: w, height: found ? 26 : 20)
        ctx.addPath(roundedRect(line, line.height / 2))
        ctx.setFillColor(found ? color(0xC8202A) : color(0xA59E8F))
        ctx.fillPath()
    }
}
drawDocuments()

// MARK: - العدسة

let lensCenter = CGPoint(x: 625, y: 560)
let lensRadius: CGFloat = 160
let ringWidth: CGFloat = 40

// إيد العدسة (حمرا) — بتنرسم قبل الإطار حتى يغطّي بدايتها
let angle = CGFloat.pi / 4
let handleStart = CGPoint(x: lensCenter.x + cos(angle) * (lensRadius + 10),
                          y: lensCenter.y + sin(angle) * (lensRadius + 10))
let handleEnd = CGPoint(x: 845, y: 780)
ctx.saveGState()
ctx.setShadow(offset: CGSize(width: 0, height: 14), blur: 24, color: color(0x000000, 0.6))
ctx.setLineCap(.round)
ctx.setLineWidth(72)
ctx.setStrokeColor(color(0x9E141B))
ctx.move(to: handleStart)
ctx.addLine(to: handleEnd)
ctx.strokePath()
ctx.restoreGState()
// لمعة على الإيد
ctx.setLineCap(.round)
ctx.setLineWidth(18)
ctx.setStrokeColor(color(0xE0474E, 0.55))
ctx.move(to: CGPoint(x: handleStart.x + 4, y: handleStart.y - 14))
ctx.addLine(to: CGPoint(x: handleEnd.x - 6, y: handleEnd.y - 24))
ctx.strokePath()

// جوّا العدسة: نفس الأوراق بس مكبّرة
let lensCircle = CGPath(ellipseIn: CGRect(x: lensCenter.x - lensRadius, y: lensCenter.y - lensRadius,
                                          width: lensRadius * 2, height: lensRadius * 2), transform: nil)
ctx.saveGState()
ctx.addPath(lensCircle)
ctx.clip()
ctx.setFillColor(color(0x111111))
ctx.fill(CGRect(x: 0, y: 0, width: size, height: size))
let zoom: CGFloat = 1.7
// منكبّر حوالين النقطة اللي العدسة فوقها على الورقة (السطر الأحمر)
let focus = CGPoint(x: 470, y: 470)
ctx.translateBy(x: lensCenter.x, y: lensCenter.y)
ctx.scaleBy(x: zoom, y: zoom)
ctx.translateBy(x: -focus.x, y: -focus.y)
drawDocuments()
ctx.restoreGState()

// زجاج: لمعة خفيفة من فوق
ctx.saveGState()
ctx.addPath(lensCircle)
ctx.clip()
let glass = CGGradient(colorsSpace: nil,
                       colors: [color(0xFFFFFF, 0.28), color(0xFFFFFF, 0)] as CFArray,
                       locations: [0, 1])!
ctx.drawLinearGradient(glass, start: CGPoint(x: lensCenter.x - 80, y: lensCenter.y - lensRadius),
                       end: CGPoint(x: lensCenter.x, y: lensCenter.y), options: [])
ctx.restoreGState()

// إطار العدسة الذهبي
let ringRect = CGRect(x: lensCenter.x - lensRadius - ringWidth / 2,
                      y: lensCenter.y - lensRadius - ringWidth / 2,
                      width: (lensRadius + ringWidth / 2) * 2,
                      height: (lensRadius + ringWidth / 2) * 2)
ctx.saveGState()
ctx.setShadow(offset: CGSize(width: 0, height: 10), blur: 22, color: color(0x000000, 0.6))
ctx.addEllipse(in: ringRect)
ctx.setLineWidth(ringWidth)
ctx.setStrokeColor(color(0xC8962E))
ctx.strokePath()
ctx.restoreGState()
// تدرّج ذهبي فوق الإطار
ctx.saveGState()
ctx.addEllipse(in: ringRect)
ctx.setLineWidth(ringWidth)
ctx.replacePathWithStrokedPath()
ctx.clip()
let gold = CGGradient(colorsSpace: nil,
                      colors: [color(0xF7DC86), color(0xD4A537), color(0x8F6418)] as CFArray,
                      locations: [0, 0.5, 1])!
ctx.drawLinearGradient(gold, start: CGPoint(x: ringRect.minX, y: ringRect.minY),
                       end: CGPoint(x: ringRect.maxX, y: ringRect.maxY), options: [])
ctx.restoreGState()

// MARK: - الحفظ

let out = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "icon_1024.png")
let dest = CGImageDestinationCreateWithURL(out as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, ctx.makeImage()!, nil)
guard CGImageDestinationFinalize(dest) else {
    FileHandle.standardError.write("ما قدرت احفظ الأيقونة\n".data(using: .utf8)!)
    exit(1)
}
