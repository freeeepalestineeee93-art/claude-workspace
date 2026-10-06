// أساسيات مشتركة لكل فيديوهات Remotion عنا.
// الأصول (صور، خطوط، صوت) بتنقرا من سيرفر الاستوديو (engine/server.js) اللي بيشغّله أمر الرندر،
// فما في نسخ لمجلد public. المسارات دايماً من جذر الريبو: asset('projects/kashaf/assets/x.png').
import { getInputProps, staticFile } from 'remotion';

export const base = () => getInputProps()?.base ?? '';
export const asset = (p) => (base() ? `${base()}/${p.replace(/^\//, '')}` : staticFile(p));

// زمن بالثواني (أسهل للكتابة والقراءة من الفريمات)
export const sec = (frame, fps) => frame / fps;
export const clamp = (u, a = 0, b = 1) => Math.max(a, Math.min(b, u));
export const lerp = (a, b, k) => a + (b - a) * k;
// ease-in-out بأي قوة (2 = ناعم، 3 = cubic، 5 = قوي)
export const inOut = (u, p = 3) => { u = clamp(u); return u < 0.5 ? 2 ** (p - 1) * u ** p : 1 - (-2 * u + 2) ** p / 2; };
export const out = (u, p = 3) => 1 - (1 - clamp(u)) ** p;
// hash حتمي (بدل Math.random)
export const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
