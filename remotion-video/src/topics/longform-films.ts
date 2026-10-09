// 长视频片单。新增一期：src/topics/<id>/ 下写 film.yaml → 配音 → build 出 film.json，
// 然后在这里加一行。每期自动得到两个 Composition：Longform<Id>（成片）和 Longform<Id>Sheet（联络表）。
import type { CompiledFilm } from "../longform/plan";
import pangxie from "./pangxie/film.json";

export const longformFilms: CompiledFilm[] = [pangxie as CompiledFilm];

/** pangxie → LongformPangxie；dang-gui → LongformDangGui */
export const longformCompId = (id: string) =>
  "Longform" + id.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("");
