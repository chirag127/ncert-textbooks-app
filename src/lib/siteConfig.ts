/*
 * Site config for books.oriz.in. Local interface (was OrizSiteConfig from
 * @chirag127/oriz-ui) so the site no longer needs the oriz-ui types in
 * production code paths.
 */
export interface OrizSiteConfig {
  slug: string
  name: string
  origin: string
  tagline: string
  description?: string
}

export const SITE_CONFIG: OrizSiteConfig = {
  slug: 'books',
  name: 'Books',
  origin: 'https://books.oriz.in',
  tagline: 'NCERT textbook directory — browse, search, and download for free.',
  description:
    'A free, open directory of NCERT textbooks (Class IX–XII). Browse by class, subject, and language; download chapter PDFs or the merged whole-book PDF straight from ncert.nic.in.',
}
