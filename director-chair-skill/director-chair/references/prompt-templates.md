# Prompt templates

Prompts are English, inside a code block, plain text (no markdown inside the prompt).

## Video prompt

```
REFERENCES: @Image1 = [role] | @Image2 = [role] | …   (or: none — text to video)
STYLE: [the project's locked style, verbatim when the bible has one] Smooth, professional feature quality.
CHARACTERS: [Name — key visual identity (age, face, hair, costume, colors)][; voice signature, lip-sync only]
PROPS: [prop — current state]   (only if relevant)
SETTING & LIGHT: [place, period, time of day, light direction and quality, weather, color mood]
SHOT 1 (0–3s) — [shot size], [angle], [lens], [camera move]: [precise action, acting, and animation or physics notes]
SHOT 2 (3–7s) — …
SHOT 3 (7–Ns) — …
DIALOGUE (lip-synced):            (lip-sync mode only)
[time] Name (voice signature): "…" — [tone]
SFX: [synced sound effects and ambience]
AUDIO: [Voice-over is added in editing; no one speaks on screen. | Dialogue and sound effects only.] NO music, no background score.
FINAL FRAME: [exact held pose, framing and expression]
AVOID: on-screen text, subtitles, logos, watermarks, extra characters, costume or color changes, distorted hands or faces, morphing, random motion, camera shake, [music], [lip movement or talking | non-speaking characters moving lips].
```

Notes:
- Single-shot mode (Kling / "لقطة واحدة"): one `SHOT 1 (0–Ns)` block describing the progression over time (beginning → middle → end) with one camera move.
- Start/End mode: `REFERENCES: @Image1 = start frame | @Image2 = end frame`, then one continuous shot travelling from the first to the second.
- Linking frame: `@Image1 = linking frame (last frame of the previous clip)`, and SHOT 1 opens exactly on it.

## Image prompt

```
REFERENCES: Image 1 = [what to take: face, hair, outfit…] | Image 2 = [place / style] | …   (omit when there are no references)
[Subject and identity lock] → [pose, action, expression] → [composition: shot size, angle, lens, framing, negative space for later text if needed] → [environment and period details] → [lighting and time of day] → [color palette] → [medium, style and texture]. Aspect ratio [X:Y].
AVOID: text, letters, captions, logos, watermarks, extra people, distorted hands or faces, style drift.
```

Write it as flowing, precise description (not a keyword list), following the tool's preference in `tools.md`.

## Long vs short
- Short keeps every shot, timing, reference, identity, dialogue line, FINAL FRAME and AVOID line. It cuts adjectives and repetition only.
- Long adds richer acting, lighting, texture, camera and physics detail, never new story events.
