const fs = require('node:fs')
const fontkit = require('@pdf-lib/fontkit')
const files = {
  title: 'amatic-sc-latin-700-normal.woff',
  hand: 'patrick-hand-latin-400-normal.woff',
  georgian: 'Geo-Gorda-Unicode.ttf',
  georgianTitle: 'SS-GEO-CHALK-AllCaps.otf',
  georgianIngredients: 'Geo-Gorda-Unicode.ttf',
}
const metrics = {}
for (const [name, file] of Object.entries(files)) {
  const font = fontkit.create(fs.readFileSync(`public/fonts/${file}`))
  metrics[name] = Object.fromEntries(font.characterSet.map(code => [String.fromCodePoint(code), font.glyphForCodePoint(code).advanceWidth / font.unitsPerEm]))
}
// Match browser fallback for mixed Georgian / Latin recipes and fraction symbols.
for (const name of ['georgian', 'georgianTitle', 'georgianIngredients']) metrics[name] = { ...metrics.hand, ...metrics[name] }
fs.writeFileSync('src/data/font-metrics.json', JSON.stringify(metrics))
