"""Generates DailyMe launcher/splash icons (matches the Play Store listing icon)."""
import math
from PIL import Image, ImageDraw

OUT = "assets"
SS = 4  # supersampling


def gradient(size, top, bottom):
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        for x in range(size):
            px[x, y] = c
    return img


def art(size, box, mono=False):
    """Return RGBA artwork centred in `size`, fitted to `box` fraction of the canvas."""
    S = size * SS
    u = S * box / 10000.0  # one art unit (1/100 of the art box) in px
    ox = oy = S * (1 - box / 100.0) / 2

    def P(x, y):
        return (ox + x * u, oy + y * u)

    def line(d, a, b, w):
        (x1, y1), (x2, y2) = P(*a), P(*b)
        d.line([(x1, y1), (x2, y2)], fill=255, width=int(w * u))
        r = w * u / 2
        for (x, y) in ((x1, y1), (x2, y2)):
            d.ellipse([x - r, y - r, x + r, y + r], fill=255)

    blue = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(blue)
    line(d, (50, 16), (22, 64), 15)
    line(d, (50, 16), (78, 64), 15)
    r = 6.5 * u
    cx, cy = P(50, 54)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)

    teal = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(teal)
    pts = []
    for i in range(0, 101):
        a = math.radians(28 + (152 - 28) * i / 100)
        pts.append(P(50 + 21 * math.cos(a), 60 + 21 * math.sin(a)))
    for p in pts:
        rr = 5.5 * u / 2
        d.ellipse([p[0] - rr, p[1] - rr, p[0] + rr, p[1] + rr], fill=255)

    if mono:
        m = Image.new("L", (S, S), 0)
        m.paste(255, mask=blue)
        m.paste(255, mask=teal)
        out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        out.paste((0, 0, 0, 255), mask=m)
    else:
        out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        out.paste(gradient(S, (0, 140, 255), (10, 90, 220)), mask=blue)
        out.paste(gradient(S, (30, 205, 195), (20, 180, 185)), mask=teal)
    return out.resize((size, size), Image.LANCZOS)


def main():
    N = 1024
    white = Image.new("RGBA", (N, N), (255, 255, 255, 255))
    icon = white.copy()
    icon.alpha_composite(art(N, 70))
    icon.convert("RGB").save(f"{OUT}/icon.png")

    fg = art(N, 56)  # inside adaptive-icon safe zone (66%)
    fg.save(f"{OUT}/android-icon-foreground.png")
    Image.new("RGBA", (N, N), (255, 255, 255, 255)).save(f"{OUT}/android-icon-background.png")
    art(N, 56, mono=True).save(f"{OUT}/android-icon-monochrome.png")
    art(N, 60).save(f"{OUT}/splash-icon.png")
    fav = white.copy()
    fav.alpha_composite(art(N, 80))
    fav.resize((48, 48), Image.LANCZOS).convert("RGB").save(f"{OUT}/favicon.png")


main()
