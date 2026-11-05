// Generates the short feedback sounds in assets/sounds (own content, no license needed).
// Run: node scripts/make-sounds.mjs
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 22050;
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');

function tone(freq, start, dur, gain = 0.5) {
  return { freq, start, dur, gain };
}

function render(notes, total) {
  const n = Math.floor(total * RATE);
  const buf = new Float32Array(n);
  for (const { freq, start, dur, gain } of notes) {
    const s0 = Math.floor(start * RATE);
    const len = Math.floor(dur * RATE);
    for (let i = 0; i < len && s0 + i < n; i++) {
      const t = i / RATE;
      const attack = Math.min(1, t / 0.006);
      const decay = Math.exp(-t * (4.5 / dur));
      // Soft bell: fundamental plus a quiet octave.
      const v = Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(2 * Math.PI * freq * 2 * t);
      buf[s0 + i] += v * gain * attack * decay;
    }
  }
  let peak = 0;
  for (const v of buf) peak = Math.max(peak, Math.abs(v));
  const scale = peak > 0 ? 0.8 / peak : 1;
  const data = Buffer.alloc(44 + n * 2);
  data.write('RIFF', 0);
  data.writeUInt32LE(36 + n * 2, 4);
  data.write('WAVE', 8);
  data.write('fmt ', 12);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22);
  data.writeUInt32LE(RATE, 24);
  data.writeUInt32LE(RATE * 2, 28);
  data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34);
  data.write('data', 36);
  data.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf[i] * scale)) * 32767), 44 + i * 2);
  return data;
}

const files = {
  'correct.wav': render([tone(1046.5, 0, 0.25), tone(1318.5, 0.08, 0.3)], 0.42),
  'wrong.wav': render([tone(311.1, 0, 0.22, 0.45), tone(233.1, 0.12, 0.3, 0.45)], 0.45),
  'complete.wav': render([tone(523.3, 0, 0.3), tone(659.3, 0.1, 0.3), tone(784, 0.2, 0.35), tone(1046.5, 0.32, 0.6)], 1.0),
  'tap.wav': render([tone(880, 0, 0.06, 0.25)], 0.08),
};
for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(out, name), data);
  console.log(name, data.length, 'bytes');
}
