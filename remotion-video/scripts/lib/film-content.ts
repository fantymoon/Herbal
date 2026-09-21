// Loader for the content module a data-driven film imports.
//
// Shared by the gate, the Composition generator and the renderer so they all agree
// on what a film's content is. Hand-written films (all 55 frozen ones) import no
// content module and report `content: null, error: null`.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { contentModuleOf } from "./film-files.ts";
import type { FilmContent } from "../../src/layout.ts";

export type LoadedContent = {
  content: FilmContent | null;
  /** Set when the film names a content module that is missing or fails to load. */
  error: string | null;
};

export const loadContent = async (filmSource: string, filmsDir: string): Promise<LoadedContent> => {
  const moduleName = contentModuleOf(filmSource);
  if (!moduleName) {
    return { content: null, error: null };
  }
  const modulePath = path.join(filmsDir, `${moduleName}.ts`);
  if (!fs.existsSync(modulePath)) {
    return { content: null, error: `src/films/${moduleName}.ts does not exist` };
  }
  try {
    const loaded = (await import(pathToFileURL(modulePath).href)) as { content: FilmContent };
    return { content: loaded.content, error: null };
  } catch (error) {
    return { content: null, error: `src/films/${moduleName}.ts failed to load: ${String(error)}` };
  }
};
