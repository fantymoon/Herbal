import { EntryFilm } from "../entry-film";
import { content } from "../films/juyou-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const JuyouFirstFilm: React.FC = () => <EntryFilm content={content} />;
