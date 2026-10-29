import { useLayoutEffect, useRef, useState } from 'react'
import { A4Page } from './Page'
import type { ArtworkEditor } from './Page'
import type { PageKind, Recipe, RecipeMode } from '../data/recipe'

export function PrintPreview({ kind, recipe, mode, zoom, editor }: { kind: PageKind; recipe: Recipe; mode: RecipeMode; zoom: number; editor?: ArtworkEditor }) {
  const container = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(660)
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    if (container.current) observer.observe(container.current)
    return () => observer.disconnect()
  }, [])
  const pageWidth = Math.min(width, 700) * zoom
  const scale = pageWidth / (210 * 96 / 25.4)
  return <div className="preview-container" ref={container}>
    <div className="page-shadow" style={{ width: pageWidth, height: pageWidth * 297 / 210 }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <A4Page kind={kind} recipe={recipe} mode={mode} editor={editor} />
      </div>
    </div>
  </div>
}
