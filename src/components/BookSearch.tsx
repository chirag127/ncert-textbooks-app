/**
 * BookSearch — full-text search over books.json with class/subject/language
 * facets. No external indexer (FlexSearch was overkill for ~200 books).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { BookMetadata } from '~/lib/types'

export default function BookSearch() {
  const [query, setQuery] = useState('')
  const [books, setBooks] = useState<BookMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ class: '', subject: '', language: '' })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const initialQuery = new URL(window.location.href).searchParams.get('q') ?? ''
    setQuery(initialQuery)
    fetch('/data/metadata/books.json')
      .then((r) => r.json())
      .then((data: BookMetadata[]) => setBooks(data))
      .catch((err) => console.warn('Could not load books index', err))
      .finally(() => setLoading(false))
    inputRef.current?.focus()
  }, [])

  const subjects = useMemo(() => [...new Set(books.map((b) => b.subject))].sort(), [books])
  const classes = useMemo(() => [...new Set(books.map((b) => b.class))].sort(), [books])
  const languages = useMemo(() => [...new Set(books.map((b) => b.language))].sort(), [books])

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    return books.filter((book) => {
      if (filters.class && book.class !== filters.class) return false
      if (filters.subject && book.subject !== filters.subject) return false
      if (filters.language && book.language !== filters.language) return false
      if (terms.length === 0) return true
      const blob = [
        book.title,
        book.subject,
        book.class,
        book.bookCode,
        book.language,
        ...(book.keywords ?? []),
        ...(book.chapterNames ?? []),
        ...(book.chapters?.map((c) => c.name) ?? []),
        book.description ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return terms.every((t) => blob.includes(t))
    })
  }, [books, query, filters])

  return (
    <div className="bs-root">
      <div className="bs-input-wrap">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, subject, chapter, keyword…"
          className="bs-input"
        />
      </div>

      <div className="bs-filters">
        <select value={filters.class} onChange={(e) => setFilters((f) => ({ ...f, class: e.target.value }))}>
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c.replace('class-', 'Class ')}
            </option>
          ))}
        </select>
        <select value={filters.subject} onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value }))}>
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
        <select value={filters.language} onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value }))}>
          <option value="">All languages</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <p className="bs-meta">
        {loading
          ? 'Loading books…'
          : `${results.length} ${results.length === 1 ? 'book' : 'books'} matched`}
      </p>

      <ul className="bs-results">
        {results.map((book) => (
          <li key={book.bookCode}>
            <a href={`/book/${book.bookCode}/`} className="bs-result">
              <div className="bs-result-main">
                <h3>{book.title}</h3>
                <p>
                  {book.class.replace('class-', 'Class ')} ·{' '}
                  <span className="bs-cap">{book.subject.replace(/-/g, ' ')}</span> ·{' '}
                  <span className="bs-cap">{book.language}</span>
                </p>
              </div>
              <span className="bs-result-arrow" aria-hidden="true">→</span>
            </a>
          </li>
        ))}
      </ul>

      <style>{`
        .bs-root { padding-block: 1rem 2rem; }
        .bs-input-wrap { margin-bottom: 1rem; }
        .bs-input {
          width: 100%; height: 52px;
          padding-inline: 1rem;
          background: var(--color-bg-soft);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-card);
          color: var(--color-fg);
          font-family: inherit;
          font-size: 1rem;
        }
        .bs-input:focus { outline: 2px solid var(--color-accent); outline-offset: 2px; }
        .bs-filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.25rem; }
        .bs-filters select {
          height: 36px; padding-inline: 0.75rem;
          background: var(--color-bg-soft);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-button);
          color: var(--color-fg);
          font-family: inherit;
          font-size: 0.875rem;
        }
        .bs-meta { color: var(--color-fg-muted); font-size: 0.875rem; margin: 0 0 1rem; }
        .bs-results { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
        .bs-result {
          display: grid; grid-template-columns: 1fr auto;
          align-items: center; gap: 1rem;
          padding: 1rem 1.25rem;
          background: var(--color-bg-soft);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-card);
          color: var(--color-fg);
          text-decoration: none;
        }
        .bs-result:hover { border-color: color-mix(in oklab, var(--color-accent) 50%, var(--color-border)); color: var(--color-fg); }
        .bs-result h3 { font-family: var(--font-serif); font-size: 1.0625rem; font-weight: 600; margin: 0; }
        .bs-result p { color: var(--color-fg-muted); margin: 0.25rem 0 0; font-size: 0.875rem; }
        .bs-cap { text-transform: capitalize; }
        .bs-result-arrow { color: var(--color-fg-soft); font-size: 1.125rem; }
        .bs-result:hover .bs-result-arrow { color: var(--color-accent); }
      `}</style>
    </div>
  )
}
