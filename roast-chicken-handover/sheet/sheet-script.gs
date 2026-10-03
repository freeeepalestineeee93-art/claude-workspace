/**
 * جدول منيو Roast chicken
 * التركيب: الإضافات ← برمجة التطبيقات ← امسح أي كود قديم والصق هذا ← احفظ
 * ← اختر setupMenuSheet من القائمة ← تنفيذ.
 * بعدها سكّر الجدول وافتحه، فبتطلع قائمة "🍗 Roast chicken" فيها رفع الصور والتنسيق.
 */

const HEADERS = ['القسم', 'الصنف', 'الخيار', 'السعر', 'متوفر', 'القسم بالتركي', 'الصنف بالتركي', 'الصورة'];
const SETTINGS = ['واتساب', 'هاتف', 'يفتح', 'يسكّر', 'التوصيل', 'العنوان', 'رابط الخريطة', 'إنستغرام', 'فيسبوك'];
const COL = { cat: 1, name: 2, opt: 3, price: 4, avail: 5, catTr: 6, nameTr: 7, img: 8 };
const SET_COL = 10; // J
const FOLDER_NAME = 'صور منيو Roast chicken';

const GREEN = '#7ac23a', RED = '#e2261c', INK = '#141717', LINE = '#e4e8e1';

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName('menu-prices') || ss.getSheets()[0];
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🍗 Roast chicken')
    .addItem('📷 رفع صورة للصنف المحدد', 'showImageDialog')
    .addItem('🗑️ حذف صورة الصنف المحدد', 'clearImage')
    .addSeparator()
    .addItem('🎨 تنسيق الجدول', 'formatMenuSheet')
    .addItem('⚙️ تجهيز الأعمدة والإعدادات', 'setupMenuSheet')
    .addToUi();
}

/** يتأكد من العناوين وخانة الإعدادات (بدون ما يمسح قيم موجودة)، ثم ينسّق. */
function setupMenuSheet() {
  const sh = sheet_();
  if (sh.getMaxColumns() < SET_COL + 1) sh.insertColumnsAfter(sh.getMaxColumns(), SET_COL + 1 - sh.getMaxColumns());
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sh.getRange(1, SET_COL, 1, 2).setValues([['الإعداد', 'القيمة']]);

  const cur = sh.getRange(2, SET_COL, SETTINGS.length, 2).getDisplayValues();
  const byKey = {};
  cur.forEach(r => { if (r[0]) byKey[r[0]] = r[1]; });
  sh.getRange(2, SET_COL + 1, 40, 1).setNumberFormat('@');
  sh.getRange(2, SET_COL, SETTINGS.length, 2).setValues(
    SETTINGS.map(k => [k, byKey[k] !== undefined ? byKey[k] : (k === 'التوصيل' ? 'نعم' : '')]));

  formatMenuSheet();
}

