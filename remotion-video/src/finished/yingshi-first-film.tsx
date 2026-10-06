import { EntryFilm } from "../entry-film";
import { content } from "../films/yingshi-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const YingshiFirstFilm: React.FC = () => <EntryFilm content={content} />;
