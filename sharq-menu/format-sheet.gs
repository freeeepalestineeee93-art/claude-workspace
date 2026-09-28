/**
 * جدول منيو فروج الشرق - الإصدار 2
 * بيضيف: أعمدة التركي، عمود الصورة، خانة الإعدادات، زر رفع الصور، والتنسيق.
 *
 * التركيب: الإضافات ← برمجة التطبيقات ← امسح الكود القديم والصق هذا ← احفظ
 * ← اختر setupMenuSheet من القائمة ← تنفيذ.
 * بعدها بيطلع بالجدول قائمة "🍗 فروج الشرق" فيها رفع الصور والتنسيق.
 */

const HEADERS = ['القسم', 'الصنف', 'السعر', 'متوفر', 'الرمز', 'القسم بالتركي', 'الصنف بالتركي', 'الصورة'];
const SETTINGS = [
  ['واتساب', ''],
  ['هاتف', ''],
  ['يفتح', '10:00'],
  ['يسكّر', '01:00'],
  ['التوصيل', 'نعم'],
];
const SET_COL = 10; // العمود J
const FOLDER_NAME = 'صور منيو فروج الشرق';

const TR_CATS = {"فروج": "Tavuk", "شاورما ساندويش": "Döner Dürüm", "شاورما وجبات": "Döner Menüler", "شاورما فرط": "Porsiyon & Kilo Döner", "وجبات غربي": "Batı Menüleri", "ساندويش": "Dürüm & Sandviç", "همبرجر": "Hamburger", "مقبلات": "Meze & Yan Ürünler", "مشروبات": "İçecekler"};
const TR_ITEMS = { "0QP5JD0R55CFW": "1,5 Broasted Tavuk", "0QW9MD67GBD11": "Pilavlı Yarım Tavuk", "0QP5JD0QX5CCR": "Broasted Menü (Restoranda)", "0QP5JD0R15CDH": "Yarım Broasted Tavuk (Paket)", "0QP5JD0R95CFA": "Yarım Piliç Çevirme (Paket)", "0QP5JD0R55CFZ": "Bütün Broasted Tavuk (Paket)", "0QP5JD0R15CDE": "Yarım Piliç Çevirme (Restoranda)", "0QP5JD0R95CFD": "Bütün Piliç Çevirme (Paket)", "0QP5JD0QS5CCG": "Duble Tavuk Döner Dürüm", "0QYVG8F9RBCZG": "Şam Usulü Parmak Döner", "0QP5JD0QS5CCK": "Tavuk Döner Dürüm", "0QP5JD0QN5CDP": "Mantarlı Kaşarlı Tavuk Döner Dürüm", "0QP5JD0PN5CF1": "Mantarlı Kaşarlı Arap Döner", "0QP5JD0PH5CCK": "İtalyan Döner", "0QP5JD0PS5CFG": "Arap Döner", "0QYSE6A00BE84": "Pilavlı Döner Menü", "0QP5JD0PS5CFD": "Duble Arap Döner", "0QP5JD0PH5CCP": "Pane Döner", "0QYSDYN7WBE7Z": "Porsiyon Döner Menü (200 g)", "0QP5JD0MS5CF1": "1 kg Döner (Paket)", "0QP5JD0MS5CEY": "500 g Döner (Paket)", "0QP5JD0MX5CFM": "Porsiyon Döner (200 g)", "0QP5JD0EH5CCG": "Pilavlı Döner Menü", "0QP5JD0FX5CDX": "Supreme Menü", "0QP5JD0RX5CC8": "Acılı Spicy Menü", "0QP5JD0RN5CDM": "Nugget Menü", "0QP5JD0RH5CDM": "Mexicano Menü", "0QP5JD0RD5CEF": "Crispy Menü", "0QP5JD0RS5CCV": "Şiş Tavuk Menü", "0QP5JD0RS5CCR": "Escalope Menü", "0QP5JD0RD5CEJ": "Kaşarlı Fajita Menü", "0QP5JD0M95CDY": "Fajita Dürüm", "0QP5JD0MD5CDF": "Mexicano Dürüm", "0QP5JD0MD5CDC": "Şiş Tavuk Dürüm", "0QW9PFCRMBD0Q": "Supreme Somun Sandviç", "0QP5JD0MN5CC5": "Crispy Dürüm", "0QP5JD0M15CDP": "Patates Dürüm", "0QP5JD0M95CE1": "Escalope Dürüm", "0QP5JD0M15CDS": "Duble Patates Dürüm", "0QP5JD0MH5CDD": "Duble Crispy Dürüm", "0QP5JD0MH5CDA": "Acılı Spicy Dürüm", "0QP5JD0M55CF7": "Nugget Dürüm", "0QW9KTH20BCYH": "Karışık Hamburger Menü", "0QP5JD0KN5CE3": "Crispy Burger Menü", "0QP5JD0KX5CDC": "Et Hamburger", "0QP5JD0KX5CD9": "Crispy Burger", "0QP5JD0KS5CCY": "Et Hamburger Menü", "0QP5JD0F55CEE": "Pilav Tabağı", "0QYVFMAKCBD2J": "Salata Tabağı", "0QP5JD0HX5CE5": "Humus (350 g)", "0QP5JD0HS5CDK": "Mutebel (Patlıcan Ezmesi)", "0QP5JD0HN5CD4": "Mayonez (250 g)", "0QP5JD0HN5CD1": "Mayonez (150 g)", "0QP5JD0HH5CDG": "Rus Salatası (150 g)", "0QP5JD0HH5CDD": "Acı Sos (150 g)", "0QP5JD0HD5CER": "Büyük Patates Kızartması", "0QP5JD0H95CDF": "Orta Patates Kızartması", "0QP5JD0H55CEH": "Patates Kızartması", "0QP5JD0H55CEE": "Kızarmış Ekmek", "0QW9P6MNRBD0P": "Acı Şalgam (330 ml)", "0QP5JD0GN5CDQ": "Büyük Ayran", "0QP5JD0GH5CE8": "Küçük Ayran", "0QP5JD0GD5CEN": "Plastik Bardak", "0QP5JD0GS5CFV": "Pepsi (330 ml)", "0QP5JD0H15CF3": "Pepsi (2,5 L)", "0QP5JD0H15CF0": "Pepsi (1 L)", "0QP5JD0GX5CE0": "Fanta (2,5 L)", "0QP5JD0GS5CFY": "Fanta (1 L)" };

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName('menu-prices') || ss.getSheets()[0];
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🍗 فروج الشرق')
    .addItem('📷 رفع صورة للصنف المحدد', 'showImageDialog')
    .addItem('🗑️ حذف صورة الصنف المحدد', 'clearImage')
    .addSeparator()
    .addItem('🎨 تنسيق الجدول', 'formatMenuSheet')
    .addItem('⚙️ تجهيز الأعمدة والإعدادات', 'setupMenuSheet')
    .addToUi();
}

