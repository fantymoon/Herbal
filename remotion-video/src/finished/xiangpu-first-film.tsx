import { EntryFilm } from "../entry-film";
import { content } from "../films/xiangpu-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const XiangpuFirstFilm: React.FC = () => <EntryFilm content={content} />;
