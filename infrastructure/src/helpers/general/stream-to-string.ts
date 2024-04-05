/* ---------- External ---------- */
import { Readable } from 'stream';

export const stream_to_string = (stream: Readable) => {
  return new Promise<string>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
};
