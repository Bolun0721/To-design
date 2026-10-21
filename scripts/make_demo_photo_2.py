"""生成 demo 次图：窗光与墙面的细节。
与 coffee.jpg 不同的场景，用于经典大报「主图 + 次图」演示。
"""
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageOps
import numpy as np
import math, random

W, H = 1400, 1050
random.seed(21)
np.random.seed(21)

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

# 暖灰墙面
img = Image.new("RGB", (W, H), "#3a332a")
px = img.load()
for y in range(H):
    t = y / H
    row = lerp((92, 81, 66), (40, 34, 27), t * 1.2)
    for x in range(0, W, 2):
        v = int(3 * math.sin(x / 300 + y / 500))
        c = (max(0, row[0] + v), max(0, row[1] + v), max(0, row[2] + v))
        px[x, y] = c
        if x + 1 < W:
            px[x + 1, y] = c

# 窗光：左侧亮矩形
win = Image.new("L", (W, H), 0)
d = ImageDraw.Draw(win)
d.rectangle([90, 40, 760, 780], fill=235)
d.rectangle([420, 40, 463, 780], fill=0)
d.rectangle([90, 355, 760, 392], fill=0)
win = win.filter(ImageFilter.GaussianBlur(85))
light = Image.new("RGB", (W, H), (246, 233, 207))
img = Image.composite(ImageChops.add(img, light.point(lambda v: int(v * 0.6))), img, win)

# 窗框投影：斜向暗带
shadow = Image.new("L", (W, H), 0)
ds = ImageDraw.Draw(shadow)
ds.polygon([(760, 40), (980, 40), (1180, 780), (960, 780)], fill=120)
ds.polygon([(760, 355), (1180, 355), (1180, 392), (760, 392)], fill=80)
shadow = shadow.filter(ImageFilter.GaussianBlur(28))
img = Image.composite(Image.new("RGB", (W, H), (24, 19, 14)), img, shadow)

# 桌面
table = Image.new("RGB", (W, H), (86, 60, 42))
mask = Image.new("L", (W, H), 0)
dm = ImageDraw.Draw(mask)
dm.rectangle([0, 830, W, H], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(12))
img = Image.composite(table, img, mask)
# 桌沿高光
hl = Image.new("L", (W, H), 0)
dh = ImageDraw.Draw(hl)
dh.rectangle([0, 826, W, 842], fill=180)
hl = hl.filter(ImageFilter.GaussianBlur(7))
img = Image.composite(Image.new("RGB", (W, H), (166, 145, 118)), img, hl)

# 前景植物叶子（右下）
leaf = Image.new("L", (W, H), 0)
dl = ImageDraw.Draw(leaf)
for i, (cx, cy, rx, ry, ang) in enumerate([
    (1080, 900, 210, 70, -18),
    (1170, 830, 150, 54, 20),
    (980, 790, 120, 44, -55),
]):
    box = Image.new("L", (W, H), 0)
    db = ImageDraw.Draw(box)
    db.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255)
    box = box.rotate(ang, center=(cx, cy), resample=Image.BICUBIC)
    leaf = ImageChops.lighter(leaf, box)
leaf = leaf.filter(ImageFilter.GaussianBlur(17))
img = Image.composite(Image.new("RGB", (W, H), (22, 25, 17)), img, leaf)

# 前景景深
fore = img.crop((0, int(H * 0.9), W, H)).filter(ImageFilter.GaussianBlur(20))
img.paste(fore, (0, int(H * 0.9)))

# 暖黑白
gray = ImageOps.autocontrast(img.convert("L"), cutoff=0.5)
gray = ImageOps.colorize(gray, black=(20, 16, 12), white=(242, 234, 220), mid=(126, 113, 95))

# 暗角
vignette = Image.new("L", (W, H), 0)
dv = ImageDraw.Draw(vignette)
dv.ellipse([-W * 0.18, -H * 0.18, W * 1.18, H * 1.18], fill=255)
vignette = vignette.filter(ImageFilter.GaussianBlur(380))
gray = Image.composite(gray, Image.new("RGB", (W, H), (8, 6, 5)), vignette.point(lambda v: int(25 + v * 0.88)))

# 颗粒
arr = np.asarray(gray).astype(np.float32)
noise = np.random.normal(0, 7.5, (H, W, 1)).repeat(3, axis=2)
gray = Image.fromarray(np.clip(arr + noise, 0, 255).astype(np.uint8))

gray.save("public/demo/coffee-2.jpg", quality=91, optimize=True)
print("saved", gray.size)
