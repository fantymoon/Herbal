import { EntryFilm } from "../entry-film";
import { content } from "../films/huma-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const HumaFirstFilm: React.FC = () => <EntryFilm content={content} />;
