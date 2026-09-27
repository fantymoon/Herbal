import { EntryFilm } from "../entry-film";
import { content } from "../films/lanshi-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const LanshiFirstFilm: React.FC = () => <EntryFilm content={content} />;
