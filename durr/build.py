"""يجمع المنصّة في ملف HTML واحد مستقلّ (dist/durr.html) قابل للفتح مباشرة أو للنشر.

الاستخدام:  python3 build.py
"""
from pathlib import Path

ROOT = Path(__file__).parent
FONTS = ('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400'
         '&family=Alexandria:wght@500;700;800&family=Readex+Pro:wght@300;400;600;700&display=swap')


def read(p):
    return (ROOT / p).read_text(encoding='utf-8')


def body():
    css = read('css/style.css')
    js = '\n'.join(read(p) for p in ('js/data-lessons.js', 'js/data-games.js', 'js/app.js'))
    return (
        '<title>الدر الثمين التفاعلي</title>\n'
        f'<link rel="stylesheet" href="{FONTS}">\n'
        f'<style>\n{css}\n</style>\n'
        '<div id="app" dir="rtl" lang="ar"></div>\n'
        f'<script>\n{js}\n</script>\n'
    )


def main():
    dist = ROOT / 'dist'
    dist.mkdir(exist_ok=True)
    inner = body()
    # نسخة مستقلة كاملة (للفتح من الجهاز أو الرفع على أي استضافة)
    (dist / 'durr.html').write_text(
        '<!doctype html>\n<html lang="ar" dir="rtl">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        + inner.replace('<div id="app"', '</head>\n<body>\n<div id="app"', 1) + '</body>\n</html>\n',
        encoding='utf-8')
    # جسم الصفحة فقط (للنشر كـ Artifact، حيث يُضاف الهيكل تلقائياً)
    (dist / 'artifact.html').write_text(inner, encoding='utf-8')
    print('built', (dist / 'durr.html').stat().st_size, 'bytes')


if __name__ == '__main__':
    main()