/** يضيف الأعمدة الناقصة، يعبّي الترجمة التركية، ويجهّز خانة الإعدادات، ثم ينسّق. */
function setupMenuSheet() {
  const sh = sheet_();
  if (sh.getMaxColumns() < SET_COL + 1) sh.insertColumnsAfter(sh.getMaxColumns(), SET_COL + 1 - sh.getMaxColumns());

  // العناوين: الخمسة الأولى موجودة، نضيف الباقي بمكانه إذا ناقص
  const head = sh.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  HEADERS.forEach((h, i) => { if (head[i] !== h) sh.getRange(1, i + 1).setValue(h); });

  // الترجمة التركية للأصناف والأقسام الموجودة (ما بتمسح أي شي معبّى)
  const last = sh.getLastRow();
  if (last > 1) {
    const rng = sh.getRange(2, 1, last - 1, 7);
    const v = rng.getValues();
    v.forEach(r => {
      if (!r[5] && TR_CATS[r[0]]) r[5] = TR_CATS[r[0]];
      if (!r[6] && TR_ITEMS[r[4]]) r[6] = TR_ITEMS[r[4]];
    });
    sh.getRange(2, 6, v.length, 2).setValues(v.map(r => [r[5], r[6]]));
  }

  // خانة الإعدادات
  sh.getRange(1, SET_COL, 1, 2).setValues([['الإعداد', 'القيمة']]);
  const cur = sh.getRange(2, SET_COL, SETTINGS.length, 2).getValues();
  sh.getRange(2, SET_COL + 1, 30, 1).setNumberFormat('@');
  const out = SETTINGS.map((s, i) => [s[0], cur[i][0] === s[0] && cur[i][1] !== '' ? cur[i][1] : s[1]]);
  sh.getRange(2, SET_COL, out.length, 2).setValues(out);

  formatMenuSheet();
}

