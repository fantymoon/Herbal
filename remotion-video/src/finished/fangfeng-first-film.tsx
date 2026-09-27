import { EntryFilm } from "../entry-film";
import { content } from "../films/fangfeng-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const FangfengFirstFilm: React.FC = () => <EntryFilm content={content} />;
