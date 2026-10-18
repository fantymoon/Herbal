import { EntryFilm } from "../entry-film";
import { content } from "../films/baiji-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const BaijiFirstFilm: React.FC = () => <EntryFilm content={content} />;
