"""Convert the supplied CFF outlines to TrueType for reliable PDF embedding.
The original OTF remains unchanged and is used by the browser.
Requires fonttools (pip install fonttools).
"""
from fontTools.ttLib import TTFont
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from pathlib import Path
root = Path(__file__).resolve().parents[1]
source = TTFont(root / 'public/fonts/SS-GEO-CHALK-AllCaps.otf')
glyph_set = source.getGlyphSet()
builder = FontBuilder(source['head'].unitsPerEm, isTTF=True)
builder.setupGlyphOrder(source.getGlyphOrder())
builder.setupCharacterMap(source.getBestCmap())
glyphs = {}
for name in source.getGlyphOrder():
    pen = TTGlyphPen(glyph_set)
    converter = Cu2QuPen(pen, max_err=0.5, reverse_direction=True)
    glyph_set[name].draw(converter)
    glyphs[name] = pen.glyph()
builder.setupGlyf(glyphs)
builder.setupHorizontalMetrics(source['hmtx'].metrics)
builder.setupHorizontalHeader(ascent=source['hhea'].ascent, descent=source['hhea'].descent)
builder.font['name'] = source['name']
builder.setupOS2(sTypoAscender=source['OS/2'].sTypoAscender, sTypoDescender=source['OS/2'].sTypoDescender, usWinAscent=source['OS/2'].usWinAscent, usWinDescent=source['OS/2'].usWinDescent)
builder.setupPost()
builder.setupMaxp()
builder.save(root / 'public/fonts/SS-GEO-CHALK-AllCaps-pdf.ttf')
