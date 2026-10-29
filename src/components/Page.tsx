import { useRef } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import { A4, coloringScene, recipeScene } from '../data/layout'
import type { SceneElement } from '../data/layout'
import type { PageKind, Recipe, RecipeMode } from '../data/recipe'

const mm = (value: number) => `${value}mm`

export type ArtworkEditor = {
  selected: string | null
  onSelect: (id: string) => void
  onMove: (id: string, dx: number, dy: number) => void
}

function Element({ element, editor }: { element: SceneElement; editor?: ArtworkEditor }) {
  const drag = useRef<{ x: number; y: number; dx: number; dy: number; pixelsPerMm: number } | null>(null)
  if (element.type === 'list') {
    const List = element.ordered ? 'ol' : 'ul'
    return <List className={`recipe-list ${element.ordered ? 'instructions-list' : 'ingredients-list'}`} aria-label={element.label} role="list">
      {element.items.map((items, index) => <li key={index}>{items.map((item, i) => <Element key={`${item.type}-${i}`} element={item} />)}</li>)}
    </List>
  }
  if (element.type === 'section') {
    const style: CSSProperties = { position: 'absolute', left: mm(element.x), top: mm(element.y), width: mm(element.w), height: mm(element.h) }
    const children = element.items.map((item, index) => <Element key={`${item.type}-${index}`} element={item} />)
    if (!editor) return <section className="page-section" style={style}>{children}</section>
    const move = (dx: number, dy: number) => {
      const baseX = element.x - element.offsetX, baseY = element.y - element.offsetY
      editor.onMove(element.id, Math.max(-baseX, Math.min(210 - element.w - baseX, dx)), Math.max(-baseY, Math.min(297 - element.h - baseY, dy)))
    }
    return <section className={`page-section movable-section ${editor.selected === element.id ? 'section-selected' : ''}`} style={style} role="button" aria-label={`Move ${element.label}`} aria-pressed={editor.selected === element.id} tabIndex={0}
      onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); editor.onSelect(element.id); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, dx: element.offsetX, dy: element.offsetY, pixelsPerMm: event.currentTarget.closest('.a4-page')!.getBoundingClientRect().width / 210 } }}
      onPointerMove={event => { const start = drag.current; if (start) move(start.dx + (event.clientX - start.x) / start.pixelsPerMm, start.dy + (event.clientY - start.y) / start.pixelsPerMm) }}
      onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}
      onKeyDown={event => { const step = event.shiftKey ? 2 : .5; const arrows: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }; if (arrows[event.key]) { event.preventDefault(); const [dx, dy] = arrows[event.key]; move(element.offsetX + dx, element.offsetY + dy) } }}>
      <span className="section-handle">{element.label}</span>{children}
    </section>
  }
  const style: CSSProperties = { position: 'absolute', left: mm(element.x), top: mm(element.y) }
  if (element.type === 'line') return <div style={{ ...style, width: mm(element.w), borderTop: `${mm(element.thickness ?? .24)} solid ${element.color}` }} />
  if (element.type === 'circle') return <div style={{ ...style, left: mm(element.x - element.r), top: mm(element.y - element.r), width: mm(element.r * 2), height: mm(element.r * 2), borderRadius: '50%', background: element.fill, border: element.stroke ? `.3mm solid ${element.stroke}` : undefined }} />
  style.width = mm(element.w)
  style.height = mm(element.h)
  if (element.type === 'rect') return <div style={{ ...style, background: element.fill, border: element.stroke ? `${mm(element.thickness ?? .4)} solid ${element.stroke}` : undefined, borderRadius: mm(element.radius ?? 0), opacity: element.opacity }} />
  if (element.type === 'icon') return <svg viewBox="0 0 24 24" fill="none" stroke="#54250f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={element.path} /></svg>
  style.transform = element.rotate ? `rotate(${element.rotate}deg)` : undefined
  if (element.type === 'image') {
    const fit = element.src.endsWith('paper.png') || element.src.endsWith('brush.png') ? 'fill' : 'contain'
    if (!editor || !element.id) return <img alt="" src={element.src} draggable={false} style={{ ...style, objectFit: fit, opacity: element.opacity }} />
    const id = element.id
    const move = (dx: number, dy: number) => {
      const baseX = element.x - (element.offsetX ?? 0), baseY = element.y - (element.offsetY ?? 0)
      editor.onMove(id, Math.max(8 - element.w - baseX, Math.min(202 - baseX, dx)), Math.max(8 - element.h - baseY, Math.min(289 - baseY, dy)))
    }
    const finish = (event: PointerEvent<HTMLButtonElement>) => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) }
    return <button type="button" className={`artwork-object ${editor.selected === id ? 'object-selected' : ''}`} aria-label={`Move ${element.label}`} aria-pressed={editor.selected === id} style={style}
      onPointerDown={event => {
        if (event.button !== 0) return
        event.preventDefault(); editor.onSelect(id); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId)
        const bounds = event.currentTarget.closest('.a4-page')!.getBoundingClientRect()
        drag.current = { x: event.clientX, y: event.clientY, dx: element.offsetX ?? 0, dy: element.offsetY ?? 0, pixelsPerMm: bounds.width / 210 }
      }}
      onPointerMove={event => { const start = drag.current; if (start) move(start.dx + (event.clientX - start.x) / start.pixelsPerMm, start.dy + (event.clientY - start.y) / start.pixelsPerMm) }}
      onPointerUp={finish} onPointerCancel={finish}
      onKeyDown={event => {
        const amount = event.shiftKey ? 2 : .5
        const arrows: Record<string, [number, number]> = { ArrowLeft: [-amount, 0], ArrowRight: [amount, 0], ArrowUp: [0, -amount], ArrowDown: [0, amount] }
        if (arrows[event.key]) { event.preventDefault(); const [x, y] = arrows[event.key]; move((element.offsetX ?? 0) + x, (element.offsetY ?? 0) + y) }
      }}><img alt="" src={element.src} draggable={false} style={{ width: '100%', height: '100%', objectFit: fit }} /></button>
  }
  return <div className="page-text" aria-hidden={element.color === '#ffffff' || undefined} style={{ ...style, height: 'auto', fontFamily: element.font === 'title' ? 'Amatic SC' : element.font === 'georgianTitle' ? 'SS Geo Chalk, Patrick Hand' : element.font === 'georgianIngredients' ? 'Geo Gorda, Patrick Hand' : element.font === 'georgian' ? 'Geo Gorda, Patrick Hand' : 'Patrick Hand', color: element.color, fontSize: mm(element.size), WebkitTextStrokeWidth: mm(element.stroke ?? 0), WebkitTextStrokeColor: element.color, lineHeight: element.lineHeight ?? 1.25, textAlign: element.align, whiteSpace: 'pre' }}>{element.text}</div>
}

export function A4Page({ kind, recipe, mode, className = '', editor }: { kind: PageKind; recipe: Recipe; mode: RecipeMode; className?: string; editor?: ArtworkEditor }) {
  const scene = kind === 'recipe' ? recipeScene(recipe, mode) : coloringScene(recipe)
  return <article lang={recipe.language} className={`a4-page ${editor ? 'arrange-mode' : ''} ${className}`} aria-label={kind === 'recipe' ? `${recipe.title} recipe page` : 'Penguin family sandwich coloring page'} style={{ width: mm(A4.width), height: mm(A4.height) }}>
    {scene.map((element, index) => <Element key={element.type === 'image' && element.id ? element.id : `${element.type}-${index}`} element={element} editor={editor} />)}
  </article>
}
