/**
 * BookGrid — v2 catalogue-card grid on Ink Block.
 *
 * Layout: filter rail left (sticky, 240px) + cards right (CSS grid,
 * minmax(280px, 1fr), gap 24px, 280x168 catalogue-card ratio).
 *
 * Each card carries:
 *   - bookCode top-strip in JetBrains Mono (slashed zero)
 *   - 6px subject-colour band on the LEFT edge
 *   - title in IBM Plex Serif
 *   - brass punch-hole at bottom-center (PunchHole component)
 *
 * Hover: dims to card-shade and underlines the title; the punch-hole
 * brass goes from 60% → 80% opacity. NO scale, NO lift, NO glow.
 *
 * Sort: alphabetical within (Class, Subject). Pagination is a numbered
 * strip at the bottom — current page in cinnabar, others in Card Bone.
 */
import { useEffect, useMemo, useState } from 'react'
import type { BookMetadata } from '~/lib/types'

const PAGE_SIZE = 24

type SubjectColor = 'cinnabar' | 'indigo' | 'brass' | 'graphite'

const SUBJECT_BANDS: Record<string, { color: SubjectColor; label: string }> = {
  mathematics: { color: 'cinnabar', label: 'Maths' },
  maths: { color: 'cinnabar', label: 'Maths' },
  science: { color: 'indigo', label: 'Science' },
  'social-science': { color: 'brass', label: 'Social' },
  social: { color: 'brass', label: 'Social' },
  'social-studies': { color: 'brass', label: 'Social' },
  history: { color: 'brass', label: 'History' },
  geography: { color: 'brass', label: 'Geography' },
  political: { color: 'brass', label: 'Political' },
  'political-science': { color: 'brass', label: 'Political' },
  economics: { color: 'brass', label: 'Economics' },
  english: { color: 'graphite', label: 'English' },
  hindi: { color: 'graphite', label: 'Hindi' },
  urdu: { color: 'graphite', label: 'Urdu' },
  sanskrit: { color: 'graphite', label: 'Sanskrit' },
  language: { color: 'graphite', label: 'Language' },
  languages: { color: 'graphite', label: 'Language' },
}

function bandFor(subject: string): { color: SubjectColor; label: string } {
  const k = subject.toLowerCase()
  if (SUBJECT_BANDS[k]) return SUBJECT_BANDS[k]
  if (k.includes('math')) return SUBJECT_BANDS.mathematics
  if (k.includes('sci')) return SUBJECT_BANDS.science
  if (k.includes('social') || k.includes('history') || k.includes('geo') || k.includes('econ')) {
    return SUBJECT_BANDS.social
  }
  if (k.includes('eng') || k.includes('hindi') || k.includes('urdu') || k.includes('lang')) {
    return SUBJECT_BANDS.languages
  }
  return { color: 'graphite', label: subject.replace(/-/g, ' ') }
}

function formatBookCode(code: string): string {
  // KEMH101 → KEMH 1 01 (mono caps).
  return code.toUpperCase().replace(/^([A-Z]+)(\d)(\d{2,})$/, '$1 $2 $3')
}

function classNumber(c: string): number {
  const m = c.match(/(\d+)/)
  return m ? Number(m[1]) : 0
}