function formatMenuSheet() {
  const sh = sheet_();
  const N = HEADERS.length;
  const lastRow = Math.max(sh.getLastRow(), 2);
  const MAX = Math.max(lastRow + 150, 300);
  if (sh.getMaxRows() < MAX) sh.insertRowsAfter(sh.getMaxRows(), MAX - sh.getMaxRows());
  if (sh.getMaxColumns() > SET_COL + 1) sh.deleteColumns(SET_COL + 2, sh.getMaxColumns() - SET_COL - 1);

  sh.setRightToLeft(true);
  sh.setHiddenGridlines(true);
  sh.setTabColor(GREEN);

  const all = sh.getRange(1, 1, MAX, SET_COL + 1);
  all.clearFormat().clearDataValidations();
  all.setFontFamily('Tajawal').setFontSize(12).setVerticalAlignment('middle').setFontColor('#1b1f1f');
  sh.getRange(2, SET_COL + 1, 40, 1).setNumberFormat('@');

  // العناوين
  sh.getRange(1, 1, 1, N).setBackground(INK).setFontColor(GREEN).setFontWeight('bold')
    .setFontSize(13).setHorizontalAlignment('center');
  sh.getRange(1, 1, 1, N).setBorder(null, null, true, null, null, null, RED, SpreadsheetApp.BorderStyle.SOLID_THICK);
  sh.setRowHeight(1, 42);
  sh.setFrozenRows(1);
  sh.setFrozenColumns(2);

  [150, 250, 100, 100, 85, 150, 250, 170, 28, 120, 210].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.setRowHeightsForced(2, MAX - 1, 32);

  sh.getRange(2, 1, MAX - 1, N).setBorder(false, false, true, false, false, true, LINE, SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange(2, COL.cat, MAX - 1, 1).setFontWeight('bold').setHorizontalAlignment('right');
  sh.getRange(2, COL.name, MAX - 1, 1).setHorizontalAlignment('right').setFontWeight('bold');
  sh.getRange(2, COL.opt, MAX - 1, 1).setHorizontalAlignment('center').setFontColor('#4a524a');
  sh.getRange(2, COL.price, MAX - 1, 1).setNumberFormat('#,##0" ₺"').setHorizontalAlignment('center').setFontWeight('bold').setFontColor('#2f6b12');

  sh.getRange(1, COL.catTr, MAX, 2).setFontFamily('Readex Pro');
  sh.getRange(1, COL.catTr, 1, 2).setFontFamily('Tajawal');
  sh.getRange(2, COL.catTr, MAX - 1, 2).setBackground('#f7f9f4').setHorizontalAlignment('left').setFontColor('#3a403a');
  sh.getRange(2, COL.img, MAX - 1, 1).setFontColor('#1a73e8').setFontSize(10).setHorizontalAlignment('left').setWrap(false);

  // متوفر
  const avail = sh.getRange(2, COL.avail, MAX - 1, 1);
  avail.setHorizontalAlignment('center').setFontWeight('bold');
  avail.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['نعم', 'لا'], true).setAllowInvalid(false)
    .setHelpText('"نعم" يظهر في المنيو، "لا" يخفيه مؤقتاً.').build());
  const v = sh.getRange(2, COL.name, lastRow - 1, 4).getValues();
  v.forEach((r, i) => { if (r[0] !== '' && r[3] === '') sh.getRange(i + 2, COL.avail).setValue('نعم'); });

  // الخيار: اقتراحات
  sh.getRange(2, COL.opt, MAX - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['عادي', 'دبل', 'كامل', 'نصف', 'كبير', 'وسط', 'صغير'], true).setAllowInvalid(true)
    .setHelpText('نفس اسم الصنف بأكثر من سطر = صنف واحد بعدة خيارات (مثل عادي / دبل). اتركه فارغاً إذا ما في خيارات.').build());

  // القسم: اقتراح الأقسام الموجودة
  const cats = [...new Set(sh.getRange(2, 1, lastRow - 1, 1).getValues().flat().filter(String))];
  if (cats.length) sh.getRange(2, COL.cat, MAX - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(cats, true).setAllowInvalid(true).setHelpText('اختر قسماً موجوداً أو اكتب قسماً جديداً.').build());

  // الإعدادات
  sh.getRange(1, SET_COL, 1, 2).setBackground(RED).setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  sh.getRange(2, SET_COL, SETTINGS.length, 2).setBackground('#f3f9ec')
    .setBorder(true, true, true, true, true, true, '#cfe3b8', SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange(2, SET_COL, SETTINGS.length, 1).setFontWeight('bold');
  sh.getRange(2, SET_COL + 1, SETTINGS.length, 1).setHorizontalAlignment('left');
  sh.getRange(2 + SETTINGS.indexOf('التوصيل'), SET_COL + 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['نعم', 'لا'], true).build());

  // ملاحظات
  sh.getRange(1, COL.opt).setNote('نفس اسم الصنف بأكثر من سطر = صنف واحد بعدة خيارات، مثل عادي / دبل أو كامل / نصف.');
  sh.getRange(1, COL.price).setNote('بعد التعديل يظهر بالمنيو خلال 5 دقائق تقريباً.');
  sh.getRange(1, COL.avail).setNote('"لا" = يختفي من المنيو بدون حذف.');
  sh.getRange(1, COL.catTr).setNote('إذا فاضي بيظهر الاسم العربي بالنسخة التركية.');
  sh.getRange(1, COL.img).setNote('الأسهل: قائمة 🍗 Roast chicken ← رفع صورة. فاضي = بدون صورة.');
  sh.getRange(1, SET_COL + 1).setNote('واتساب: رقم الطلبات دولياً مثل 905xxxxxxxxx+\nيفتح / يسكّر: مثل 11:00 و 02:00\nالتوصيل: نعم أو لا\nرابط الخريطة: رابط Google Maps للمطعم\nإنستغرام / فيسبوك: اسم الحساب أو الرابط\nأي خانة فاضية ما بتظهر بالمنيو.');

  // ألوان
  const rules = [];
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$E2="لا"')
    .setBackground('#f1f1ee').setFontColor('#a3a79f').setStrikethrough(true)
    .setRanges([sh.getRange(2, 1, MAX - 1, 4), sh.getRange(2, COL.catTr, MAX - 1, 2)]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('نعم')
    .setBackground('#e5f4d8').setFontColor('#2f6b12').setRanges([avail]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('لا')
    .setBackground('#fde3e1').setFontColor('#b3261e').setRanges([avail]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($A2<>"",$A2<>$A1,ROW()>2)')
    .setBackground('#e5f4d8').setRanges([sh.getRange(2, 1, MAX - 1, 1)]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($B2<>"",$B2=$B1)')
    .setFontColor('#b8bdb5').setRanges([sh.getRange(2, COL.name, MAX - 1, 1)]).build());
  sh.setConditionalFormatRules(rules);

  SpreadsheetApp.getActive().toast('تم تنسيق الجدول ✔', 'Roast chicken', 5);
}

/* ---------------- الصور ---------------- */

function selectedItem_() {
  const sh = sheet_();
  const row = sh.getActiveRange() ? sh.getActiveRange().getRow() : 0;
  if (row < 2) return null;
  const r = sh.getRange(row, 1, 1, 8).getValues()[0];
  if (!r[1]) return null;
  return { row: row, name: r[1] + (r[2] ? ' - ' + r[2] : '') };
}

function showImageDialog() {
  const it = selectedItem_();
  const ui = SpreadsheetApp.getUi();
  if (!it) { ui.alert('وقّف على سطر الصنف يلي بدك تحطله صورة، وبعدين جرّب مرة تانية.'); return; }
  const t = HtmlService.createTemplate(DIALOG_HTML);
  t.item = it;
  ui.showModalDialog(t.evaluate().setWidth(420).setHeight(470), 'صورة الصنف');
}

function uploadImage(dataUrl, row) {
  const sh = sheet_();
  const name = sh.getRange(row, COL.name).getValue();
  const m = String(dataUrl).match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
  if (!m) throw new Error('الملف مو صورة');
  const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], name + '.jpg');
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const url = 'https://drive.google.com/file/d/' + file.getId() + '/view';
  sh.getRange(row, COL.img).setValue(url);
  return url;
}

