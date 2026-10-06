import { EntryFilm } from "../entry-film";
import { content } from "../films/loulu-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const LouluFirstFilm: React.FC = () => <EntryFilm content={content} />;
