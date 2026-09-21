import { EntryFilm } from "../entry-film";
import { content } from "../films/huangzhi-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const HuangzhiFirstFilm: React.FC = () => <EntryFilm content={content} />;
