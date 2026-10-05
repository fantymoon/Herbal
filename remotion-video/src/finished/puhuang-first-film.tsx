import { EntryFilm } from "../entry-film";
import { content } from "../films/puhuang-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const PuhuangFirstFilm: React.FC = () => <EntryFilm content={content} />;
