#!/usr/bin/env python3
"""
Split a pandoc-extracted EPUB text file into per-chapter files.

Usage:
    python3 split_epub.py <input.txt> <output_dir> [--slug SLUG]

Chapter boundaries are detected as lines matching "^\d{1,2} \w+" that:
  - Are preceded by a blank line (or are the first non-blank line)
  - Are short (< 60 chars) — rules out mid-sentence numbering
  - Start with a capital letter after the number

Output files are named:
  00-preamble.txt           (everything before chapter 1)
  01-introduction.txt
  02-reliable-links.txt
  ...etc

The slug is used as a prefix comment in each file header.
"""

import re
import sys
import os
import argparse


def slugify(title: str) -> str:
    """Convert a chapter title to a filename-safe slug."""
    return re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')


def detect_chapters(lines: list[str]) -> list[tuple[int, int, str]]:
    """
    Return list of (line_index, chapter_number, title) for each chapter heading.

    Supports two formats (tried in order; first that yields results wins):
      - "N Title"          e.g. "1 Introduction"         (Vitillo style)
      - "Chapter N. Title" e.g. "Chapter 1. Design, ..." (O'Reilly style)
    """
    patterns = [
        re.compile(r'^(\d{1,2}) ([A-Z][^\n]{1,50})$'),
        re.compile(r'^Chapter (\d{1,2})\. (.+)$'),
    ]

    for pattern in patterns:
        chapters = []
        for i, line in enumerate(lines):
            line = line.rstrip('\n')
            m = pattern.match(line)
            if not m:
                continue
            prev_blank = (i == 0) or (lines[i - 1].strip() == '')
            if not prev_blank:
                continue
            num = int(m.group(1))
            title = m.group(2).strip()
            chapters.append((i, num, title))
        if chapters:
            return chapters

    return []


def split_and_write(input_path: str, output_dir: str, slug: str) -> None:
    with open(input_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    chapters = detect_chapters(lines)

    if not chapters:
        print("ERROR: No chapter headings detected. Check the input file.")
        sys.exit(1)

    print(f"Detected {len(chapters)} chapters:")
    for line_idx, num, title in chapters:
        print(f"  Line {line_idx + 1:5d}  Ch {num:2d}  {title}")

    # Build segment boundaries: list of (start_line, end_line, num, title)
    segments = []

    # Preamble: everything before the first chapter
    first_chapter_line = chapters[0][0]
    if first_chapter_line > 0:
        segments.append((0, first_chapter_line, 0, 'Preamble'))

    for i, (line_idx, num, title) in enumerate(chapters):
        end_line = chapters[i + 1][0] if i + 1 < len(chapters) else len(lines)
        segments.append((line_idx, end_line, num, title))

    os.makedirs(output_dir, exist_ok=True)

    written = []
    for start, end, num, title in segments:
        filename = f"{num:02d}-{slugify(title)}.txt"
        filepath = os.path.join(output_dir, filename)
        content = ''.join(lines[start:end])
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"# [{slug}] Chapter {num}: {title}\n")
            f.write(f"# Source lines {start + 1}–{end} of original extraction\n\n")
            f.write(content)
        written.append(filename)
        print(f"  Wrote {filepath}  ({end - start} lines)")

    print(f"\nDone. {len(written)} files written to {output_dir}/")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', help='Path to pandoc-extracted .txt file')
    parser.add_argument('output_dir', help='Directory to write chapter files into')
    parser.add_argument('--slug', default='book', help='Book slug for file headers')
    args = parser.parse_args()

    split_and_write(args.input, args.output_dir, args.slug)


if __name__ == '__main__':
    main()
