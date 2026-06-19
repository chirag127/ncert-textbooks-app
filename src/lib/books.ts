/**
 * Static loader for books.json. Read once at build time so getStaticPaths can
 * pre-render every /book/<bookCode> page without a runtime fetch.
 */
import fs from 'node:fs'
import path from 'node:path'
import type { BookMetadata } from './types'

let cache: BookMetadata[] | null = null

export function loadBooks(): BookMetadata[] {
  if (cache) return cache
  const jsonPath = path.resolve(process.cwd(), 'public/data/metadata/books.json')
  try {
    if (!fs.existsSync(jsonPath)) {
      cache = []
      return cache
    }
    const raw = fs.readFileSync(jsonPath, 'utf-8')
    cache = JSON.parse(raw) as BookMetadata[]
    return cache
  } catch {
    cache = []
    return cache
  }
}