export default function BookGrid() {
  const [books, setBooks] = useState<BookMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [filterClass, setFilterClass] = useState<string>('all')
  const [filterSubject, setFilterSubject] = useState<SubjectColor | 'all'>('all')
  const [filterLanguage, setFilterLanguage] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const url = new URL(window.location.href)
    const c = url.searchParams.get('class')
    const s = url.searchParams.get('subject') as SubjectColor | null
    const l = url.searchParams.get('language')
    const q = url.searchParams.get('q')
    if (c) setFilterClass(c)
    if (s) setFilterSubject(s)
    if (l) setFilterLanguage(l)
    if (q) setQuery(q)

    fetch('/data/metadata/books.json')
      .then((r) => r.json())
      .then((data: BookMetadata[]) => setBooks(data))
      .catch((err) => {
        console.warn('Could not load books.json', err)
      })
      .finally(() => setLoading(false))
  }, [])

  const classes = useMemo(
    () => [...new Set(books.map((b) => b.class))].sort((a, b) => classNumber(a) - classNumber(b)),
    [books],
  )
  const languages = useMemo(() => [...new Set(books.map((b) => b.language))].sort(), [books])

  const filtered = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    return books
      .filter((b) => {
        if (filterClass !== 'all' && b.class !== filterClass) return false
        if (filterSubject !== 'all' && bandFor(b.subject).color !== filterSubject) return false
        if (filterLanguage !== 'all' && b.language !== filterLanguage) return false
        if (terms.length === 0) return true
        const blob = [
          b.title,
          b.subject,
          b.class,
          b.bookCode,
          b.language,
          ...(b.keywords ?? []),
          ...(b.chapters?.map((c) => c.name) ?? []),
        ]
          .join(' ')
          .toLowerCase()
        return terms.every((t) => blob.includes(t))
      })
      .sort((a, b) => {
        const ca = classNumber(a.class)
        const cb = classNumber(b.class)
        if (ca !== cb) return ca - cb
        if (a.subject !== b.subject) return a.subject.localeCompare(b.subject)
        return a.title.localeCompare(b.title)
      })
  }, [books, filterClass, filterSubject, filterLanguage, query])

  // Reset paging when filters change.
  // biome-ignore lint/correctness/useExhaustiveDependencies: page reset on filter change is the intent
  useEffect(() => {
    setPage(1)
  }, [filterClass, filterSubject, filterLanguage, query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageBooks = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="cat-shell">
      <aside id="filter-rail" className="filter-rail" aria-label="Catalogue filters">
        <div className="rail-search">
          <label htmlFor="rail-q" className="sr-only">
            Search
          </label>
          <input
            id="rail-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by class, subject, or chapter…"
            data-cycle-placeholder
            className="rail-search-input"
          />
        </div>

        <h2 className="rail-h mono">Class</h2>
        <ul className="rail-list">
          <li>
            <button
              type="button"
              data-active={filterClass === 'all' || undefined}
              onClick={() => setFilterClass('all')}
            >
              All classes
            </button>
          </li>
          {classes.map((c) => (
            <li key={c}>
              <button
                type="button"
                data-active={filterClass === c || undefined}
                onClick={() => setFilterClass(c)}
              >
                Class {classNumber(c) || c}
              </button>
            </li>
          ))}
        </ul>

        <h2 className="rail-h mono">Subject</h2>
        <ul className="rail-list">
          {(
            [
              ['all', 'All subjects', null],
              ['cinnabar', 'Mathematics', 'cinnabar'],
              ['indigo', 'Science', 'indigo'],
              ['brass', 'Social Studies', 'brass'],
              ['graphite', 'Languages', 'graphite'],
            ] as const
          ).map(([id, label, swatch]) => (
            <li key={id}>
              <button
                type="button"
                data-active={filterSubject === id || undefined}
                onClick={() => setFilterSubject(id as SubjectColor | 'all')}
              >
                {swatch && <span className="swatch" data-color={swatch} aria-hidden="true" />}
                {label}
              </button>
            </li>
          ))}
        </ul>

        <h2 className="rail-h mono">Medium</h2>
        <ul className="rail-list rail-list-row">
          <li>
            <button
              type="button"
              data-active={filterLanguage === 'all' || undefined}
              onClick={() => setFilterLanguage('all')}
            >
              All
            </button>
          </li>
          {languages.map((l) => (
            <li key={l}>
              <button
                type="button"
                data-active={filterLanguage === l || undefined}
                onClick={() => setFilterLanguage(l)}
              >
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="cat-main" aria-label="Catalogue">
        <p className="cat-count mono" aria-live="polite">
          {loading ? 'Loading catalogue…' : `${filtered.length} of ${books.length} books`}
        </p>

        {!loading && books.length === 0 && (
          <div className="cat-empty">
            <h3>No books loaded yet</h3>
            <p>
              Books appear once <code>public/data/metadata/books.json</code> has been populated. The
              data pipeline is documented in the repository README.
            </p>
          </div>
        )}

        {!loading && books.length > 0 && filtered.length === 0 && (
          <p className="cat-empty-result">No books match these filters.</p>
        )}

        <ul className="cat-grid">
          {pageBooks.map((book) => {
            const band = bandFor(book.subject)
            return (
              <li key={book.bookCode}>
                <a href={`/book/${book.bookCode}/`} className="card" data-band={band.color}>
                  <span className="card-band" aria-hidden="true" />
                  <span className="card-strip mono">
                    <span className="card-code">{formatBookCode(book.bookCode)}</span>
                    <span className="card-class">
                      CL {classNumber(book.class) || book.class.toUpperCase()}
                    </span>
                  </span>
                  <span className="card-body">
                    <span className="card-subject mono">{band.label.toUpperCase()}</span>
                    <h3 className="card-title">{book.title}</h3>
                    {book.subtitle && <span className="card-sub">{book.subtitle}</span>}
                  </span>
                  <span className="card-punch" aria-hidden="true">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      xmlns="http://www.w3.org/2000/svg"
                      className="punch-svg"
                      role="presentation"
                    >
                      <circle cx="9" cy="9" r="9" className="punch-ring" />
                      <circle cx="9" cy="9" r="4" className="punch-inner" />
                    </svg>
                  </span>
                </a>
              </li>
            )
          })}
        </ul>

        {pageCount > 1 && (
          <nav className="cat-pages mono" aria-label="Pagination">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPage(p)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                data-current={p === page || undefined}
              >
                {String(p).padStart(2, '0')}
              </button>
            ))}
          </nav>
        )}
      </section>

      <style>{`
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

        .cat-shell {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 32px;
          padding-block: 1.5rem 4rem;
          align-items: start;
        }
        @media (max-width: 900px) {
          .cat-shell { grid-template-columns: 1fr; }
          .filter-rail { position: static !important; max-height: none; }
          .filter-rail:not([data-open]) { display: none; }
        }

        /* ============= Filter rail ============= */
        .filter-rail {
          position: sticky;
          top: 72px;
          align-self: start;
          padding-right: 1rem;
          border-right: 1px solid var(--rule);
          font-family: var(--font-sans);
        }
        .rail-search {
          margin-bottom: 1.5rem;
        }
        .rail-search-input {
          width: 100%;
          height: 36px;
          padding-inline: 0.75rem;
          background: var(--card);
          color: var(--graphite);
          border: 1px solid var(--brass);
          border-radius: 0;
          font-family: var(--font-sans);
          font-size: 13px;
        }
        .rail-search-input::placeholder { color: var(--graphite-soft); }
        .rail-search-input:focus { outline: none; border-color: var(--cinnabar); }

        .rail-h {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-mute);
          margin: 1.25rem 0 0.5rem;
          font-feature-settings: 'tnum' 1, 'zero' 1, 'ss20' 1, 'calt' 0;
        }
        .rail-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .rail-list-row {
          flex-direction: row;
          flex-wrap: wrap;
          gap: 0.375rem;
        }
        .rail-list button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.25rem 0;
          background: transparent;
          border: 0;
          color: var(--ink);
          font-family: inherit;
          font-size: 13px;
          text-align: left;
          cursor: pointer;
          line-height: 1.4;
        }
        .rail-list-row button {
          width: auto;
          padding: 0.25rem 0.5rem;
          border: 1px solid var(--rule);
        }
        .rail-list button:hover { color: var(--cinnabar); }
        .rail-list button[data-active] {
          color: var(--cinnabar);
          box-shadow: inset 0 -1px 0 var(--cinnabar);
        }
        .rail-list-row button[data-active] {
          color: var(--cinnabar);
          border-color: var(--cinnabar);
          box-shadow: none;
        }
        .swatch {
          display: inline-block;
          width: 3px;
          height: 14px;
          flex: none;
        }
        .swatch[data-color="cinnabar"] { background: var(--cinnabar); }
        .swatch[data-color="indigo"]   { background: var(--indigo); }
        .swatch[data-color="brass"]    { background: var(--brass); }
        .swatch[data-color="graphite"] { background: var(--graphite); }

        /* ============= Main grid ============= */
        .cat-main { min-width: 0; }
        .cat-count {
          margin: 0 0 1rem;
          color: var(--ink-mute);
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-feature-settings: 'tnum' 1, 'zero' 1, 'ss20' 1, 'calt' 0;
        }
        .cat-empty, .cat-empty-result {
          padding: 3rem 0;
          color: var(--ink-mute);
          text-align: center;
        }
        .cat-empty h3 { font-family: var(--font-display); margin: 0 0 0.5rem; color: var(--ink); }
        .cat-empty code { background: var(--paper-deep); padding: 0.125em 0.375em; }

        .cat-grid {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        /* ============= Catalogue card ============= */
        .card {
          position: relative;
          display: grid;
          grid-template-rows: 28px 1fr 32px;
          height: 168px;
          padding-left: 22px; /* 16px content gap after the 6px band */
          padding-right: 14px;
          background: var(--card);
          color: var(--on-card);
          border: 1px solid var(--on-card-rule);
          border-radius: 0;
          text-decoration: none;
          overflow: hidden;
          /* No transform/lift/glow — flat catalogue metaphor. */
          transition: background-color 120ms linear;
        }
        .card:hover { background: var(--card-shade); }
        .card:focus-visible {
          outline: 2px solid var(--cinnabar);
          outline-offset: 2px;
        }

        .card-band {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 6px;
        }
        .card[data-band="cinnabar"] .card-band { background: var(--cinnabar); }
        .card[data-band="indigo"]   .card-band { background: var(--indigo); }
        .card[data-band="brass"]    .card-band { background: var(--brass); }
        .card[data-band="graphite"] .card-band { background: var(--graphite); }

        .card-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 28px;
          padding-block: 6px;
          border-bottom: 1px solid var(--on-card-rule);
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--graphite-soft);
          font-feature-settings: 'tnum' 1, 'zero' 1, 'ss20' 1, 'calt' 0;
        }
        .card-code { color: var(--on-card); font-weight: 500; }

        .card-body {
          display: flex;
          flex-direction: column;
          padding-top: 12px;
          gap: 0.25rem;
        }
        .card-subject {
          color: var(--graphite-soft);
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .card[data-band="cinnabar"] .card-subject { color: var(--cinnabar); }
        .card[data-band="indigo"]   .card-subject { color: var(--indigo); }
        .card-title {
          margin: 0.25rem 0 0;
          font-family: var(--font-display);
          font-weight: 500;
          font-size: 18px;
          line-height: 1.3;
          color: var(--on-card);
          /* Clamp to 3 lines per the spec. */
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .card:hover .card-title {
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 3px;
          text-decoration-color: var(--cinnabar);
        }
        .card-sub {
          color: var(--on-card-mute);
          font-size: 12px;
          line-height: 1.35;
        }

        .card-punch {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 6px;
        }
        .punch-svg { display: block; }
        .punch-ring {
          fill: var(--brass);
          fill-opacity: 0.6;
          transition: fill-opacity 120ms linear;
        }
        .punch-inner {
          fill: var(--paper);
          fill-opacity: 0.95;
        }
        .card:hover .punch-ring,
        .card:focus-visible .punch-ring { fill-opacity: 0.85; }

        /* ============= Pagination ============= */
        .cat-pages {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--rule);
        }
        .cat-pages button {
          background: transparent;
          border: 0;
          padding: 0.25rem 0.5rem;
          color: var(--ink);
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.08em;
          cursor: pointer;
          font-feature-settings: 'tnum' 1, 'zero' 1, 'ss20' 1, 'calt' 0;
        }
        .cat-pages button:hover { color: var(--cinnabar); }
        .cat-pages button[data-current] {
          color: var(--cinnabar);
          box-shadow: inset 0 -1px 0 var(--cinnabar);
        }
      `}</style>
    </div>
  )
}
