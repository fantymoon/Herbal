import { EntryFilm } from "../entry-film";
import { content } from "../films/longyan-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const LongyanFirstFilm: React.FC = () => <EntryFilm content={content} />;
