// Shared helpers for reading finished-film files.
//
// Replaces the string-heuristic naming that used to be duplicated across
// scripts/generate-compositions.mjs, scripts/build-progress.mjs and the tests
// (which needed a special case for the angelica "real photo" wrapper in three
// separate places). The exported component name is the authoritative film id.

export const toKebab = (name: string): string =>
  name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/**
 * The Composition id of a film, taken from its own `export const` declaration.
 * Prefers a `*Film` / `*Photo` export, matching scripts/generate-compositions.mjs.
 */
export const readFilmId = (source: string): string | null => {
  const names = [...source.matchAll(/export const (\w+)/g)].map((m) => m[1]);
  if (names.length === 0) {
    return null;
  }
  const filmLike = names.filter((n) => /(Film|Photo)$/.test(n));
  const pool = filmLike.length > 0 ? filmLike : names;
  return pool[pool.length - 1];
};
