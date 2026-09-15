import os
import struct
import zlib

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'icons')


def png_chunk(tag, data):
    return (
        struct.pack('>I', len(data))
        + tag
        + data
        + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def write_png(path, width, height, bg=(250, 248, 244), circle=(45, 106, 79), white=(255, 255, 255)):
    rows = []
    cx = width / 2
    cy = height / 2
    radius = width * 0.48

    for y in range(height):
        scan = bytearray()
        scan.append(0)
        for x in range(width):
            r, g, b = bg
            dx = x - cx
            dy = y - cy
            dist = (dx * dx + dy * dy) ** 0.5
            if dist <= radius:
                r, g, b = circle
            # Check mark overlay
            if (x >= width * 0.2 and x <= width * 0.9 and y >= height * 0.3 and y <= height * 0.8):
                # left-to-right diagonal line from ~20% to ~42% across center
                if (y - (height * 0.68)) >= ((x - (width * 0.2)) * ((height * 0.24) / (width * 0.22))):
                    if (y - (height * 0.7)) <= ((x - (width * 0.55)) * ((height * 0.25) / (width * 0.25))):
                        r, g, b = white
            # More precise checkmark for both diagonals
            if abs((y - height * 0.62) - (x - width * 0.33) * (height * 0.18 / (width * 0.16))) < max(2, width * 0.02):
                if x > width * 0.16 and x < width * 0.83:
                    r, g, b = white
            if abs((y - height * 0.72) - (x - width * 0.52) * (-height * 0.18 / (width * 0.16))) < max(2, width * 0.02):
                if x > width * 0.3 and x < width * 0.88:
                    r, g, b = white

            # Keep the white check mark from being filled in by the circle background
            if (x >= width * 0.27 and x <= width * 0.84 and y >= height * 0.4 and y <= height * 0.8):
                line1 = (x - width * 0.28) * (height * 0.11 / (width * 0.18))
                line2 = (x - width * 0.58) * (-height * 0.11 / (width * 0.18))
                if abs((y - height * 0.65) - line1) < max(2, width * 0.02):
                    r, g, b = white
                if abs((y - height * 0.72) - line2) < max(2, width * 0.02):
                    r, g, b = white

            scan.extend((r, g, b, 255))
        rows.append(bytes(scan))

    raw = b''.join(rows)
    png = b'\x89PNG\r\n\x1a\n'
    png += png_chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    png += png_chunk(b'IDAT', zlib.compress(raw, 9))
    png += png_chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)


os.makedirs(OUTPUT_DIR, exist_ok=True)
for size in (192, 512):
    write_png(os.path.join(OUTPUT_DIR, f'icon-{size}.png'), size, size)
    print(f'created {os.path.join(OUTPUT_DIR, f"icon-{size}.png")}' )
