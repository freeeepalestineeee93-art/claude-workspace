# findit 🔎

أداة صغيرة للماك بتلاقيلك مكان أي ملف من اسمه، **بدون ما تعتمد على Spotlight**
(بتمشي مباشرة على الملفات، فبتشتغل حتى لو فهرس Spotlight خربان).

## التثبيت (مرة وحدة)

افتح **Terminal** واكتب:

```bash
cd ~/Downloads/claude-workspace/findit   # أو وين ما نزّلت المجلد
./install.sh
```

## الاستخدام

```bash
findit invoice              # كل ملف اسمه فيه "invoice" داخل مجلدك الشخصي
findit "report*.pdf"        # بتقبل * — مثلاً كل ملفات PDF اللي بتبلش بـ report
findit -a passport          # بحث بكل الجهاز (أبطأ)
findit -d ~/Desktop cv      # بحث داخل مجلد معيّن
findit -e notes.txt         # الاسم بالضبط
```

بتطلعلك النتائج مرقّمة، وبعدين بتكتب رقم الملف وبيفتحلك مكانه بالـ Finder مباشرة.

## ملاحظات
- ما بتفرّق بين الأحرف الكبيرة والصغيرة.
- بتتخطّى مجلدات ما فيها ملفاتك (سلة المحذوفات، Caches، node_modules، .git) لتكون أسرع.
- إذا طلعتلك رسالة إن Terminal ما عنده صلاحية لمجلدات متل Desktop أو Documents:
  System Settings ← Privacy & Security ← Full Disk Access ← فعّل Terminal.
