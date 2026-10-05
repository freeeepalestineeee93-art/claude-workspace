// تشغيل Chromium موحّد لكل أدوات الرندر.
// بالبيئة السحابية منستعمل المتصفح المثبّت مسبقاً بدل ما ننزّل واحد جديد.
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const CANDIDATES = [process.env.CHROME_PATH, '/opt/pw-browsers/chromium'].filter(Boolean);

export function chromePath() {
  return CANDIDATES.find((p) => existsSync(p)); // undefined → Playwright يستعمل متصفحه
}

export function launch(opts = {}) {
  return chromium.launch({
    executablePath: chromePath(),
    args: [
      '--use-angle=swiftshader', // WebGL بدون GPU
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--font-render-hinting=none', // خط أنعم وثابت بين الأجهزة
      '--disable-lcd-text',
      ...(opts.args || []),
    ],
    ...opts,
  });
}