function clearImage() {
  const it = selectedItem_();
  if (!it) { SpreadsheetApp.getUi().alert('وقّف على سطر الصنف أولاً.'); return; }
  sheet_().getRange(it.row, COL.img).clearContent();
  SpreadsheetApp.getActive().toast('انحذفت صورة ' + it.name, 'Roast chicken', 5);
}

const DIALOG_HTML = `<!doctype html><html dir="rtl"><head><base target="_top">
<style>
body{font-family:Tajawal,Arial,sans-serif;margin:0;padding:16px;color:#1b1f1f}
h3{margin:0 0 4px;font-size:18px} .sub{color:#6b716b;font-size:13px;margin-bottom:12px}
.box{border:2px dashed #7ac23a;border-radius:14px;background:#f3f9ec;display:grid;place-items:center;height:220px;overflow:hidden;cursor:pointer}
.box img{width:100%;height:100%;object-fit:cover} .box span{color:#2f6b12;font-weight:bold}
input{display:none}
button{margin-top:14px;width:100%;padding:12px;border:0;border-radius:12px;background:#7ac23a;color:#10200a;font-weight:bold;font-size:16px;cursor:pointer}
button[disabled]{opacity:.5;cursor:default}
.msg{margin-top:10px;font-size:13px;text-align:center;min-height:18px}
</style></head><body>
<h3><?= item.name ?></h3>
<div class="sub">اختر صورة من جهازك، وبتنرفع وبتنحط بالمنيو لحالها.</div>
<label class="box" id="box"><span>📷 اكبس لاختيار صورة</span><input type="file" id="f" accept="image/*"></label>
<button id="go" disabled>رفع الصورة</button>
<div class="msg" id="msg"></div>
<script>
var row = <?= item.row ?>, data = null;
var f = document.getElementById('f'), box = document.getElementById('box'), go = document.getElementById('go'), msg = document.getElementById('msg');
f.onchange = function(){
  var file = f.files[0]; if (!file) return;
  var img = new Image(), rd = new FileReader();
  rd.onload = function(e){ img.src = e.target.result; };
  img.onload = function(){
    var max = 1000, w = img.width, h = img.height, s = Math.min(1, max / Math.max(w, h));
    var c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    data = c.toDataURL('image/jpeg', 0.82);
    box.innerHTML = '<img src="' + data + '">'; box.appendChild(f);
    go.disabled = false; msg.textContent = '';
  };
  rd.readAsDataURL(file);
};
go.onclick = function(){
  go.disabled = true; msg.textContent = 'عم ترتفع الصورة…';
  google.script.run
    .withSuccessHandler(function(){ msg.textContent = '✔ تم! بتظهر بالمنيو خلال 5 دقائق تقريباً.'; setTimeout(function(){ google.script.host.close(); }, 1800); })
    .withFailureHandler(function(e){ msg.textContent = 'صار خطأ: ' + e.message; go.disabled = false; })
    .uploadImage(data, row);
};
</script></body></html>`;
