import { EntryFilm } from "../entry-film";
import { content } from "../films/gegen-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const GegenFirstFilm: React.FC = () => <EntryFilm content={content} />;
