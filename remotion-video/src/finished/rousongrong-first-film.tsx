import { EntryFilm } from "../entry-film";
import { content } from "../films/rousongrong-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const RousongrongFirstFilm: React.FC = () => <EntryFilm content={content} />;
