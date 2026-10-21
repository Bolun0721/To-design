"""生成 demo 照片：巷口咖啡馆，窗边的一杯手冲。
程序化绘制的氛围静物（2x 超采样 + 景深 + 胶片颗粒），不依赖外部素材。
"""
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageOps
import numpy as np
import math, random

S = 2
W, H = 1600 * S, 1200 * S
random.seed(3)
np.random.seed(3)

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

img = Image.new("RGB", (W, H), "#120c09")
px = img.load()
for y in range(H):
    t = y / H
    row = lerp((46, 33, 24), (12, 8, 6), min(1, t * 1.3))
    for x in range(0, W, 2):
        v = int(4 * math.sin(x / 520 + y / 800))
        c = (max(0, row[0] + v), max(0, row[1] + v), max(0, row[2] + v))
        px[x, y] = c
        if x + 1 < W:
            px[x + 1, y] = c

# 窗光
win = Image.new("L", (W, H), 0)
dw = ImageDraw.Draw(win)
dw.rectangle([220, 90, 1480, 1280], fill=210)
dw.rectangle([820, 90, 900, 1280], fill=0)
dw.rectangle([220, 660, 1480, 705], fill=0)
win = win.filter(ImageFilter.GaussianBlur(180))
warm = Image.new("RGB", (W, H), (238, 202, 152))
img = Image.composite(ImageChops.add(img, warm.point(lambda v: int(v * 0.55))), img, win)

# 背景散景
bokeh = Image.new("RGB", (W, H), "black")
db = ImageDraw.Draw(bokeh)
for cx, cy, rr, col in [
    (1980, 380, 120, (230, 186, 120)), (2190, 560, 70, (205, 158, 92)),
    (1770, 300, 52, (240, 205, 150)), (2470, 460, 92, (200, 150, 85)),
    (2680, 300, 44, (230, 180, 110)), (1520, 220, 36, (240, 210, 160)),
    (2850, 600, 60, (190, 140, 80)),
]:
    db.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=col)
bokeh = bokeh.filter(ImageFilter.GaussianBlur(36))
img = ImageChops.add(img, bokeh.point(lambda v: int(v * 0.45)))

# 桌面
table = Image.new("RGB", (W, H), "black")
dt = ImageDraw.Draw(table)
dt.rectangle([0, 1420, W, H], fill=(92, 58, 38))
dt.rectangle([0, 1420, W, 1462], fill=(138, 94, 60))
table = table.filter(ImageFilter.GaussianBlur(12))
img = Image.blend(img, table, 0.65)

# 木纹
grain = Image.new("L", (W, H), 0)
dg = ImageDraw.Draw(grain)
for i in range(40):
    y = 1450 + i * 29 + random.randint(-7, 7)
    pts = [(x, y + int(6 * math.sin(x / 430 + i))) for x in range(0, W, 60)]
    dg.line(pts, fill=random.randint(8, 24), width=random.randint(2, 5))
grain = grain.filter(ImageFilter.GaussianBlur(8))
img = Image.composite(Image.new("RGB", (W, H), (54, 33, 21)), img, grain)

# 桌面反光
glow = Image.new("RGB", (W, H), "black")
dg2 = ImageDraw.Draw(glow)
dg2.ellipse([480, 1300, 2300, 2000], fill=(118, 92, 64))
glow = glow.filter(ImageFilter.GaussianBlur(240))
img = ImageChops.add(img, glow.point(lambda v: int(v * 0.5)))

# 碟子
plate_mask = Image.new("L", (W, H), 0)
dp = ImageDraw.Draw(plate_mask)
dp.ellipse([1120, 1640, 2260, 2050], fill=255)
plate_mask = plate_mask.filter(ImageFilter.GaussianBlur(3))
plate = Image.new("RGB", (W, H), (204, 192, 174))
pg = Image.new("L", (W, H), 0)
dpg = ImageDraw.Draw(pg)
for i in range(80):
    t = i / 80
    dpg.ellipse([1120 + 260 * t, 1640 + 95 * t, 2260 - 260 * t, 2050 - 95 * t], fill=int(110 + 120 * t))
