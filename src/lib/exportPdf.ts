import { PDFDocument, TextRenderingMode, degrees, popGraphicsState, pushGraphicsState, rgb, setLineWidth, setStrokingColor, setTextRenderingMode } from 'pdf-lib'
import type { PDFImage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { A4, coloringScene, flattenScene, fonts, recipeScene } from '../data/layout'
import type { SceneElement } from '../data/layout'
import type { ExportKind, Recipe, RecipeMode } from '../data/recipe'

const PT = 72 / 25.4
const bytes = new Map<string, Promise<ArrayBuffer>>()
function fetchBytes(src: string) {
  let result = bytes.get(src)
  if (!result) {
    result = fetch(src).then(response => { if (!response.ok) throw new Error(`Could not load ${src}`); return response.arrayBuffer() }).catch(error => { bytes.delete(src); throw error })
    bytes.set(src, result)
  }
  return result
}
const color = (hex: string) => rgb(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255)

export async function createPdf(kind: ExportKind, recipe: Recipe, mode: RecipeMode): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  doc.setTitle(`${recipe.title} - ${kind === 'both' ? 'Recipe & coloring set' : kind === 'recipe' ? 'Recipe page' : 'Coloring page'}`)
  doc.setLanguage(recipe.language)
  doc.setAuthor('Cook & Color')
  doc.setSubject('A4 printable illustrated cookbook')
  const scenes = (kind === 'both' ? [recipeScene(recipe, mode), coloringScene(recipe)] : [kind === 'recipe' ? recipeScene(recipe, mode) : coloringScene(recipe)]).map(flattenScene)
  const imageSources = [...new Set(scenes.flat().filter((element): element is Extract<SceneElement, { type: 'image' }> => element.type === 'image').map(element => element.src))]
  const usedFonts = [...new Set(scenes.flat().filter((item): item is Extract<SceneElement, { type: 'text' }> => item.type === 'text').map(item => item.font))]
  if (!usedFonts.includes('hand')) usedFonts.push('hand')
  if (scenes.flat().some(item => item.type === 'text' && /[\u10a0-\u10ff\u1c90-\u1cbf]/u.test(item.text)) && !usedFonts.includes('georgian')) usedFonts.push('georgian')
  const [fontData, imageData] = await Promise.all([
    Promise.all(usedFonts.map(async key => [key, await fetchBytes(key === 'georgianTitle' ? '/fonts/SS-GEO-CHALK-AllCaps-pdf.ttf' : fonts[key])] as const)),
    Promise.all(imageSources.map(async path => [path, await fetchBytes(path)] as const)),
  ])
  const embeddedFonts = Object.fromEntries(await Promise.all(fontData.map(async ([key, data]) => {
    const metrics = fontkit.create(new Uint8Array(data))
    return [key, { font: await doc.embedFont(data, { subset: true }), ascent: metrics.ascent / metrics.unitsPerEm, descent: metrics.descent / metrics.unitsPerEm, glyphs: new Set<number>(metrics.characterSet) }]
  })))
  const images = new Map<string, PDFImage>(await Promise.all(imageData.map(async ([path, data]) => [path, await doc.embedPng(data)] as const)))
  for (const scene of scenes) {
    const page = doc.addPage([A4.width * PT, A4.height * PT])
    for (const item of scene) {
      if (item.type === 'line') {
        page.drawLine({ start: { x: item.x * PT, y: (297 - item.y) * PT }, end: { x: (item.x + item.w) * PT, y: (297 - item.y) * PT }, thickness: (item.thickness ?? .24) * PT, color: color(item.color) })
      } else if (item.type === 'circle') {
        page.drawCircle({ x: item.x * PT, y: (297 - item.y) * PT, size: item.r * PT, color: color(item.fill), borderColor: item.stroke ? color(item.stroke) : undefined, borderWidth: item.stroke ? .3 * PT : 0 })
      } else if (item.type === 'rect') {
        const w = item.w * PT, h = item.h * PT, r = (item.radius ?? 0) * PT
        if (r) page.drawSvgPath(`M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`, { x: item.x * PT, y: (297 - item.y) * PT, color: item.fill ? color(item.fill) : undefined, borderColor: item.stroke ? color(item.stroke) : undefined, borderWidth: item.stroke ? (item.thickness ?? .4) * PT : 0, opacity: item.opacity, borderOpacity: item.opacity })
        else page.drawRectangle({ x: item.x * PT, y: (297 - item.y - item.h) * PT, width: w, height: h, color: item.fill ? color(item.fill) : undefined, opacity: item.opacity })
      } else if (item.type === 'image') {
        const image = images.get(item.src)!
        const stretch = item.src.endsWith('paper.png') || item.src.endsWith('brush.png')
        const ratio = Math.min(item.w / image.width, item.h / image.height)
        const w = (stretch ? item.w : image.width * ratio) * PT
        const h = (stretch ? item.h : image.height * ratio) * PT
        const angle = -(item.rotate ?? 0), theta = angle * Math.PI / 180
        const cx = (item.x + item.w / 2) * PT, cy = (297 - item.y - item.h / 2) * PT
        page.drawImage(image, { x: cx - w / 2 * Math.cos(theta) + h / 2 * Math.sin(theta), y: cy - w / 2 * Math.sin(theta) - h / 2 * Math.cos(theta), width: w, height: h, rotate: degrees(angle), opacity: item.opacity })
      } else if (item.type === 'icon') {
        page.drawSvgPath(item.path, { x: item.x * PT, y: (297 - item.y) * PT, scale: item.w * PT / 24, borderColor: color('#54250f'), borderWidth: 1.8 })
      } else {
        const { font, ascent, descent } = embeddedFonts[item.font]
        const size = item.size * PT, leading = (item.lineHeight ?? 1.25) * size
        const lines = item.text.split('\n'), angle = -(item.rotate ?? 0), theta = angle * Math.PI / 180
        const cx = (item.x + item.w / 2) * PT, cy = (297 - item.y) * PT - leading * lines.length / 2
        const baseline = (leading - (ascent - descent) * size) / 2 + ascent * size
        if (item.stroke) page.pushOperators(pushGraphicsState(), setLineWidth(item.stroke * PT), setStrokingColor(color(item.color)), setTextRenderingMode(TextRenderingMode.FillAndOutline))
        lines.forEach((value, index) => {
          const runs: { value: string; font: typeof font }[] = []
          for (const character of value) {
            const code = character.codePointAt(0)!
            const face = embeddedFonts[item.font].glyphs.has(code) ? embeddedFonts[item.font] : embeddedFonts.georgian?.glyphs.has(code) ? embeddedFonts.georgian : embeddedFonts.hand
            const last = runs[runs.length - 1]
            if (last?.font === face.font) last.value += character
            else runs.push({ value: character, font: face.font })
          }
          const width = runs.reduce((sum, run) => sum + run.font.widthOfTextAtSize(run.value, size), 0)
          let x = item.x * PT + (item.align === 'center' ? (item.w * PT - width) / 2 : 0)
          const y = (297 - item.y) * PT - baseline - leading * index
          for (const run of runs) {
            page.drawText(run.value, { x: cx + (x - cx) * Math.cos(theta) - (y - cy) * Math.sin(theta), y: cy + (x - cx) * Math.sin(theta) + (y - cy) * Math.cos(theta), size, font: run.font, color: color(item.color), rotate: degrees(angle) })
            x += run.font.widthOfTextAtSize(run.value, size)
          }
        })
        if (item.stroke) page.pushOperators(popGraphicsState())
      }
    }
  }
  return doc.save()
}

