import { EntryFilm } from "../entry-film";
import { content } from "../films/feilian-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const FeilianFirstFilm: React.FC = () => <EntryFilm content={content} />;
