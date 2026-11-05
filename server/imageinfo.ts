import { openSync, readSync, closeSync, statSync } from 'node:fs';

/**
 * Minimal image dimension reader.
 *
 * The server measures uploaded images itself rather than trusting the client,
 * so the cover-crop maths can never be fed wrong dimensions.
 */
export function readImageSize(filePath: string): { width: number; height: number } | null {
  let fd: number | null = null;
  try {
    fd = openSync(filePath, 'r');
    const buffer = Buffer.alloc(64 * 1024);
    const bytes = readSync(fd, buffer, 0, buffer.length, 0);
    return parse(buffer.subarray(0, bytes));
  } catch {
    return null;
  } finally {
    if (fd !== null) closeSync(fd);
  }
}

function parse(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24) return null;

  // PNG
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // GIF
  if (buf.slice(0, 3).toString('ascii') === 'GIF') {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }

  // WebP (VP8X / VP8 / VP8L)
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') {
    const format = buf.slice(12, 16).toString('ascii');
    if (format === 'VP8X') {
      const width = 1 + (buf.readUIntLE(24, 3) & 0xffffff);
      const height = 1 + (buf.readUIntLE(27, 3) & 0xffffff);
      return { width, height };
    }
    if (format === 'VP8 ') {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (format === 'VP8L') {
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }

  // JPEG — walk the segment chain to the start-of-frame marker.
  if (buf.readUInt16BE(0) === 0xffd8) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buf[offset + 1];
      const length = buf.readUInt16BE(offset + 2);
      const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) {
        return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }

  return null;
}

export function fileSize(filePath: string): number {
  try {
    return statSync(filePath).size;
  } catch {
    return 0;
  }
}
