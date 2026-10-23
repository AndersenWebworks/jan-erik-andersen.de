# Erzeugt skizze.png: Bleistift-Wireframe der Website (Bildschirmblatt in der Bauphase). Einmalig: python skizze.py
import random
from PIL import Image, ImageDraw, ImageFilter
random.seed(7)
W, H = 1920, 1080
im = Image.new("RGB", (W, H), (247, 249, 252))
d = ImageDraw.Draw(im)
def stroke(p0, p1, w=5, col=(88, 98, 116)):
    for k in range(2):
        j = lambda: random.uniform(-2.5, 2.5)
        d.line([(p0[0] + j() - 10 * k, p0[1] + j()), (p1[0] + j() + 8 * k, p1[1] + j())], fill=col, width=w - k)
def rect(x0, y0, x1, y1, w=5):
    stroke((x0, y0), (x1, y0), w); stroke((x1, y0), (x1, y1), w); stroke((x1, y1), (x0, y1), w); stroke((x0, y1), (x0, y0), w)
rect(120, 60, 1800, 1020)
stroke((120, 170), (1800, 170), 4)
stroke((200, 100), (460, 100), 7); stroke((200, 130), (330, 130), 4)
for i in range(5): stroke((600 + i * 150, 115), (690 + i * 150, 115), 5)
rect(1560, 85, 1740, 145)
stroke((220, 250), (560, 250), 4)
for i, y in enumerate(range(330, 560, 70)):
    stroke((220, y), (1000 - (i % 2) * 140, y), 14, (74, 84, 102))
rect(220, 640, 520, 700)
rect(1180, 230, 1700, 700); stroke((1180, 230), (1700, 700), 3); stroke((1700, 230), (1180, 700), 3)
for x in (220, 700, 1180):
    rect(x, 780, x + 440, 980)
    stroke((x + 30, 830), (x + 120, 830), 7, (170, 40, 60))
    stroke((x + 30, 880), (x + 380, 880), 5); stroke((x + 30, 920), (x + 300, 920), 5)
im = im.filter(ImageFilter.GaussianBlur(0.8))
im.save("skizze.png")