export async function downloadPdf(kind: ExportKind, recipe: Recipe, mode: RecipeMode) {
  const data = await createPdf(kind, recipe, mode)
  const blob = new Blob([new Uint8Array(data)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const name = recipe.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'recipe'
  anchor.href = url
  anchor.download = `${name}-${recipe.language}-${kind === 'both' ? 'recipe-and-coloring' : kind}-${mode}.pdf`
  document.body.append(anchor); anchor.click(); anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export async function downloadCookbook(recipes: Recipe[], mode: RecipeMode, kind: ExportKind, numbered: boolean, name: string) {
  if (!recipes.length) return
  const book = await PDFDocument.create()
  book.setTitle(name || 'My cookbook')
  book.setAuthor('Cook & Color')
  book.setLanguage(recipes[0].language)
  // Process each recipe once and preserve vector text and embedded artwork when combining.
  for (const recipe of recipes) {
    const source = await PDFDocument.load(await createPdf(kind, recipe, mode))
    const pages = await book.copyPages(source, source.getPageIndices())
    pages.forEach(page => book.addPage(page))
  }
  if (numbered) {
    const font = await book.embedFont('Helvetica')
    book.getPages().forEach((page, index) => {
      const label = String(index + 1), size = 8
      const width = font.widthOfTextAtSize(label, size)
      page.drawRectangle({ x: page.getWidth() / 2 - 12, y: 5, width: 24, height: 13, color: rgb(1, 1, 1) })
      page.drawText(label, { x: (page.getWidth() - width) / 2, y: 8, size, font, color: rgb(0, 0, 0) })
    })
  }
  const blob = new Blob([new Uint8Array(await book.save())], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob), anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${name.trim().replace(/[^\p{L}\p{N}]+/gu, '-') || 'cookbook'}-${recipes[0].language}.pdf`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
