import { EntryFilm } from "../entry-film";
import { content } from "../films/danshen-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const DanshenFirstFilm: React.FC = () => <EntryFilm content={content} />;
