"""
Builds the app icons from one design, the same mark as src/components/BrandMark.tsx:
a white Hebrew alef and a softer Latin A on the brand square, with one light glow
circle in the top corner.

The letters are Rubik ExtraBold (SIL Open Font License, Google Fonts), turned into
outlines so the SVGs in assets/brand need no font. Rubik is not shipped with the app.

    python3 scripts/brand/make-icons.py path/to/Rubik[wght].ttf

Writes assets/brand/*.svg and, with rsvg-convert (brew install librsvg),
assets/icon.png, adaptive-icon.png, splash-icon.png and favicon.png.
"""

import subprocess
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "assets"
BRAND = ASSETS / "brand"

PRIMARY = "#4F46E5"  # theme.colors.primary (light)
WEIGHT = 800  # BrandMark uses fontWeight '800'
GLYPH_EM = 0.42  # BrandMark: fontSize = size * 0.42
GAP = 2 / 88  # BrandMark: 2 px gap at its default size of 88
LATIN_OPACITY = 0.78
GLOW = {"cx": 0.85, "cy": 0.10, "r": 0.45, "opacity": 0.12}  # BrandMark's glow view
RADIUS = 0.27  # BrandMark corner radius, for the rounded variants


def glyph_outline(font: TTFont, char: str, scale: float, dx: float, dy: float) -> str:
    """SVG path of one character, scaled from font units and flipped to y-down."""
    glyph_set = font.getGlyphSet()
    name = font.getBestCmap()[ord(char)]
    pen = SVGPathPen(glyph_set)
    glyph_set[name].draw(TransformPen(pen, (scale, 0, 0, -scale, dx, dy)))
    return pen.getCommands()


def glyph_box(font: TTFont, char: str):
    glyph_set = font.getGlyphSet()
    name = font.getBestCmap()[ord(char)]
    pen = BoundsPen(glyph_set)
    glyph_set[name].draw(pen)
    return pen.bounds  # (xMin, yMin, xMax, yMax) in font units, y-up


def letters(font: TTFont, size: float, fill_scale: float = 1.0) -> str:
    """The alef and A, side by side and centered on a size×size canvas."""
    upm = font["head"].unitsPerEm
    scale = size * GLYPH_EM * fill_scale / upm
    gap = size * GAP * fill_scale
    a = glyph_box(font, "א")
    b = glyph_box(font, "A")
    wa = (a[2] - a[0]) * scale
    wb = (b[2] - b[0]) * scale
    top = max(a[3], b[3]) * scale
    bottom = min(a[1], b[1]) * scale
    left = (size - (wa + gap + wb)) / 2
    baseline = size / 2 + (top + bottom) / 2
    alef = glyph_outline(font, "א", scale, left - a[0] * scale, baseline)
    latin = glyph_outline(font, "A", scale, left + wa + gap - b[0] * scale, baseline)
    return (
        f'<path d="{alef}" fill="#FFFFFF"/>'
        f'<path d="{latin}" fill="#FFFFFF" fill-opacity="{LATIN_OPACITY}"/>'
    )


def svg(size: int, body: str, rounded: bool) -> str:
    clip = ""
    group_open = "<g>"
    if rounded:
        r = size * RADIUS
        clip = f'<defs><clipPath id="c"><rect width="{size}" height="{size}" rx="{r:.1f}"/></clipPath></defs>'
        group_open = '<g clip-path="url(#c)">'
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
        f"{clip}{group_open}{body}</g></svg>\n"
    )


def square(font: TTFont, size: int) -> str:
    glow = (
        f'<circle cx="{size * GLOW["cx"]:.1f}" cy="{size * GLOW["cy"]:.1f}" r="{size * GLOW["r"]:.1f}" '
        f'fill="#FFFFFF" fill-opacity="{GLOW["opacity"]}"/>'
    )
    return f'<rect width="{size}" height="{size}" fill="{PRIMARY}"/>{glow}{letters(font, size)}'


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    font = instantiateVariableFont(TTFont(sys.argv[1]), {"wght": WEIGHT})
    BRAND.mkdir(parents=True, exist_ok=True)

    sources = {
        # iOS masks the corners itself, so the store icon is a full square.
        "icon.svg": svg(1024, square(font, 1024), rounded=False),
        # Rounded mark for the splash screen and the browser tab.
        "mark.svg": svg(1024, square(font, 1024), rounded=True),
        # Android draws the background color (#4F46E5); keep the letters in the 66% safe zone.
        "adaptive-icon.svg": svg(1024, letters(font, 1024, fill_scale=0.8), rounded=False),
    }
    for name, text in sources.items():
        (BRAND / name).write_text(text)

    renders = [
        ("icon.svg", "icon.png", 1024),
        ("adaptive-icon.svg", "adaptive-icon.png", 1024),
        ("mark.svg", "splash-icon.png", 512),
        ("mark.svg", "favicon.png", 48),
    ]
    for src, out, px in renders:
        subprocess.run(
            ["rsvg-convert", "-w", str(px), "-h", str(px), "-o", str(ASSETS / out), str(BRAND / src)],
            check=True,
        )
    print("wrote", ", ".join(out for _, out, _ in renders))


if __name__ == "__main__":
    main()
