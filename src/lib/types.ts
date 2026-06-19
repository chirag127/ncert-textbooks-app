/**
 * Book metadata shape — used by the homepage grid, search page, and
 * /book/<bookCode> detail page. Mirrors the JSON shipped at
 * /data/metadata/books.json (which itself came from the legacy
 * packages/scraper/types).
 */
export interface BookChapter {
  number: number
  name: string
  url: string
}

export interface BookMetadata {
  bookCode: string
  title: string
  subtitle?: string
  description?: string
  class: string
  subject: string
  language: string
  editionYear?: string | number
  numberOfChapters: number
  chapters: BookChapter[]
  chapterNames?: string[]
  keywords?: string[]
  tags?: string[]
  /** Optional pre-merged whole-book PDF on ncert.nic.in. */
  downloadUrl?: string
}
