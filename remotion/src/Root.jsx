// تسجيل تلقائي: كل projects/<مشروع>/rvideos/<اسم>/index.jsx بيصير Composition باسم "<مشروع>-<اسم>".
// الملف بيصدّر: default (المكوّن) و meta = { fps, width, height, duration (ثواني), audio? }.
import React from 'react';
import { Composition } from 'remotion';

const ctx = import.meta.webpackContext('../../projects', { recursive: true, regExp: /\/rvideos\/[^/]+\/index\.jsx$/ });

export const videos = ctx.keys().map((k) => {
  const m = ctx(k);
  const [, project, name] = k.match(/^\.\/([^/]+)\/rvideos\/([^/]+)\//);
  const meta = { fps: 30, width: 1080, height: 1920, duration: 10, ...m.meta };
  return { id: `${project}-${name}`.replace(/[^a-zA-Z0-9-]/g, '-'), project, name, meta, component: m.default };
});

export const Root = () => <>
  {videos.map((v) => (
    <Composition key={v.id} id={v.id} component={v.component} fps={v.meta.fps} width={v.meta.width} height={v.meta.height}
      durationInFrames={Math.round(v.meta.duration * v.meta.fps)}
      defaultProps={{ audio: v.meta.audio ?? null, project: v.project, name: v.name }} />
  ))}
</>;
