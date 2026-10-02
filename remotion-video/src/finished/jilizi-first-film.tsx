import { EntryFilm } from "../entry-film";
import { content } from "../films/jilizi-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const JiliziFirstFilm: React.FC = () => <EntryFilm content={content} />;
