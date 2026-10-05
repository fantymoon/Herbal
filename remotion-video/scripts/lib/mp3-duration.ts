// MP3 duration, read out of the file itself.
//
// Why not ask ffmpeg: this sandbox refuses the *synchronous* spawn (`execFileSync`/`spawnSync`
// return EBUSY) where the asynchronous one runs, and a frame walk needs no child process at
// all. Walking the headers is exact for both CBR and VBR — it counts the frames that are
// actually there rather than dividing the file size by a nominal bitrate.
//
// The number matters because of a silent failure in @remotion/media. `loop` computes the
// loop length from `trimAfter`, and when the asset duration cannot be determined it falls
// back to treating the media as infinitely long. Pass a film-length `trimAfter` and the
// loop degenerates into "play once" — no error, no warning, just a music bed that stops.
// Handing it the real track length is what makes the loop a loop.

const BITRATES: Record<string, readonly number[]> = {
  // Only Layer III is needed, but the index is written plainly.
  "1-3": [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  "2-3": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};
const SAMPLE_RATES: Record<number, readonly number[]> = {
  1: [44100, 48000, 32000],
  2: [22050, 24000, 16000],
  25: [11025, 12000, 8000],
};

/** Byte offset just past the ID3v2 tag, if the file opens with one. */
const id3End = (buf: Buffer): number => {
  if (buf.length < 10 || buf.toString("latin1", 0, 3) !== "ID3") return 0;
  const size =
    ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f);
  return 10 + size;
};

/**
 * Seconds of audio in an MP3 buffer, or null if no frame header could be read.
 * Skips junk between frames the way a decoder does, so a stray tag or a partial write
 * costs a few bytes rather than the whole answer.
 */
export const mp3DurationSeconds = (buf: Buffer): number | null => {
  let at = id3End(buf);
  // A trailing ID3v1 tag is 128 bytes of metadata that would otherwise be read as junk.
  let end = buf.length;
  if (end >= 128 && buf.toString("latin1", end - 128, end - 125) === "TAG") end -= 128;

  let seconds = 0;
  let frames = 0;
  while (at + 4 <= end) {
    if (buf[at] !== 0xff || (buf[at + 1] & 0xe0) !== 0xe0) {
      at += 1;
      continue;
    }
    const versionBits = (buf[at + 1] >> 3) & 0x03; // 3 = MPEG1, 2 = MPEG2, 0 = MPEG2.5
    const layerBits = (buf[at + 1] >> 1) & 0x03; // 1 = Layer III
    if (versionBits === 1 || layerBits === 0) {
      at += 1;
      continue;
    }
    const version = versionBits === 3 ? 1 : versionBits === 2 ? 2 : 25;
    const layer = 4 - layerBits;
    if (layer !== 3) {
      at += 1;
      continue;
    }
    const bitrateIndex = (buf[at + 2] >> 4) & 0x0f;
    const rateIndex = (buf[at + 2] >> 2) & 0x03;
    if (bitrateIndex === 0 || bitrateIndex === 15 || rateIndex === 3) {
      at += 1;
      continue;
    }
    const bitrate = BITRATES[`${version === 1 ? 1 : 2}-3`][bitrateIndex] * 1000;
    const sampleRate = SAMPLE_RATES[version][rateIndex];
    const padding = (buf[at + 2] >> 1) & 0x01;
    const samples = version === 1 ? 1152 : 576;
    const frameBytes = Math.floor(((version === 1 ? 144 : 72) * bitrate) / sampleRate) + padding;
    if (frameBytes < 4) {
      at += 1;
      continue;
    }
    seconds += samples / sampleRate;
    frames += 1;
    at += frameBytes;
  }
  return frames === 0 ? null : seconds;
};
