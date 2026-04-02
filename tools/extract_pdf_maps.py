#!/usr/bin/env python3
"""Rasterize PDF pages to PNGs for static map backgrounds (requires PyMuPDF)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Install dependencies: python3 -m venv tools/.venv && ./tools/.venv/bin/pip install pymupdf", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Export PDF pages as PNG images.")
    parser.add_argument("pdf", type=Path, help="Input PDF path")
    parser.add_argument(
        "-o",
        "--out-dir",
        type=Path,
        default=Path("frontend/public/maps"),
        help="Output directory for PNG files",
    )
    parser.add_argument(
        "-s",
        "--scale",
        type=float,
        default=2.5,
        help="Rasterization scale (higher = sharper, larger files)",
    )
    parser.add_argument("--prefix", default="guide-map-", help="Filename prefix, e.g. guide-map-0.png")
    args = parser.parse_args()

    if not args.pdf.is_file():
        print(f"Missing PDF: {args.pdf}", file=sys.stderr)
        sys.exit(1)

    args.out_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(args.pdf)

    for i in range(doc.page_count):
        page = doc.load_page(i)
        mat = fitz.Matrix(args.scale, args.scale)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        out = args.out_dir / f"{args.prefix}{i}.png"
        pix.save(out.as_posix())
        print(f"Wrote {out} ({pix.width}x{pix.height})")

    doc.close()


if __name__ == "__main__":
    main()
