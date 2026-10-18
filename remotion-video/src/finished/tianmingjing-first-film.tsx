import { EntryFilm } from "../entry-film";
import { content } from "../films/tianmingjing-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const TianmingjingFirstFilm: React.FC = () => <EntryFilm content={content} />;
