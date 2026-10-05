// Explicit extension: scripts load this module through `node --experimental-strip-types`,
// which resolves specifiers literally, while the bundler takes either form. tsconfig has
// `allowImportingTsExtensions`, so both agree on this spelling.
import { MUSIC_REGISTRY, type MusicTrack } from "./music-registry.ts";

/**
 * The registered track a film names, or null when it names one nobody registered.
 *
 * Matched on the basename, because callers reach this from three directions: a content
 * module says `music/yuzhou-changwan.mp3`, the renderer hands `FinishedMusic` the result
 * of `staticFile(...)` which is `/music/yuzhou-changwan.mp3`, and a hand-written film says
 * the same string as the content module. All three are the same track.
 */
export const trackOf = (src: string): MusicTrack | null => {
  const base = src.split("/").pop() ?? src;
  return MUSIC_REGISTRY.find((track) => track.file === base) ?? null;
};

/** Tracks whose licence nobody has written down yet. Printed by the gate, never silenced. */
export const unrecordedLicences = (): MusicTrack[] =>
  MUSIC_REGISTRY.filter((track) => track.license === "unrecorded");