plate = Image.composite(plate, Image.new("RGB", (W, H), (152, 139, 120)), pg.filter(ImageFilter.GaussianBlur(30)))
img = Image.composite(plate, img, plate_mask)
ring = Image.new("L", (W, H), 0)
dr = ImageDraw.Draw(ring)
dr.ellipse([1240, 1690, 2140, 2000], outline=52, width=6)
ring = ring.filter(ImageFilter.GaussianBlur(4))
img = Image.composite(Image.new("RGB", (W, H), (118, 106, 90)), img, ring)

# 杯底接触阴影
contact = Image.new("L", (W, H), 0)
dco = ImageDraw.Draw(contact)
dco.ellipse([1370, 1660, 2070, 1900], fill=150)
contact = contact.filter(ImageFilter.GaussianBlur(48)).point(lambda v: int(v * 0.5))
img = Image.composite(Image.new("RGB", (W, H), (26, 17, 11)), img, contact)

# 杯柄（先画，杯体压住左侧）
handle = Image.new("L", (W, H), 0)
dh = ImageDraw.Draw(handle)
dh.ellipse([1880, 1320, 2200, 1740], outline=255, width=64)
handle = handle.filter(ImageFilter.GaussianBlur(3))
hshadow = handle.filter(ImageFilter.GaussianBlur(30)).point(lambda v: int(v * 0.5))
img = Image.composite(Image.new("RGB", (W, H), (14, 9, 6)), img, hshadow)
img = Image.composite(Image.new("RGB", (W, H), (198, 187, 170)), img, handle)
# 柄受光面
hlight = Image.new("L", (W, H), 0)
dhl = ImageDraw.Draw(hlight)
dhl.ellipse([1876, 1316, 2060, 1736], outline=255, width=18)
hlight = hlight.filter(ImageFilter.GaussianBlur(6))
img = Image.composite(Image.new("RGB", (W, H), (238, 229, 213)), img, hlight)

# 杯体：3/4 视角，上宽下窄
body = Image.new("L", (W, H), 0)
dbd = ImageDraw.Draw(body)
dbd.polygon([(1330, 1250), (2010, 1250), (1980, 1740), (1940, 1810),
             (1420, 1810), (1380, 1740)], fill=255)
dbd.ellipse([1330, 1160, 2010, 1380], fill=255)
dbd.ellipse([1380, 1710, 1980, 1830], fill=255)
body = body.filter(ImageFilter.GaussianBlur(2))

# 明暗：左上受光
shade = Image.new("L", (W, H), 0)
dsh = ImageDraw.Draw(shade)
dsh.ellipse([1180, 1080, 1880, 1780], fill=255)
dsh.ellipse([1600, 1180, 2350, 1900], fill=0)
shade = shade.filter(ImageFilter.GaussianBlur(200))
cup = Image.new("RGB", (W, H), (150, 138, 122))
cup = Image.composite(Image.new("RGB", (W, H), (247, 240, 227)), cup, shade)
# 细微色温
cup = Image.blend(cup, Image.new("RGB", (W, H), (232, 218, 198)), 0.18)
img = Image.composite(cup, img, body)

# 杯口（椭圆，带厚度）
rim_outer = Image.new("L", (W, H), 0)
dro = ImageDraw.Draw(rim_outer)
dro.ellipse([1326, 1156, 2014, 1384], fill=255)
rim_inner = Image.new("L", (W, H), 0)
dri = ImageDraw.Draw(rim_inner)
dri.ellipse([1400, 1206, 1940, 1342], fill=255)
rim = ImageChops.subtract(rim_outer, rim_inner).filter(ImageFilter.GaussianBlur(2))
img = Image.composite(Image.new("RGB", (W, H), (245, 237, 223)), img, rim)

