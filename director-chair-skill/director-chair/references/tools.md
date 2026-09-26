# Generation tools

Read only the section for the requested tool. If the user names a tool not listed here, write a clean, tool-neutral prompt using the closest family below and say so in one line.

## Video

### Seedance 2.5 / Seedance 2.0
- Max per generation: **15 s**. No extend feature: every clip must be complete on its own.
- Multi-shot in one clip: timed `SHOT n (a–bs)` blocks, 2–4 shots.
- Uploaded images are referenced as `@Image1`, `@Image2`… in upload order. Start with a `REFERENCES:` line giving each image's role.
- Best choice for a full scene with several shots.

### Kling 3.0
- Max per generation: **15 s** (use the length the user sets).
- Best for **one continuous shot** or **start frame → end frame**.
- Describe how the motion progresses over time, with one clear camera move.
- Start/End mode: the first uploaded image is the start frame, the second is the end frame. Describe the path between them; the end state must match the end frame exactly.
- Keep the shot to a single continuous take (no cuts).

## Image

### Nano Banana Pro
Understands long natural-language briefs and several reference images very well. Write a coherent descriptive brief. State explicitly which reference controls identity, outfit, place and style.

### Seedream 5.0 Pro
Responds best to clear structured description: subject → action/pose → environment → lighting → camera & lens → style & texture. Refer to references as Image 1, Image 2…

### GPT Image / GPT Image 2.5 Flare / GPT Image 2.5 Sunburst
Follow detailed natural-language instructions literally. State the composition precisely and what must stay identical to each reference. Avoid contradictory adjectives.

## Prompt length limits
Some sites cap prompt length. Every prompt ships in two versions:
- **Video:** long > 5000 characters (target 5200–7000), short < 5000 (target 3400–4800).
- **Image:** long > 2500 characters (target 2700–3800), short < 2500 (target 1500–2400).
A custom cap requested by the user gets a third version.
