/**
 * BookGrid — client-side filterable grid of NCERT textbooks.
 * Reads /data/metadata/books.json at runtime so a freshly-scraped JSON
 * blob can be dropped in without rebuilding the site.
 *
 * URL params honoured on first render: ?class=, ?subject=, ?language=
 * (matches the SiteSidebar quick-filter links).
 */
import { useEffect, useMemo, useState } from 'react'
import type { BookMetadata } from '~/lib/types'

export default function BookGrid() {
  const [books, setBooks] = useState<BookMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [filterClass, setFilterClass] = useState<string>('all')
  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [filterLanguage, setFilterLanguage] = useState<string>('all')

  useEffect(() => {
    const url = new URL(window.location.href)
    const c = url.searchParams.get('class')
    const s = url.searchParams.get('subject')
    const l = url.searchParams.get('language')
    if (c) setFilterClass(c)
    if (s) setFilterSubject(s)
    if (l) setFilterLanguage(l)

    fetch('/data/metadata/books.json')
      .then((r) => r.json())
      .then((data: BookMetadata[]) => setBooks(data))
      .catch((err) => {
        console.warn('Could not load books.json', err)
      })
      .finally(() => setLoading(false))
  }, [])

  const classes = useMemo(
    () => [...new Set(books.map((b) => b.class))].sort(),
    [books],
  )
  const subjects = useMemo(
    () => [...new Set(books.map((b) => b.subject))].sort(),
    [books],
  )
  const languages = useMemo(
    () => [...new Set(books.map((b) => b.language))].sort(),
    [books],
  )

  const filtered = books.filter((b) => {
    if (filterClass !== 'all' && b.class !== filterClass) return false
    if (filterSubject !== 'all' && b.subject !== filterSubject) return false
    if (filterLanguage !== 'all' && b.language !== filterLanguage) return false
    return true
  })

  if (loading) {
    return (
      <div className="bg-loading">
        <div className="spinner" aria-hidden="true" />
        <span className="sr-only">Loading books…</span>
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="bg-empty">
        <div className="bg-empty-emoji" aria-hidden="true">📚</div>
        <h3>No books loaded yet</h3>
        <p>
          Books appear once <code>public/data/metadata/books.json</code> has been
          populated. The data pipeline is documented in
          <a href="https://github.com/chirag127/oriz-books"> the repo README</a>.
        </p>
      </div>
    )
  }

  return (
    <section>
      <div className="bg-toolbar">
        <p className="bg-count">
          Showing <strong>{filtered.length}</strong> of {books.length} books
        </p>

        <div className="bg-filters">
          <label>
            <span className="sr-only">Class</span>
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
              <option value="all">All classes</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c.replace('class-', 'Class ')}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Subject</span>
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
              <option value="all">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Language</span>
            <select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)}>
              <option value="all">All languages</option>
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="bg-empty-result">No books match these filters.</p>
      ) : (
        <ul className="bg-grid">
          {filtered.map((book) => (
            <li key={book.bookCode}>
              <a href={`/book/${book.bookCode}/`} className="bg-card">
                <span className="bg-class-badge">
                  {book.class.replace('class-', 'Class ')}
                </span>
                <h3 className="bg-card-title">{book.title}</h3>
                <p className="bg-card-subject">
                  {book.subject.replace(/-/g, ' ')}
                </p>
                <div className="bg-card-meta">
                  <span>{book.numberOfChapters} chapters</span>
                  <span className="bg-card-lang">{book.language}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      <style>{`
        .bg-loading { display: flex; align-items: center; justify-content: center; padding: 4rem 0; }
        .spinner {
          width: 28px; height: 28px;
          border: 2px solid var(--color-border);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
        .bg-toolbar {
          display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
          gap: 1rem; margin-bottom: 1.5rem;
        }
        .bg-count { color: var(--color-fg-muted); margin: 0; font-size: 0.9375rem; }
        .bg-count strong { color: var(--color-fg); font-weight: 600; }
        .bg-filters { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .bg-filters select {
          height: 36px; padding-inline: 0.75rem;
          background: var(--color-bg-soft);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-button);
          color: var(--color-fg);
          font-family: inherit;
          font-size: 0.875rem;
        }
        .bg-filters select:hover { border-color: color-mix(in oklab, var(--color-accent) 40%, var(--color-border)); }
        .bg-empty, .bg-empty-result {
          padding: 3rem 1rem; text-align: center; color: var(--color-fg-muted);
        }
        .bg-empty-emoji { font-size: 2.5rem; margin-bottom: 0.75rem; }
        .bg-empty h3 { font-family: var(--font-serif); margin: 0 0 0.5rem; color: var(--color-fg); }
        .bg-empty a { color: var(--color-accent); }
        .bg-grid {
          list-style: none; padding: 0; margin: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem;
        }
        .bg-card {
          display: flex; flex-direction: column;
          padding: 1.25rem;
          background: var(--color-bg-soft);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-card);
          text-decoration: none;
          color: var(--color-fg);
          transition: border-color 120ms, transform 120ms;
        }
        .bg-card:hover {
          border-color: color-mix(in oklab, var(--color-accent) 50%, var(--color-border));
          transform: translateY(-1px);
          color: var(--color-fg);
        }
        .bg-class-badge {
          display: inline-flex; align-self: flex-start;
          padding: 0.125rem 0.5rem;
          font-size: 0.6875rem; font-weight: 500;
          background: color-mix(in oklab, var(--color-accent) 15%, transparent);
          color: var(--color-accent);
          border-radius: 999px;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .bg-card-title { font-family: var(--font-serif); font-size: 1.125rem; font-weight: 600; margin: 0 0 0.25rem; line-height: 1.3; }
        .bg-card-subject {
          color: var(--color-fg-muted);
          font-size: 0.875rem;
          text-transform: capitalize;
          margin: 0;
          flex: 1;
        }
        .bg-card-meta {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 1rem; padding-top: 0.75rem;
          border-top: 1px solid var(--color-border);
          font-size: 0.75rem;
          color: var(--color-fg-soft);
        }
        .bg-card-lang { text-transform: capitalize; }
      `}</style>
    </section>
  )
}
