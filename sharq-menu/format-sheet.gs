/**
 * تنسيق جدول أسعار منيو فروج الشرق
 * الاستخدام: إضافات ← Apps Script ← الصق هذا الكود ← احفظ ← شغّل formatMenuSheet
 * آمن للتشغيل أكثر من مرة، ولا يغيّر أي بيانات أو عناوين.
 */
function formatMenuSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName('menu-prices') || ss.getSheets()[0];

  const CHARCOAL = '#2f2f31';
  const YELLOW = '#f5c516';
  const LINE = '#d9d6cc';
  const COLS = 5;
  const lastRow = Math.max(sh.getLastRow(), 2);
  const MAX = Math.max(lastRow + 150, 300); // مساحة لأصناف جديدة

  if (sh.getMaxRows() < MAX) sh.insertRowsAfter(sh.getMaxRows(), MAX - sh.getMaxRows());
  if (sh.getMaxColumns() > COLS) sh.deleteColumns(COLS + 1, sh.getMaxColumns() - COLS);

  // اتجاه من اليمين لليسار، بدون خطوط الشبكة
  sh.setRightToLeft(true);
  sh.setHiddenGridlines(true);
  sh.setTabColor(YELLOW);

  // الخط العام
  const all = sh.getRange(1, 1, MAX, COLS);
  all.clearFormat();
  all.setFontFamily('Tajawal').setFontSize(12).setVerticalAlignment('middle')
     .setFontColor('#1f1f21');
  all.clearDataValidations();

  // سطر العناوين
  const head = sh.getRange(1, 1, 1, COLS);
  head.setBackground(CHARCOAL).setFontColor(YELLOW).setFontWeight('bold')
      .setFontSize(13).setHorizontalAlignment('center');
  sh.setRowHeight(1, 42);
  sh.setFrozenRows(1);

  // أعرض الأعمدة
  sh.setColumnWidth(1, 150); // القسم
  sh.setColumnWidth(2, 290); // الصنف
  sh.setColumnWidth(3, 110); // السعر
  sh.setColumnWidth(4, 95);  // متوفر
  sh.setColumnWidth(5, 150); // الرمز
  sh.setRowHeightsForced(2, MAX - 1, 32);

  const body = sh.getRange(2, 1, MAX - 1, COLS);
  body.setBorder(false, false, true, false, false, true, LINE, SpreadsheetApp.BorderStyle.SOLID);

  // القسم: غامق، والصنف: عادي
  sh.getRange(2, 1, MAX - 1, 1).setFontWeight('bold').setHorizontalAlignment('right');
  sh.getRange(2, 2, MAX - 1, 1).setHorizontalAlignment('right');

  // السعر: رقم مع علامة الليرة
  sh.getRange(2, 3, MAX - 1, 1).setNumberFormat('#,##0" ₺"')
    .setHorizontalAlignment('center').setFontWeight('bold');

  // متوفر: قائمة منسدلة نعم / لا
  const avail = sh.getRange(2, 4, MAX - 1, 1);
  avail.setHorizontalAlignment('center').setFontWeight('bold');
  avail.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['نعم', 'لا'], true)
      .setAllowInvalid(false)
      .setHelpText('اختر "نعم" ليظهر الصنف في المنيو، أو "لا" لإخفائه مؤقتاً.')
      .build()
  );
  // أي سطر جديد فيه صنف بدون قيمة بياخد "نعم"
  const vals = sh.getRange(2, 2, lastRow - 1, 3).getValues();
  vals.forEach((r, i) => {
    if (r[0] !== '' && r[2] === '') sh.getRange(i + 2, 4).setValue('نعم');
  });

  // القسم: قائمة مقترحة من الأقسام الموجودة (بيقبل قسم جديد مع تنبيه)
  const cats = [...new Set(sh.getRange(2, 1, lastRow - 1, 1).getValues().flat().filter(String))];
  if (cats.length) {
    sh.getRange(2, 1, MAX - 1, 1).setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(cats, true)
        .setAllowInvalid(true)
        .setHelpText('اختر قسماً موجوداً، أو اكتب اسم قسم جديد ليظهر كقسم جديد في المنيو.')
        .build()
    );
  }

  // الرمز: رمادي وصغير، مع ملاحظة
  sh.getRange(2, 5, MAX - 1, 1).setFontColor('#9a978e').setFontSize(10)
    .setFontFamily('Roboto Mono').setHorizontalAlignment('center');
  sh.getRange(1, 5).setNote('لا تعدّل هذا العمود: يربط كل صنف بصورته. للصنف الجديد اتركه فارغاً.');
  sh.getRange(1, 4).setNote('"لا" = يختفي الصنف من المنيو بدون حذفه.');
  sh.getRange(1, 3).setNote('بعد تغيير السعر يظهر في المنيو خلال 5 دقائق تقريباً.');

  // ألوان حسب الحالة
  const rules = [];
  const rowRange = sh.getRange(2, 1, MAX - 1, 4);
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$D2="لا"')
    .setBackground('#f3f1ec').setFontColor('#a8a59c').setStrikethrough(true)
    .setRanges([rowRange]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('نعم').setBackground('#e3f5e9').setFontColor('#1e7a45')
    .setRanges([avail]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('لا').setBackground('#fde5e2').setFontColor('#b3261e')
    .setRanges([avail]).build());
  // خط فاصل أصفر بين الأقسام
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($A2<>"",$A2<>$A1,ROW()>2)')
    .setBackground('#fff8dc')
    .setRanges([sh.getRange(2, 1, MAX - 1, 1)]).build());
  sh.setConditionalFormatRules(rules);

  SpreadsheetApp.getActive().toast('تم تنسيق الجدول ✔', 'فروج الشرق', 5);
}