function formatMenuSheet() {
  const sh = sheet_();
  const CHARCOAL = '#2f2f31', YELLOW = '#f5c516', LINE = '#e3e0d6';
  const N = HEADERS.length;
  const lastRow = Math.max(sh.getLastRow(), 2);
  const MAX = Math.max(lastRow + 150, 300);
  if (sh.getMaxRows() < MAX) sh.insertRowsAfter(sh.getMaxRows(), MAX - sh.getMaxRows());
  if (sh.getMaxColumns() > SET_COL + 1) sh.deleteColumns(SET_COL + 2, sh.getMaxColumns() - SET_COL - 1);

  sh.setRightToLeft(true);
  sh.setHiddenGridlines(true);
  sh.setTabColor(YELLOW);

  const all = sh.getRange(1, 1, MAX, SET_COL + 1);
  all.clearFormat().clearDataValidations();
  all.setFontFamily('Tajawal').setFontSize(12).setVerticalAlignment('middle').setFontColor('#1f1f21');
  sh.getRange(2, SET_COL + 1, 30, 1).setNumberFormat('@');

  // العناوين
  sh.getRange(1, 1, 1, N).setBackground(CHARCOAL).setFontColor(YELLOW).setFontWeight('bold')
    .setFontSize(13).setHorizontalAlignment('center');
  sh.setRowHeight(1, 42);
  sh.setFrozenRows(1);
  sh.setFrozenColumns(2);

  const widths = [150, 280, 110, 90, 140, 170, 280, 170, 30, 110, 190];
  widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.setRowHeightsForced(2, MAX - 1, 32);

  const body = sh.getRange(2, 1, MAX - 1, N);
  body.setBorder(false, false, true, false, false, true, LINE, SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange(2, 1, MAX - 1, 1).setFontWeight('bold').setHorizontalAlignment('right');
  sh.getRange(2, 2, MAX - 1, 1).setHorizontalAlignment('right');
  sh.getRange(2, 3, MAX - 1, 1).setNumberFormat('#,##0" ₺"').setHorizontalAlignment('center').setFontWeight('bold');

  // التركي: اتجاه يسار لليمين وبخلفية خفيفة لتمييزه
  sh.getRange(1, 6, MAX, 2).setFontFamily('Readex Pro');
  sh.getRange(1, 6, 1, 2).setFontFamily('Tajawal');
  sh.getRange(2, 6, MAX - 1, 2).setBackground('#fbfaf6').setHorizontalAlignment('left').setFontColor('#3a3a3d');
  sh.getRange(2, 6, MAX - 1, 1).setFontWeight('bold');

  // الصورة
  sh.getRange(2, 8, MAX - 1, 1).setFontColor('#1a73e8').setFontSize(10).setHorizontalAlignment('left').setWrap(false);

  // متوفر: قائمة نعم / لا
  const avail = sh.getRange(2, 4, MAX - 1, 1);
  avail.setHorizontalAlignment('center').setFontWeight('bold');
  avail.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['نعم', 'لا'], true).setAllowInvalid(false)
    .setHelpText('"نعم" يظهر الصنف في المنيو، "لا" يخفيه مؤقتاً.').build());
  const v = sh.getRange(2, 2, lastRow - 1, 3).getValues();
  v.forEach((r, i) => { if (r[0] !== '' && r[2] === '') sh.getRange(i + 2, 4).setValue('نعم'); });

  // القسم: اقتراح الأقسام الموجودة
  const cats = [...new Set(sh.getRange(2, 1, lastRow - 1, 1).getValues().flat().filter(String))];
  if (cats.length) sh.getRange(2, 1, MAX - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(cats, true).setAllowInvalid(true)
    .setHelpText('اختر قسماً موجوداً، أو اكتب اسم قسم جديد.').build());

  // الرمز
  sh.getRange(2, 5, MAX - 1, 1).setFontColor('#9a978e').setFontSize(10).setFontFamily('Roboto Mono').setHorizontalAlignment('center');

  // الإعدادات
  const setHead = sh.getRange(1, SET_COL, 1, 2);
  setHead.setBackground(YELLOW).setFontColor(CHARCOAL).setFontWeight('bold').setHorizontalAlignment('center');
  const setBody = sh.getRange(2, SET_COL, SETTINGS.length, 2);
  setBody.setBackground('#fff8dc').setBorder(true, true, true, true, true, true, '#e8d58a', SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange(2, SET_COL, SETTINGS.length, 1).setFontWeight('bold');
  sh.getRange(2, SET_COL + 1, SETTINGS.length, 1).setHorizontalAlignment('left');
  sh.getRange(2, SET_COL + 1, SETTINGS.length, 1).setDataValidation(null);
  sh.getRange(2 + SETTINGS.findIndex(s => s[0] === 'التوصيل'), SET_COL + 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['نعم', 'لا'], true).build());

  // ملاحظات
  sh.getRange(1, 3).setNote('بعد تغيير السعر يظهر في المنيو خلال 5 دقائق تقريباً.');
  sh.getRange(1, 4).setNote('"لا" = يختفي الصنف من المنيو بدون حذفه.');
  sh.getRange(1, 5).setNote('لا تعدّل هذا العمود: يربط كل صنف بصورته الأصلية. للصنف الجديد اتركه فارغاً.');
  sh.getRange(1, 6).setNote('اسم القسم بالتركي. إذا فاضي بيظهر الاسم العربي.');
  sh.getRange(1, 7).setNote('اسم الصنف بالتركي. إذا فاضي بيظهر الاسم العربي.');
  sh.getRange(1, 8).setNote('رابط صورة من Google Drive. الأسهل: قائمة 🍗 فروج الشرق ← رفع صورة. فاضي = الصورة الأصلية.');
  sh.getRange(1, SET_COL + 1).setNote('واتساب: رقم الطلبات بالصيغة الدولية مثل 905xxxxxxxxx+\nيفتح / يسكّر: مثل 10:00 و 01:00\nالتوصيل: نعم أو لا');

  // ألوان الحالة
  const rules = [];
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$D2="لا"')
    .setBackground('#f3f1ec').setFontColor('#a8a59c').setStrikethrough(true)
    .setRanges([sh.getRange(2, 1, MAX - 1, 4), sh.getRange(2, 6, MAX - 1, 2)]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('نعم')
    .setBackground('#e3f5e9').setFontColor('#1e7a45').setRanges([avail]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('لا')
    .setBackground('#fde5e2').setFontColor('#b3261e').setRanges([avail]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($A2<>"",$A2<>$A1,ROW()>2)')
    .setBackground('#fff8dc').setRanges([sh.getRange(2, 1, MAX - 1, 1)]).build());
  sh.setConditionalFormatRules(rules);

  SpreadsheetApp.getActive().toast('تم تنسيق الجدول ✔', 'فروج الشرق', 5);
}

/* ---------------- الصور ---------------- */

function selectedItem_() {
  const sh = sheet_();
  const row = sh.getActiveRange() ? sh.getActiveRange().getRow() : 0;
  if (row < 2) return null;
  const r = sh.getRange(row, 1, 1, 8).getValues()[0];
  if (!r[1]) return null;
  return { row: row, name: r[1], tr: r[6], img: r[7] };
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
  const name = sh.getRange(row, 2).getValue();
  const m = String(dataUrl).match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
  if (!m) throw new Error('الملف مو صورة');
  const blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], name + '.jpg');
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const url = 'https://drive.google.com/file/d/' + file.getId() + '/view';
  sh.getRange(row, 8).setValue(url);
  return url;
}

