#!/usr/bin/env python3
"""Generate PNG favicons from SVG in multiple sizes."""

import cairosvg
from pathlib import Path

# Sizes to generate
SIZES = [16, 32, 48, 64, 128, 180, 192, 512]

# Input and output paths
svg_path = Path("favicon.svg")
output_dir = Path(".")

def generate_png(size: int) -> None:
    """Generate a PNG of the specified size from the SVG."""
    output_path = output_dir / f"favicon-{size}x{size}.png"

    print(f"Generating {output_path.name}...")

    cairosvg.svg2png(
        url=str(svg_path),
        write_to=str(output_path),
        output_width=size,
        output_height=size,
    )

    print(f"  ✓ Created {output_path.name}")

def main():
    if not svg_path.exists():
        print(f"Error: {svg_path} not found!")
        return 1

    print(f"Reading {svg_path}...")
    print(f"Generating {len(SIZES)} PNG files...\n")

    for size in SIZES:
        try:
            generate_png(size)
        except Exception as e:
            print(f"  ✗ Error generating {size}x{size}: {e}")
            continue

    print("\n✓ All favicons generated successfully!")
    print("\nGenerated files:")
    for size in SIZES:
        print(f"  - favicon-{size}x{size}.png")

    return 0

if __name__ == "__main__":
    exit(main())
