"""Build the 'Печенька+' set: transparent cut-outs tuned for dark and light themes."""
import os, sys
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(__file__))
import cutout as C

SRC, OUT = sys.argv[1], sys.argv[2]
OVERRIDES = {
    "1": dict(barrier=7, canny=(18, 50)),
    "4": dict(strict_resid=14),
    "32": dict(strict_resid=14),
}
DIGITS = {"4", "32"}

def lum(a): return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]

def dark_variant(rgba, digits_mask=None):
    rgb = rgba[..., :3].astype(np.float32)
    L = lum(rgb)
    # 1) lift near-black / navy strokes so they stay visible on a dark card
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    brown = (r - b) > 18                      # keep brown cookie outlines as they are
    t = np.clip((78 - L) / 78.0, 0, 1) * 0.72
    neutral = (np.abs(r - g) < 14) & (np.abs(g - b) < 14)   # black, not navy
    t = np.where(brown, 0, np.where(neutral, t * 0.5, t))[..., None]
    target = np.array([152, 146, 204], np.float32)
    rgb = rgb + (target - rgb) * t
    # 2) calm down pure white (lab coat, carton, glass) so it does not glare
    L2 = lum(rgb)
    w = np.clip((L2 - 205) / 50.0, 0, 1)[..., None] * 0.16
    rgb = rgb * (1 - w) + np.array([172, 172, 196], np.float32) * w
    out = rgba.copy(); out[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    return out

def light_variant(rgba, digits_mask=None):
    out = rgba.copy()
    if digits_mask is not None:
        rgb = out[..., :3].astype(np.float32)
        teal = np.array([34, 158, 118], np.float32)
        rgb[digits_mask] = teal
        out[..., :3] = rgb.astype(np.uint8)
    return out

def digit_components(alpha):
    lab, n = ndi.label(alpha > 40)
    if n == 0: return np.zeros(alpha.shape, bool)
    sizes = ndi.sum(alpha > 40, lab, range(1, n + 1))
    keep = np.zeros(n + 1, bool); keep[1:] = sizes < 9000
    return keep[lab]

os.makedirs(os.path.join(OUT, "dark"), exist_ok=True)
os.makedirs(os.path.join(OUT, "light"), exist_ok=True)
for f in sorted(os.listdir(SRC)):
    if not f.endswith(".jpg"): continue
    name = f[:-4]
    kw = OVERRIDES.get(name, {})
    orig, rgba = C.cutout(os.path.join(SRC, f), **kw)
    hh, ww = rgba.shape[:2]
    yy, xx = np.mgrid[0:hh, 0:ww]
    R = 26
    for cy, cx in ((0, 0), (0, ww - 1), (hh - 1, 0), (hh - 1, ww - 1)):
        rgba[..., 3][(yy - cy) ** 2 + (xx - cx) ** 2 < R * R] = 0
    dm = digit_components(rgba[..., 3]) if name in DIGITS else None
    Image.fromarray(dark_variant(rgba, dm)).resize((984, 384), Image.LANCZOS).save(os.path.join(OUT, "dark", name + ".png"), optimize=True)
    Image.fromarray(light_variant(rgba, dm)).resize((984, 384), Image.LANCZOS).save(os.path.join(OUT, "light", name + ".png"), optimize=True)
    print(name, "ok")
