// Photo dimensions, read without decoding the image.
//
// Why this exists: `fetch-photo` downloaded whatever the source served, and iNaturalist's
// open-data bucket serves research-grade originals — 3248×4872, 15.5 MB. The framed insert is
// 932 px wide and the blurred bed is 1080 px, so every film was shipping with an image five
// times larger than anything that can be drawn. 86 files, 134 MB, in a repository that has to
// be cloned to render one video.
//
// The size is read from the JPEG header rather than by decoding: the check that guards every
// registered photo runs over all of them, and spawning a decoder 86 times would make the gate
// slower than the render it is meant to precede.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { bundledFfmpeg } from "./audio.ts";

/** The long edge a photo may have. The largest thing drawn from one is a 1080-px full bleed. */
export const MAX_PHOTO_EDGE = 2000;

/**
 * Width and height of a raster, from its header; null when neither signature is readable.
 *
 * Both are read from the header rather than by decoding: the check that guards every
 * registered photo runs over all of them, and spawning a decoder 86 times would make the gate
 * slower than the render it is meant to precede.
 *
 * The PNG branch is not hypothetical — `leonurus-chongweizi.jpg` is a PNG with a .jpg name,
 * which iNaturalist will happily serve because it keys the extension off its own id, not off
 * the bytes.
 */
export const jpegSize = (bytes: Buffer): { width: number; height: number } | null => {
  if (bytes.length > 24 && bytes.readUInt32BE(0) === 0x89504e47 && bytes.readUInt32BE(4) === 0x0d0a1a0a) {
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    return width > 0 && height > 0 ? { width, height } : null;
  }
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let at = 2;
  let found: { width: number; height: number } | null = null;
  while (at < bytes.length - 9) {
    if (bytes[at] !== 0xff) {
      at += 1;
      continue;
    }
    const marker = bytes[at + 1];
    // 0xd0–0xd7 are restart markers with no length field; 0xd8/0xd9 are the image bounds.
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      at += 2;
      continue;
    }
    const length = bytes.readUInt16BE(at + 2);
    const isFrame =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isFrame) {
      const height = bytes.readUInt16BE(at + 5);
      const width = bytes.readUInt16BE(at + 7);
      if (width > 0 && height > 0) found = { width, height };
    }
    if (marker === 0xda) break;
    at += 2 + length;
  }
  return found;
};

/** How a photo's raster compares with `MAX_PHOTO_EDGE`. */
export const photoOversize = (file: string): string | null => {
  let bytes: Buffer;
  try {
    bytes = fs.readFileSync(file);
  } catch {
    return "读不到文件";
  }
  const size = jpegSize(bytes);
  if (!size) return "读不出尺寸的位图";
  const edge = Math.max(size.width, size.height);
  return edge > MAX_PHOTO_EDGE
    ? `${size.width}×${size.height}，长边 ${edge}px 超过 ${MAX_PHOTO_EDGE}px`
    : null;
};

/**
 * Rewrite `file` so its long edge is at most `MAX_PHOTO_EDGE`, in place.
 *
 * ffmpeg is the one decoder this repository already depends on (the audio bed is measured
 * with it), so this adds no dependency. Two details cost real time to discover by failure:
 * the bundled build is stripped, so the scale factors are computed here and passed as plain
 * numbers rather than as a filter expression with commas; and the output file's **extension
 * is what selects the encoder**, so the scratch file has to be named `.jpg` even though it is
 * a temporary.
 */
export const shrinkPhoto = async (repo: string, file: string): Promise<string | null> => {
  if (!/\.(jpe?g)$/i.test(file)) return null;
  const ffmpeg = bundledFfmpeg(repo);
  if (!ffmpeg) return "没有可用的 ffmpeg，图片未缩放";
  const bytes = fs.readFileSync(file);
  const size = jpegSize(bytes);
  if (!size) return "读不出尺寸，未缩放";
  const edge = Math.max(size.width, size.height);
  if (edge <= MAX_PHOTO_EDGE) return null;
  const scale = MAX_PHOTO_EDGE / edge;
  const width = Math.round((size.width * scale) / 2) * 2;
  const height = Math.round((size.height * scale) / 2) * 2;
  const stem = file.replace(/\.[^.]+$/, "");
  // ffmpeg picks the *demuxer* from the input extension too, and iNaturalist names files by
  // photo id rather than by bytes — `leonurus-chongweizi.jpg` is a PNG. Handing the decoder a
  // scratch file named for what it actually is costs one copy and removes a whole class of
  // "it works for every photo except that one".
  const source = `${stem}.source.${bytes[0] === 0xff && bytes[1] === 0xd8 ? "jpg" : "png"}`;
  fs.copyFileSync(file, source);
  const before = bytes.length;
  let result = "没有可用的缩放结果";
  try {
    // q2 first; a few originals are already so efficiently encoded that a faithful
    // re-encode is *larger*, and in that case a coarser one is what actually shrinks the
    // repository without dropping below the size the raster is being cut for.
    for (const quality of ["2", "5"]) {
      const temp = `${stem}.shrinking.jpg`;
      const code = await new Promise<number>((resolve) => {
        const child = spawn(
          ffmpeg,
          [
            "-loglevel",
            "error",
            "-y",
            "-i",
            source,
            "-vf",
            `scale=${width}:${height}`,
            "-frames:v",
            "1",
            "-update",
            "1",
            "-q:v",
            quality,
            temp,
          ],
          { stdio: ["ignore", "ignore", "pipe"] },
        );
        child.on("error", () => resolve(-1));
        child.on("close", (code) => resolve(code ?? -1));
      });
      if (code !== 0 || !fs.existsSync(temp)) {
        fs.rmSync(temp, { force: true });
        result = `缩放失败（ffmpeg 退出 ${code}），保留原图`;
        continue;
      }
      const after = fs.statSync(temp).size;
      if (after >= before) {
        fs.rmSync(temp, { force: true });
        result = `重编码后反而更大（${(before / 1024).toFixed(0)}KB 原图），保留原尺寸`;
        continue;
      }
      fs.renameSync(temp, file);
      return `${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(1)}MB，${size.width}×${size.height} → ${width}×${height}`;
    }
  } finally {
    fs.rmSync(source, { force: true });
  }
  return result;
};

/** Every photo in `public/images` that is larger than the cap, with what is wrong. */
export const oversizePhotos = (imagesDir: string): { file: string; problem: string }[] =>
  fs
    .readdirSync(imagesDir)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .map((f) => ({ file: f, problem: photoOversize(path.join(imagesDir, f)) }))
    .filter((row): row is { file: string; problem: string } => row.problem !== null);
