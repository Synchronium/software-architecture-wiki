---
description: Ingest the next batch of chapters from a source book into the architecture wiki
---

You are managing the chapter-by-chapter ingestion workflow for the architecture wiki. Follow these steps exactly.

---

## Step 1 — Detect state

Run this command to find any chapter files still awaiting ingestion:

```bash
find _incoming/processing -name "*.txt" | sort
```

- **Files found** → a book is in progress. Note the slug (the directory name under `processing/`). Skip to **In-Progress Path**.
- **No files found** → no book in progress. Proceed to **New Book Path**.

---

## New Book Path

1. List EPUBs available to ingest:
   ```bash
   ls "_incoming/raw/"
   ```

2. List slugs already processed:
   ```bash
   ls "_incoming/processed/"
   ```

3. Present the unprocessed books to the user and ask which one to start. A book is unprocessed if it has no corresponding slug in `_incoming/processed/`. Use the slug table in CLAUDE.md to map EPUB filenames to slugs.

4. Once the user selects a book, extract and split it:
   ```bash
   pandoc "_incoming/raw/<Exact EPUB Filename>" -t plain -o /tmp/book.txt
   python3 split_epub.py /tmp/book.txt "_incoming/processing/<slug>/" --slug <slug>
   mkdir -p "_incoming/processed/<slug>/"
   ```

5. Review the detected chapter list printed by `split_epub.py`. If any chapters are missing or incorrectly split, read the raw `/tmp/book.txt` around the affected boundary and split manually. Confirm the file list looks correct before proceeding.

6. Proceed to **In-Progress Path** to ingest the first batch of chapters.

---

## In-Progress Path

Determine the active slug:
```bash
ls _incoming/processing/
```
If multiple slugs have files, pick the one with the most files (furthest from completion) and note it.

List remaining files in order:
```bash
ls _incoming/processing/<slug>/ | sort
```

Take the **first 5 files** from this sorted list. These are the chapters to ingest in this session.

### For each chapter in the batch:

1. Read the chapter file from `_incoming/processing/<slug>/`
2. Follow the full ingest workflow defined in CLAUDE.md steps 1–7:
   - **Read** — build a picture of key claims, patterns, concepts, author citations, agreements and contradictions with existing wiki pages
   - **Write source page** — create or update `wiki/sources/<slug>.md`
   - **Update concept/pattern pages** — for each concept or pattern the chapter addresses, create or update the relevant page in `wiki/concepts/`, `wiki/patterns/`, `wiki/styles/`, `wiki/databases/`, `wiki/streams/`, or `wiki/reference/`
   - **Update author pages** — create or update `wiki/authors/<firstname-lastname>.md`
   - **Update overview.md** — revise if the chapter meaningfully shifts the synthesis
   - **Update index.md** — add any new pages
   - **Append to log.md** — one structured entry per the log format in CLAUDE.md
3. Move the ingested file to processed:
   ```bash
   mv "_incoming/processing/<slug>/<filename>" "_incoming/processed/<slug>/"
   ```

### After the batch is complete:

Check whether any `.txt` files remain:
```bash
ls _incoming/processing/<slug>/
```

**If files remain:** Tell the user how many chapters are left and that they can run `/ingest` again to continue.

**If no files remain:** The book is fully ingested. Move any residual files (preamble, foreword, appendix, index files — anything not already moved), then remove the now-empty processing directory:
```bash
mv _incoming/processing/<slug>/* "_incoming/processed/<slug>/" 2>/dev/null || true
rmdir "_incoming/processing/<slug>/"
```
Confirm to the user that the book is fully ingested and the processing directory is clean.