# 咖啡液面
cofmask = Image.new("L", (W, H), 0)
dcf = ImageDraw.Draw(cofmask)
dcf.ellipse([1398, 1204, 1942, 1344], fill=255)
cofmask = cofmask.filter(ImageFilter.GaussianBlur(3))
coffee = Image.new("RGB", (W, H), (56, 30, 17))
cref = Image.new("RGB", (W, H), (88, 50, 28))
dcref = ImageDraw.Draw(cref)
dcref.ellipse([1470, 1220, 1900, 1320], fill=(104, 62, 34))
dcref.arc([1410, 1206, 1930, 1340], 190, 345, fill=(168, 120, 76), width=9)
cref = cref.filter(ImageFilter.GaussianBlur(16))
coffee = Image.blend(coffee, cref, 0.55)
img = Image.composite(coffee, img, cofmask)

# 液面高光
spec = Image.new("L", (W, H), 0)
dsp = ImageDraw.Draw(spec)
dsp.ellipse([1460, 1210, 1610, 1270], fill=150)
dsp.ellipse([1820, 1226, 1890, 1260], fill=110)
spec = spec.filter(ImageFilter.GaussianBlur(13))
img = Image.composite(Image.new("RGB", (W, H), (214, 186, 150)), img, spec)

# 杯体高光条
hl = Image.new("L", (W, H), 0)
dhl2 = ImageDraw.Draw(hl)
dhl2.arc([1360, 1180, 2010, 1390], 190, 300, fill=230, width=12)
hl = hl.filter(ImageFilter.GaussianBlur(15))
img = Image.composite(Image.new("RGB", (W, H), (255, 248, 236)), img, hl)

# 热气
steam = Image.new("RGBA", (W, H), (0, 0, 0, 0))
dst = ImageDraw.Draw(steam)
for i, (x0, amp, top) in enumerate([(1580, 44, 720), (1670, 60, 660), (1770, 38, 760)]):
    pts = []
    for y in range(1180, top, -10):
        t = (1180 - y) / (1180 - top)
        x = x0 + math.sin(t * 5.2 + i * 1.7) * amp * t
        pts.append((x, y))
    dst.line(pts, fill=(255, 248, 236, 40), width=13, joint="curve")
steam = steam.filter(ImageFilter.GaussianBlur(24))
img.paste(steam, (0, 0), steam)

# 前景景深
fore = img.crop((0, int(H * 0.91), W, H)).filter(ImageFilter.GaussianBlur(28))
img.paste(fore, (0, int(H * 0.91)))

# 色彩
arr = np.asarray(img).astype(np.float32)
arr[..., 0] *= 1.04
arr[..., 2] *= 0.93
img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

# 转为暖黑白（老报纸照片质感）
gray = img.convert("L")
gray = ImageOps.autocontrast(gray, cutoff=0.6)
gray = ImageOps.colorize(gray, black=(16, 12, 9), white=(240, 233, 219), mid=(122, 110, 94))

# 裁切到 4:3，主体略偏右
cw, ch = int(H * 4 / 3), H
left = int((W - cw) * 0.56)
gray = gray.crop((left, 0, left + cw, H))
W2, H2 = gray.size

# 暗角
vignette = Image.new("L", (W2, H2), 0)
dv = ImageDraw.Draw(vignette)
dv.ellipse([-W2 * 0.18, -H2 * 0.18, W2 * 1.18, H2 * 1.18], fill=255)
vignette = vignette.filter(ImageFilter.GaussianBlur(360))
gray = Image.composite(gray, Image.new("RGB", (W2, H2), (8, 6, 5)), vignette.point(lambda v: int(30 + v * 0.86)))

# 胶片颗粒
arr = np.asarray(gray).astype(np.float32)
noise = np.random.normal(0, 8.0, (H2, W2, 1)).repeat(3, axis=2)
gray = Image.fromarray(np.clip(arr + noise, 0, 255).astype(np.uint8))

gray = gray.resize((1400, 1050), Image.LANCZOS)
gray.save("public/demo/coffee.jpg", quality=91, optimize=True)
print("saved", gray.size)

