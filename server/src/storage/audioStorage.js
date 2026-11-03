import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const storageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../storage/audio');
const extensions = new Set(['webm', 'ogg', 'wav', 'mp3', 'm4a']);

export const audioStorage = {
  async put(buffer, format) {
    if (!extensions.has(format)) throw new Error('Unsupported audio format.');
    await mkdir(storageDirectory, { recursive: true });
    const storageKey = `${randomUUID()}.${format}`;
    const filePath = path.join(storageDirectory, storageKey);
    const { writeFile } = await import('node:fs/promises');
    await writeFile(filePath, buffer, { flag: 'wx', mode: 0o600 });
    return storageKey;
  },
  resolve(storageKey) {
    if (!/^[0-9a-f-]{36}\.(webm|ogg|wav|mp3|m4a)$/.test(storageKey)) throw new Error('Invalid audio reference.');
    return path.join(storageDirectory, storageKey);
  },
  async remove(storageKey) {
    try { await unlink(this.resolve(storageKey)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  },
};

export function inspectAudio(buffer, mimeType) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12 || buffer.length > 10 * 1024 * 1024) return null;
  const normalized = String(mimeType || '').split(';')[0].trim().toLowerCase();
  const signatures = [
    { format: 'webm', mime: 'audio/webm', valid: () => buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
    { format: 'ogg', mime: 'audio/ogg', valid: () => buffer.toString('ascii', 0, 4) === 'OggS' },
    { format: 'wav', mime: 'audio/wav', valid: () => buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE' },
    { format: 'mp3', mime: 'audio/mpeg', valid: () => buffer.toString('ascii', 0, 3) === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) },
    { format: 'm4a', mime: 'audio/mp4', valid: () => buffer.toString('ascii', 4, 8) === 'ftyp' },
  ];
  return signatures.find((item) => item.mime === normalized && item.valid()) || null;
}
