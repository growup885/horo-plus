"""Cut the cookie characters out of the platform's gradient JPG backgrounds.

Usage: cutout.py <src_dir> <out_dir>
For every <id>.jpg it writes <id>.png (RGBA, transparent background) and a
preview sheet <id>_preview.png (original | on dark | on light).
"""
import sys
import os
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage as ndi

DARK_BG = (0x26, 0x27, 0x2b)
LIGHT_BG = (0xf4, 0xf4, 0xf8)


def poly_terms(xs, ys, deg):
    cols = []
    for i in range(deg + 1):
        for j in range(deg + 1 - i):
            cols.append((xs ** i) * (ys ** j))
    return np.stack(cols, axis=-1)


def fit_background(img, deg=3, iters=10):
    """Robust polynomial fit of the smooth gradient; foreground = outliers."""
    h, w, _ = img.shape
    ys, xs = np.mgrid[0:h, 0:w]
    xs = xs / float(w)
    ys = ys / float(h)
    A = poly_terms(xs, ys, deg).reshape(-1, (deg + 1) * (deg + 2) // 2)
    Y = img.reshape(-1, 3)
    idx = np.arange(0, A.shape[0], 5)  # subsample for the fit
    inl = np.ones(len(idx), bool)
    thr = 70.0
    coef = None
    for _ in range(iters):
        Ai, Yi = A[idx][inl], Y[idx][inl]
        coef, *_ = np.linalg.lstsq(Ai, Yi, rcond=None)
        pred = A[idx] @ coef
        res = np.abs(pred - Y[idx]).max(axis=1)
        thr = max(14.0, thr * 0.7)
        inl = res < thr
        if inl.sum() < 2000:
            break
    full = (A @ coef).reshape(h, w, 3)
    return full


def cutout(path, deg=3, seed_T=26, canny=(22, 60), barrier=3, min_area=250, erode=1, strict_resid=0):
    """Background = region connected to the image border without crossing an outline.
    Characters are enclosed by dark outlines, so a flood fill from the border
    swallows every background shape (stripes, gradients) and stops at them."""
    im = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    h, w, _ = im.shape
    bgfit = fit_background(im, deg)
    resid = np.abs(im - bgfit).max(axis=2)
    gray = cv2.cvtColor(im.astype(np.uint8), cv2.COLOR_RGB2GRAY)
    gray = cv2.GaussianBlur(gray, (0, 0), 1.0)
    edges = cv2.Canny(gray, canny[0], canny[1])
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (barrier, barrier))
    wall = cv2.dilate(edges, k) > 0
    free = ~wall
    lab, n = ndi.label(free)
    # seeds: border pixels that are free AND look like the smooth background
    seed = np.zeros((h, w), bool)
    seed[0, :] = seed[-1, :] = seed[:, 0] = seed[:, -1] = True
    seed &= free & (resid < seed_T)
    keep = np.zeros(n + 1, bool)
    keep[np.unique(lab[seed])] = True
    keep[0] = False
    bgmask = keep[lab]
    fg = ~bgmask
    if strict_resid:
        fg = fg & (resid > strict_resid)
    else:
        fg = ndi.binary_fill_holes(fg)
    l2, n2 = ndi.label(fg)
    if n2:
        sizes = ndi.sum(fg, l2, range(1, n2 + 1))
        kp = np.zeros(n2 + 1, bool)
        kp[1:] = sizes >= min_area
        fg = kp[l2]
    mask = ndi.binary_erosion(fg, iterations=erode) if erode else fg
    alpha = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), 1.0)
    alpha = np.clip((alpha - 0.12) / 0.76, 0, 1)
    solid = ndi.binary_erosion(mask, iterations=2)
    if solid.any():
        _, (iy, ix) = ndi.distance_transform_edt(~solid, return_indices=True)
        fgc = im[iy, ix]
    else:
        fgc = im
    rgb = np.where(solid[..., None], im, fgc)
    out = np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8)
    return im, out


def over(rgba, color):
    a = rgba[..., 3:4].astype(np.float32) / 255.0
    base = np.empty_like(rgba[..., :3], dtype=np.float32)
    base[...] = color
    return (rgba[..., :3] * a + base * (1 - a)).astype(np.uint8)


def main(src, dst, ids=None, **kw):
    os.makedirs(dst, exist_ok=True)
    for f in sorted(os.listdir(src)):
        if not f.endswith(".jpg"):
            continue
        name = f[:-4]
        if ids and name not in ids:
            continue
        orig, rgba = cutout(os.path.join(src, f), **kw)
        Image.fromarray(rgba).save(os.path.join(dst, name + ".png"))
        sheet = np.concatenate([
            orig.astype(np.uint8), over(rgba, DARK_BG), over(rgba, LIGHT_BG)], axis=0)
        Image.fromarray(sheet).resize((sheet.shape[1] // 2, sheet.shape[0] // 2),
                                       Image.LANCZOS).save(os.path.join(dst, name + "_preview.png"))
        print(name, "coverage %.0f%%" % (100 * (rgba[..., 3] > 127).mean()))


if __name__ == "__main__":
    ids = sys.argv[3].split(",") if len(sys.argv) > 3 else None
    main(sys.argv[1], sys.argv[2], ids)
