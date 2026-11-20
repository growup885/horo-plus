# Печенька+ asset pipeline

Regenerates `assets/cookie-plus/{dark,light}/*.png` from the platform's own
"Печенька" pictures (`https://horodigital.ru/student/images/disciplines/cookie/<subject id>.jpg`).
Not shipped in the extension; only the generated PNGs are.

1. Download the source JPGs into an empty folder (they are named `<subject id>.jpg` and `default.jpg`).
2. `python3 -m venv venv && venv/bin/pip install pillow numpy scipy opencv-python-headless`
3. `venv/bin/python -I build.py <source folder> <output folder>`

`cutout.py` removes the gradient background: the background is the region connected to
the image border that does not cross a dark outline, so the outlined characters survive
and any gradient, stripe or shading around them is dropped. `build.py` then tunes the
result per theme (dark: lift near-black / navy strokes, calm down pure white; light:
colour the binary digits) and scales to 984x384. `OVERRIDES` in `build.py` holds the
per-picture tweaks (History needs a thicker barrier, the binary-digit pictures keep only
pixels that differ from the background).

To add a subject, add its id to `cookie-plus.css` (one `--hp-cp-<id>` variable per theme
plus one per-subject rule).
