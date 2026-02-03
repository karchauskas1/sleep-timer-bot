#!/usr/bin/env python3
import zlib
import struct
import os

def create_png(width, height, r, g, b):
    """Create a simple solid color PNG image."""

    def png_chunk(chunk_type, data):
        """Create a PNG chunk with CRC."""
        chunk = chunk_type + data
        crc = zlib.crc32(chunk) & 0xffffffff
        return struct.pack('>I', len(data)) + chunk + struct.pack('>I', crc)

    # PNG signature
    signature = b'\x89PNG\r\n\x1a\n'

    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr = png_chunk(b'IHDR', ihdr_data)

    # Create raw image data with a simple gradient effect
    raw_data = []
    center_x = width / 2
    center_y = height / 2
    max_dist = (center_x ** 2 + center_y ** 2) ** 0.5

    for y in range(height):
        raw_data.append(0)  # Filter byte (none)
        for x in range(width):
            # Create a radial gradient for visual appeal
            dist = ((x - center_x) ** 2 + (y - center_y) ** 2) ** 0.5
            factor = 1 - (dist / max_dist) * 0.3

            raw_data.append(int(r * factor))
            raw_data.append(int(g * factor))
            raw_data.append(int(b * factor))

    # Compress the raw data
    compressed = zlib.compress(bytes(raw_data), 9)
    idat = png_chunk(b'IDAT', compressed)

    # IEND chunk
    iend = png_chunk(b'IEND', b'')

    return signature + ihdr + idat + iend

# Get the public directory path
script_dir = os.path.dirname(os.path.abspath(__file__))
public_dir = os.path.join(script_dir, '..', 'public')

# Indigo color (matches Tailwind's indigo-500: #6366f1)
r, g, b = 99, 102, 241

# Create 192x192 icon
png_192 = create_png(192, 192, r, g, b)
with open(os.path.join(public_dir, 'pwa-192x192.png'), 'wb') as f:
    f.write(png_192)
print('Created pwa-192x192.png')

# Create 512x512 icon
png_512 = create_png(512, 512, r, g, b)
with open(os.path.join(public_dir, 'pwa-512x512.png'), 'wb') as f:
    f.write(png_512)
print('Created pwa-512x512.png')

# Create 180x180 apple-touch-icon
png_180 = create_png(180, 180, r, g, b)
with open(os.path.join(public_dir, 'apple-touch-icon.png'), 'wb') as f:
    f.write(png_180)
print('Created apple-touch-icon.png')

print('All PWA icons created successfully!')
