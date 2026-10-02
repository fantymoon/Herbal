import { EntryFilm } from "../entry-film";
import { content } from "../films/luoshi-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const LuoshiFirstFilm: React.FC = () => <EntryFilm content={content} />;
