## Purpose

Turn the single English Wikipedia Odyssey article into a committed, model-readable demo text corpus named `{section}_Odyssey_Title`, without crawling any other page.

## ADDED Requirements

### Requirement: Single-page Odyssey fetch only

The corpus build SHALL retrieve content for exactly one source: `https://en.wikipedia.org/wiki/Odyssey` (or the equivalent MediaWiki extract for that same title on `en.wikipedia.org`). The build MUST NOT follow hyperlinks, MUST NOT crawl a sitemap, and MUST NOT request any other Wikipedia title or site. If the fetch fails, is blocked, or returns no article body, the build MUST fail with a non-zero exit and MUST NOT write a partial corpus that looks successful.

#### Scenario: Successful single-page retrieval

- **WHEN** the builder is run against the Odyssey article URL
- **THEN** it obtains that article's content and proceeds to cleaning without requesting any other page URL

#### Scenario: Fetch failure is not silent

- **WHEN** the Odyssey URL cannot be retrieved or yields an empty article body
- **THEN** the builder exits non-zero and does not leave a completed corpus that operators would treat as valid

#### Scenario: No link following

- **WHEN** the Odyssey article HTML contains links to other Wikipedia pages
- **THEN** the builder does not fetch those linked pages

### Requirement: `{section}_Odyssey_Title` file naming

Each kept H2 section SHALL be written as a UTF-8 `.txt` file under `input/odyssey/` named `{section}_Odyssey_Title.txt`. `{section}` SHALL be the Wikipedia H2 heading with edit-link chrome removed, then sanitized to ASCII letters, digits, and underscores (spaces and other punctuation become `_`; consecutive `_` collapsed; leading/trailing `_` stripped). The article lead (text before the first H2) SHALL be `Lead_Odyssey_Title.txt`. A concatenation of all kept section files in document order SHALL be written as `Full_Odyssey_Title.txt` so the existing single-file extract CLI can consume the corpus.

#### Scenario: Lead file name

- **WHEN** the article has lead prose before the first H2
- **THEN** that prose is written to `input/odyssey/Lead_Odyssey_Title.txt`

#### Scenario: Section file name from heading

- **WHEN** the article has an H2 heading such as `Synopsis`
- **THEN** that section's cleaned prose is written to `input/odyssey/Synopsis_Odyssey_Title.txt`

#### Scenario: Heading sanitization

- **WHEN** an H2 heading contains spaces, punctuation, or Wikipedia `[edit]` chrome
- **THEN** the output filename still matches `{sanitized-section}_Odyssey_Title.txt` with no illegal path characters

#### Scenario: Full extract file

- **WHEN** at least one kept section file is produced
- **THEN** `input/odyssey/Full_Odyssey_Title.txt` exists and contains those sections in article order, separated by the original headings

### Requirement: Model-readable Wikipedia prose

Each corpus file SHALL contain UTF-8 plain text suitable for NER / relation / triplet extraction: paragraph breaks preserved, no HTML or wiki markup, no site chrome (navigation, menus, footers), and inline citation markers such as `[1]` or `[a]` stripped. Infobox HTML MUST NOT be dumped as a raw table into section files. Wikipedia bibliography chrome sections MUST be omitted: at least `See also`, `Notes`, `References`, `Citations`, `Bibliography`, `Further reading`, `External links`, `Sources`, and `Footnotes`. Empty sections MUST NOT produce files.

#### Scenario: HTML is not left in the text

- **WHEN** the source page is HTML
- **THEN** corpus files contain no HTML tags and read as ordinary paragraphs

#### Scenario: Citation markers stripped

- **WHEN** a paragraph contains Wikipedia citation markers such as `[1]` or `[12]`
- **THEN** the written prose does not include those markers

#### Scenario: Chrome sections omitted

- **WHEN** the article includes a `References` or `See also` H2
- **THEN** no `{section}_Odyssey_Title.txt` file is created for that chrome section

#### Scenario: Empty section skipped

- **WHEN** a kept H2 has no remaining prose after cleaning
- **THEN** no file is written for that heading

### Requirement: Source attribution and offline snapshot

The committed corpus SHALL include a source record next to the text files that names the canonical URL, retrieval date (UTC), Wikipedia title `Odyssey`, and the CC BY-SA license. The cleaned `.txt` files SHALL be committed so `semantica extract` can run offline against `Full_Odyssey_Title.txt` without a network fetch. Regenerating the corpus MAY overwrite the text files; it MUST refresh the source record in the same run.

#### Scenario: Attribution is present

- **WHEN** the corpus is written
- **THEN** `input/odyssey/` contains a source record with URL, retrieval date, title, and CC BY-SA notice

#### Scenario: Offline extract path

- **WHEN** an operator runs the extract CLI on `input/odyssey/Full_Odyssey_Title.txt` with no network
- **THEN** the file exists as UTF-8 text and can be opened without fetching Wikipedia
