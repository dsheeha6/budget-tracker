"""Generates the app icons in public/ and the favicon.

Design: indigo tile with a budget "donut" ring, 75% white (spent) and
25% green (left). Run from the project root:  python scripts/make-icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
TOP = (99, 102, 241)  # indigo-500
BOTTOM = (67, 56, 202)  # indigo-700
WHITE = (255, 255, 255)
GREEN = (52, 211, 153)  # emerald-400
SCALE = 4  # draw big, then shrink, for smooth edges


def draw_icon(size: int) -> Image.Image:
    s = size * SCALE
    img = Image.new("RGB", (s, s))
    draw = ImageDraw.Draw(img)

    # Vertical gradient background (full bleed: iOS and Android round the corners).
    for y in range(s):
        t = y / (s - 1)
        color = tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM))
        draw.line([(0, y), (s, y)], fill=color)

    # Ring stays inside the central 80% so it also works as a maskable icon.
    radius = s * 0.30
    width = round(s * 0.10)
    box = [s / 2 - radius, s / 2 - radius, s / 2 + radius, s / 2 + radius]
    gap = 8  # degrees between the two segments
    draw.arc(box, start=-90 + gap / 2, end=180 - gap / 2, fill=WHITE, width=width)
    draw.arc(box, start=180 + gap / 2, end=270 - gap / 2, fill=GREEN, width=width)

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    public = ROOT / "public"
    public.mkdir(exist_ok=True)
    for size, name in [
        (192, "icon-192.png"),
        (512, "icon-512.png"),
        (180, "apple-touch-icon.png"),
    ]:
        draw_icon(size).save(public / name, optimize=True)

    # Next.js only reads RGBA icons inside .ico files.
    draw_icon(256).convert("RGBA").save(ROOT / "src" / "app" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("Icons written to public/ and src/app/favicon.ico")


if __name__ == "__main__":
    main()
