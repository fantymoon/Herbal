import { EntryFilm } from "../entry-film";
import { content } from "../films/putao-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const PutaoFirstFilm: React.FC = () => <EntryFilm content={content} />;
