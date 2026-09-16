import struct
import zlib
import os

BG = (10, 10, 10)
ACCENT = (154, 167, 181)


def make_png(size, path):
    radius = size * 0.28
    cx = cy = size / 2
    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            dx, dy = x - cx, y - cy
            dist = (dx * dx + dy * dy) ** 0.5
            if dist <= radius:
                r, g, b = ACCENT
            else:
                r, g, b = BG
            row += bytes((r, g, b))
        rows.append(b"\x00" + bytes(row))
    raw = b"".join(rows)

    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    idat = zlib.compress(raw, 9)
    png = sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


out_dir = os.path.join(os.path.dirname(__file__), "..", "public")
os.makedirs(out_dir, exist_ok=True)
make_png(192, os.path.join(out_dir, "icon-192.png"))
make_png(512, os.path.join(out_dir, "icon-512.png"))
make_png(180, os.path.join(out_dir, "apple-touch-icon.png"))
print("icons written to", out_dir)
