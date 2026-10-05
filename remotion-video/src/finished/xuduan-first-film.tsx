import { EntryFilm } from "../entry-film";
import { content } from "../films/xuduan-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const XuduanFirstFilm: React.FC = () => <EntryFilm content={content} />;
