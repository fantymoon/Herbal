import { EntryFilm } from "../entry-film";
import { content } from "../films/juemingzi-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const JuemingziFirstFilm: React.FC = () => <EntryFilm content={content} />;
