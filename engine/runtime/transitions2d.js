// انتقالات Canvas بين مشهدين: a = المشهد الطالع، b = الداخل، p = التقدم 0..1 (بعد الـ ease)
// dir = اتجاه حركة المحتوى. الافتراضي "right": بالعربي المشهد الجاي بيدخل من اليسار (متل تقليب الصفحات RTL).

const vec = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

function blurDraw(ctx, img, x, y, amt, horizontal = true) {
  if (amt < 0.5) return ctx.drawImage(img, x, y);
  // blur اتجاهي تقريبي: نسخ متعددة مزاحة (motion blur للـ whip)
  const n = Math.min(12, Math.ceil(amt / 6) + 3);
  const a = ctx.globalAlpha;
  for (let i = 0; i < n; i++) {
    const o = (i / (n - 1) - 0.5) * amt;
    ctx.globalAlpha = a / n * 1.0;
    ctx.globalCompositeOperation = i ? 'lighter' : ctx.globalCompositeOperation;
    ctx.drawImage(img, x + (horizontal ? o : 0), y + (horizontal ? 0 : o));
  }
  ctx.globalAlpha = a;
  ctx.globalCompositeOperation = 'source-over';
}

export const transitions2d = {
  cut(ctx, a, b, p) { ctx.drawImage(p < 0.5 ? a : b, 0, 0); },

  fade(ctx, a, b, p) {
    ctx.drawImage(a, 0, 0);
    ctx.globalAlpha = p; ctx.drawImage(b, 0, 0); ctx.globalAlpha = 1;
  },

  // عبور من خلال لون (أسود/أبيض/لون الهوية)
  dip(ctx, a, b, p, o) {
    const { W, H } = o;
    ctx.drawImage(p < 0.5 ? a : b, 0, 0);
    ctx.globalAlpha = 1 - Math.abs(p * 2 - 1);
    ctx.fillStyle = o.color ?? '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  },

  flash(ctx, a, b, p, o) {
    const { W, H } = o;
    ctx.drawImage(p < 0.35 ? a : b, 0, 0);
    const f = p < 0.35 ? p / 0.35 : 1 - (p - 0.35) / 0.65;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = f ** 1.5;
    ctx.fillStyle = o.color ?? '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  },

  // المشهد الجديد بيدفع القديم
  push(ctx, a, b, p, o) {
    const [dx, dy] = vec[o.dir ?? 'right'];
    const { W, H } = o;
    const blur = o.blur ?? 0;
    const speed = Math.sin(p * Math.PI) * blur;
    ctx.save();
    blurDraw(ctx, a, dx * W * p, dy * H * p, speed, dx !== 0);
    blurDraw(ctx, b, -dx * W * (1 - p), -dy * H * (1 - p), speed, dx !== 0);
    ctx.restore();
  },

  // whip pan: push سريع مع motion blur قوي
  whip(ctx, a, b, p, o) { transitions2d.push(ctx, a, b, p, { blur: o.W * 0.12, ...o }); },

  // المشهد الجديد بيغطي القديم (القديم بيتحرك شوي بس — parallax)
  slide(ctx, a, b, p, o) {
    const [dx, dy] = vec[o.dir ?? 'right'];
    const { W, H } = o;
    ctx.drawImage(a, dx * W * p * 0.3, dy * H * p * 0.3);
    ctx.fillStyle = `rgba(0,0,0,${0.35 * p})`; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 80;
    ctx.drawImage(b, -dx * W * (1 - p), -dy * H * (1 - p));
    ctx.restore();
  },

  // زوم لجوّا: القديم بيكبر وبيختفي، الجديد بيجي من حجم أصغر
  zoom(ctx, a, b, p, o) {
    const { W, H } = o;
    const k = o.amount ?? 0.35;
    const draw = (img, s, al, blur = 0) => {
      ctx.save(); ctx.globalAlpha = al;
      if (blur > 0.3) ctx.filter = `blur(${blur}px)`;
      ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.drawImage(img, -W / 2, -H / 2); ctx.restore();
    };
    draw(a, 1 + k * p * 2, 1, p * 18);
    draw(b, 1 - k * (1 - p), Math.min(1, p * 1.6), (1 - p) * 18);
  },

  // مسح بحافة ناعمة
  wipe(ctx, a, b, p, o) {
    const { W, H } = o;
    const [dx, dy] = vec[o.dir ?? 'right'];
    const soft = o.soft ?? 0.08;
    ctx.drawImage(a, 0, 0);
    const m = document.createElement('canvas'); m.width = W; m.height = H;
    const mx = m.getContext('2d');
    mx.drawImage(b, 0, 0);
    mx.globalCompositeOperation = 'destination-in';
    const len = dx ? W : H;
    const pos = p * (1 + soft) * len;
    const g = dx > 0 || dy > 0
      ? mx.createLinearGradient(dx ? pos - soft * len : 0, dy ? pos - soft * len : 0, dx ? pos : 0, dy ? pos : 0)
      : mx.createLinearGradient(dx ? W - pos + soft * len : 0, dy ? H - pos + soft * len : 0, dx ? W - pos : 0, dy ? H - pos : 0);
    g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
    mx.fillStyle = g; mx.fillRect(0, 0, W, H);
    ctx.drawImage(m, 0, 0);
  },

  // دائرة بتكبر من نقطة (افتراضياً الوسط)
  iris(ctx, a, b, p, o) {
    const { W, H } = o;
    const [cx, cy] = o.at ?? [W / 2, H / 2];
    const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
    ctx.drawImage(a, 0, 0);
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R * p, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(b, 0, 0); ctx.restore();
    if (o.ring) {
      ctx.strokeStyle = o.ring; ctx.lineWidth = 18 * (1 - p);
      ctx.beginPath(); ctx.arc(cx, cy, R * p, 0, Math.PI * 2); ctx.stroke();
    }
  },

  // مستطيل بزوايا ناعمة بيكبر (متل فتح تطبيق)
  shape(ctx, a, b, p, o) {
    const { W, H } = o;
    const [cx, cy] = o.at ?? [W / 2, H / 2];
    const w = (o.from?.[0] ?? 120) + (W * 1.05 - (o.from?.[0] ?? 120)) * p;
    const h = (o.from?.[1] ?? 120) + (H * 1.05 - (o.from?.[1] ?? 120)) * p;
    const x = cx + (W / 2 - cx) * p - w / 2, y = cy + (H / 2 - cy) * p - h / 2;
    ctx.drawImage(a, 0, 0);
    ctx.fillStyle = `rgba(0,0,0,${0.4 * p})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, (o.radius ?? 60) * (1 - p)); ctx.clip();
    ctx.drawImage(b, 0, 0);
    ctx.restore();
  },

  // شرائط بتسكّر بتأخير متدرّج
  blinds(ctx, a, b, p, o) {
    const { W, H } = o;
    const n = o.count ?? 7;
    const vertical = (o.dir ?? 'right') === 'right' || o.dir === 'left';
    ctx.drawImage(a, 0, 0);
    for (let i = 0; i < n; i++) {
      const delay = (i / n) * 0.5;
      const q = Math.min(1, Math.max(0, (p - delay) / 0.5));
      const eased = 1 - (1 - q) ** 3;
      if (vertical) {
        const bw = W / n, x = o.dir === 'left' ? i * bw : W - (i + 1) * bw;
        ctx.drawImage(b, x, 0, bw * eased, H, x, 0, bw * eased, H);
      } else {
        const bh = H / n, y = i * bh;
        ctx.drawImage(b, 0, y, W, bh * eased, 0, y, W, bh * eased);
      }
    }
  },

  // تقسيم الشاشة لنصّين بينفتحوا
  split(ctx, a, b, p, o) {
    const { W, H } = o;
    ctx.drawImage(b, 0, 0);
    const vertical = o.axis !== 'h';
    if (vertical) {
      ctx.drawImage(a, 0, 0, W / 2, H, -W / 2 * p, 0, W / 2, H);
      ctx.drawImage(a, W / 2, 0, W / 2, H, W / 2 + W / 2 * p, 0, W / 2, H);
    } else {
      ctx.drawImage(a, 0, 0, W, H / 2, 0, -H / 2 * p, W, H / 2);
      ctx.drawImage(a, 0, H / 2, W, H / 2, 0, H / 2 + H / 2 * p, W, H / 2);
    }
  },

  // تقطيع glitch: شرائح أفقية بتنزاح عشوائياً
  glitch(ctx, a, b, p, o) {
    const { W, H } = o;
    const src = p < 0.5 ? a : b;
    const k = Math.sin(p * Math.PI);
    ctx.drawImage(src, 0, 0);
    let s = Math.floor(p * 37) + 1;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const n = 14;
    for (let i = 0; i < n; i++) {
      if (r() > 0.55 * k + 0.1) continue;
      const y = r() * H, h = (0.01 + r() * 0.07) * H;
      const off = (r() - 0.5) * W * 0.25 * k;
      ctx.drawImage(r() > 0.5 ? a : b, 0, y, W, h, off, y, W, h);
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.25 * k;
    ctx.drawImage(src, 14 * k, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  },

  // تكبير ودوران خفيف للقديم (zoom out + spin) مع ظهور الجديد
  spin(ctx, a, b, p, o) {
    const { W, H } = o;
    ctx.drawImage(b, 0, 0);
    ctx.save(); ctx.globalAlpha = 1 - p;
    ctx.translate(W / 2, H / 2); ctx.rotate((o.angle ?? 25) * Math.PI / 180 * p); ctx.scale(1 + p * 0.6, 1 + p * 0.6);
    ctx.filter = `blur(${p * 20}px)`; ctx.drawImage(a, -W / 2, -H / 2); ctx.restore();
  },
};
