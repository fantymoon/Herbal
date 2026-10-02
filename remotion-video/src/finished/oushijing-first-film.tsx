import { EntryFilm } from "../entry-film";
import { content } from "../films/oushijing-first-film";

// Geometry, type scale, scene split and pacing all come from src/layout.ts.
export const OushijingFirstFilm: React.FC = () => <EntryFilm content={content} />;
