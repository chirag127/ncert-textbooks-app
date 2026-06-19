/**
 * BookDetail — chapter list + download buttons for one NCERT textbook.
 * Receives the BookMetadata as a prop (loaded server-side in
 * /book/[bookCode].astro at build time) so the page is fully static.
 *
 * Download URLs are plain anchors to ncert.nic.in. NCERT does not send
 * CORS headers, so any client-side fetch+merge of chapter PDFs would fail
 * silently (the legacy code shipped this bug and got a "merged PDF" with
 * 0 bytes). Direct anchor navigation bypasses CORS — the browser handles
 * the download itself.
 */
import type { BookMetadata } from '~/lib/types'

const NCERT_BASE = 'https://ncert.nic.in'

interface Props {
  book: BookMetadata
}

export default function BookDetail({ book }: Props) {
  const classDisplay = book.class
    .replace('class-', 'Class ')
    .replace('balvatika-', 'Balvatika ')
  const subjectDisplay = book.subject
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  const mergedBookUrl =
    book.downloadUrl ?? `${NCERT_BASE}/textbook/pdf/${book.bookCode}.pdf`
  const safeTitle = book.title.replace(/[^a-z0-9]/gi, '_')

  return (
    <article className="bd-root">
      <nav aria-label="Breadcrumb" className="bd-crumbs">
        <a href="/">Books</a>
        <span aria-hidden="true">/</span>
        <span className="bd-crumb-current">{book.title}</span>
      </nav>

      <header className="bd-head">
        <h1 className="bd-title">{book.title}</h1>
        {book.subtitle && <p className="bd-subtitle">{book.subtitle}</p>}
        {book.description && <p className="bd-desc">{book.description}</p>}

        <div className="bd-tags">
          <span className="bd-tag">{classDisplay}</span>
          <span className="bd-tag bd-tag-subject">{subjectDisplay}</span>
          <span className="bd-tag bd-tag-lang">{book.language}</span>
          {book.editionYear && (
            <span className="bd-tag bd-tag-year">{book.editionYear} edition</span>
          )}
        </div>

        <div className="bd-actions">
          <a
            href={mergedBookUrl}
            download={`${book.bookCode}-${safeTitle}.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="bd-btn-primary"
          >
            Download full book (PDF)
          </a>
          <a href="/" className="bd-btn-secondary">All books</a>
        </div>
      </header>

      <section className="bd-section">
        <h2 className="bd-section-h">Chapters</h2>
        <ul className="bd-chapters">
          {book.chapters.map((chapter) => {
            const chapterFilename = `${book.bookCode}-${String(chapter.number).padStart(
              2,
              '0',
            )}-${chapter.name
              .replace(/[<>:"/\\|?*]/g, '_')
              .replace(/\s+/g, '_')
              .toLowerCase()}.pdf`
            return (
              <li key={chapter.number} className="bd-chapter">
                <span className="bd-chapter-num">{chapter.number}</span>
                <span className="bd-chapter-name">{chapter.name}</span>
                <a
                  className="bd-chapter-dl"
                  href={chapter.url}
                  download={chapterFilename}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
              </li>
            )
          })}
        </ul>
      </section>

      {book.tags && book.tags.length > 0 && (
        <footer className="bd-foot">
          <ul className="bd-taglist">
            {book.tags.map((tag) => (
              <li key={tag}>#{tag}</li>
            ))}
          </ul>
        </footer>
      )}

      <style>{`
        .bd-root { padding-block: 2rem 4rem; }
        .bd-crumbs { display: flex; gap: 0.5rem; font-size: 0.875rem; color: var(--color-fg-muted); margin-bottom: 1.5rem; }
        .bd-crumbs a { color: var(--color-fg-muted); text-decoration: none; }
        .bd-crumbs a:hover { color: var(--color-fg); }
        .bd-crumb-current { color: var(--color-fg); }
        .bd-head { padding-bottom: 2rem; border-bottom: 1px solid var(--color-border); }
        .bd-title { font-family: var(--font-serif); font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 600; margin: 0; line-height: 1.2; }
        .bd-subtitle { color: var(--color-fg-muted); font-size: 1.125rem; margin: 0.5rem 0 0; }
        .bd-desc { color: var(--color-prose); margin: 1rem 0 0; line-height: 1.7; max-width: 56ch; }
        .bd-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1.5rem 0 0; }
        .bd-tag {
          display: inline-flex; align-items: center; height: 24px;
          padding: 0 0.625rem; border-radius: 999px;
          background: color-mix(in oklab, var(--color-accent) 15%, transparent);
          color: var(--color-accent);
          font-size: 0.75rem; font-weight: 500; text-transform: capitalize;
        }
        .bd-tag-subject { background: var(--color-bg-muted); color: var(--color-fg-muted); }
        .bd-tag-lang { background: var(--color-bg-muted); color: var(--color-fg-muted); }
        .bd-tag-year { background: var(--color-bg-muted); color: var(--color-fg-muted); }
        .bd-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1.5rem; }
        .bd-btn-primary, .bd-btn-secondary {
          display: inline-flex; align-items: center; height: 40px;
          padding-inline: 1.125rem;
          border-radius: var(--radius-button);
          font-weight: 500; font-size: 0.9375rem;
          text-decoration: none;
        }
        .bd-btn-primary { background: var(--color-accent); color: var(--color-accent-fg); border: 1px solid var(--color-accent); }
        .bd-btn-secondary {
          background: var(--color-bg-soft);
          color: var(--color-fg);
          border: 1px solid var(--color-border);
        }
        .bd-btn-secondary:hover { color: var(--color-fg); border-color: color-mix(in oklab, var(--color-accent) 50%, var(--color-border)); }
        .bd-section { padding-block: 2rem; }
        .bd-section-h { font-family: var(--font-serif); font-size: 1.25rem; font-weight: 600; margin: 0 0 1rem; }
        .bd-chapters { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
        .bd-chapter {
          display: grid; grid-template-columns: 32px 1fr auto;
          align-items: center; gap: 1rem;
          padding: 0.75rem 1rem;
          background: var(--color-bg-soft);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-button);
        }
        .bd-chapter-num {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px;
          background: var(--color-bg-muted);
          color: var(--color-fg-muted);
          border-radius: 999px;
          font-size: 0.8125rem; font-weight: 600;
        }
        .bd-chapter-name { color: var(--color-fg); font-size: 0.9375rem; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bd-chapter-dl {
          height: 28px; padding-inline: 0.75rem;
          display: inline-flex; align-items: center;
          background: transparent; color: var(--color-accent);
          border: 1px solid color-mix(in oklab, var(--color-accent) 40%, var(--color-border));
          border-radius: var(--radius-button);
          font-size: 0.8125rem; font-weight: 500; text-decoration: none;
        }
        .bd-chapter-dl:hover { background: color-mix(in oklab, var(--color-accent) 12%, transparent); color: var(--color-accent); }
        .bd-foot { padding-top: 1.5rem; border-top: 1px solid var(--color-border); }
        .bd-taglist { list-style: none; display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0; margin: 0; color: var(--color-fg-muted); font-size: 0.8125rem; }
      `}</style>
    </article>
  )
}