function clearImage() {
  const it = selectedItem_();
  const ui = SpreadsheetApp.getUi();
  if (!it) { ui.alert('وقّف على سطر الصنف أولاً.'); return; }
  sheet_().getRange(it.row, 8).clearContent();
  SpreadsheetApp.getActive().toast('رجعت الصورة الأصلية لـ ' + it.name, 'فروج الشرق', 5);
}

const DIALOG_HTML = `<!doctype html><html dir="rtl"><head><base target="_top">
<style>
body{font-family:Tajawal,Arial,sans-serif;margin:0;padding:16px;color:#222}
h3{margin:0 0 4px;font-size:18px} .sub{color:#777;font-size:13px;margin-bottom:12px}
.box{border:2px dashed #d9c46a;border-radius:14px;background:#fffbea;display:grid;place-items:center;height:220px;overflow:hidden;cursor:pointer;position:relative}
.box img{width:100%;height:100%;object-fit:cover} .box span{color:#8a7a2a;font-weight:bold}
input{display:none}
button{margin-top:14px;width:100%;padding:12px;border:0;border-radius:12px;background:#f5c516;color:#26220f;font-weight:bold;font-size:16px;cursor:pointer}
button[disabled]{opacity:.5;cursor:default}
.msg{margin-top:10px;font-size:13px;text-align:center;min-height:18px}
</style></head><body>
<h3><?= item.name ?></h3>
<div class="sub">اختر صورة من جهازك، وبتنرفع وبتنحط بالمنيو لحالها.</div>
<label class="box" id="box"><span id="ph">📷 اكبس لاختيار صورة</span><input type="file" id="f" accept="image/*"></label>
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
