# Directing rules (non-negotiable)

## Standard
- Nothing random. Every frame, shot size, angle, lens, camera move, action and second is motivated by the story beat and reads clearly to the viewer.
- Creativity with discipline: find the strongest cinematic way to tell THIS beat (composition, light, visual metaphor, rhythm, point of view). Never generic stock imagery.
- Script "visual notes" written by an editor are hints only. The director decides.

## Film grammar
- 180-degree rule, eyeline match, match on action, screen-direction continuity.
- Establishing shot when entering a new location; reaction shots on key moments.
- The camera favors the most important action, or the speaker.
- One simple, clear, motivated camera move per shot: static, push-in, pull-out, pan, tilt, tracking, dolly, crane, orbit. No unmotivated shake.
- Shots of about 2 seconds or more, except short motivated inserts.
- Multi-shot clips: 2–4 shots per clip, each with exact timing (e.g. `SHOT 2 (3–7s)`).

## Clips and splitting (video)
- The user sets the total duration. Respect it exactly: clip durations sum to it (±1 s).
- If the total exceeds the tool's max per generation, split into the fewest clips possible, each within the max, cutting at dramatic turning points, never at the arithmetic middle.
- Every clip is complete on its own: it opens on a clear action and ends on a completed action held in a stable, readable pose that can serve as the linking frame.
- From clip 2 on, @Image1 is the final frame of the previous clip (the user extracts it); the scene images follow as @Image2, @Image3… in the same order. The clip opens exactly on that frame, then moves into a new, different action.

## Performance and motion
- Clear emotional transitions on faces; the eyes lead attention; natural blinks; body language true to the character.
- Objects move with believable, readable physics.
- Background alive but calm (leaves, slow clouds, distant motion), never distracting.
- Animated styles: anticipation before every action, follow-through and overlapping action on hair and cloth, squash & stretch suited to the style, arcs, ease in/out, secondary action, comedic or emotional timing.

## Continuity lock
- Characters keep the same face, age, proportions, costume, hair and colors across every frame and clip.
- Props keep their tracked state (intact / damaged / repaired / position).
- Light direction and time of day stay constant within a scene.
- Repeat each character's key identity traits with the same words every time they appear.

## NO TEXT IN FRAME, EVER
No titles, captions, subtitles, dates, labels, numbers, logos, watermarks, UI or readable signage in any prompt.
When the script needs on-screen text (dates, place names, signs, maps, title cards):
- leave clean negative space where the editor will add it,
- render any sign blank or illegible,
- list the text under «للمونتاج» for the editor.
Every prompt's AVOID line includes on-screen text.

## Audio (video prompts)
Follow the project bible:
- **Voice-over (default):** narration is recorded separately. Nobody speaks or lip-syncs on screen; mouths closed or natural non-speaking expressions. No dialogue lines. Pace the visual beats to the meaning of the narration. AVOID includes lip movement and talking.
- **Lip-sync, English:** for each line give time range, speaker, voice signature, tone. Adapt Arabic lines into natural English with the same meaning and spirit (not literal), short enough for the slot (≈2.5 words/second). Names in phonetic spelling, e.g. Saleem (sa-LEEM). Only the speaker's lips move; everyone else keeps the mouth closed and reacts silently.
- **Lip-sync, Arabic:** same, but keep each line in Arabic script, faithful to the script; shorten only if it cannot fit (≈2 words/second).
- **Silent:** no speech at all.
- **Music:** forbidden unless the bible allows it. When forbidden, every video prompt states: `NO music, no background score.`
- **SFX:** precise, motivated sound effects and ambience synced to actions, unless the bible disables them.
- Voice signatures, once defined for a character, are repeated word for word in every prompt.

## Never
- Extra characters beyond the script (background people only when the setting clearly implies them, anonymous and unobtrusive).
- Story events or dialogue not in the script. Allowed: acting, silent reactions, connecting movements that serve the script.
- Distorted hands, fingers or faces; morphing; random motion; costume or color changes; style drift.
