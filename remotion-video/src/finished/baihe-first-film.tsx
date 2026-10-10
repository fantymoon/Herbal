import { EntryFilm } from "../entry-film";
import { content } from "../films/baihe-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const BaiheFirstFilm: React.FC = () => <EntryFilm content={content} />;
