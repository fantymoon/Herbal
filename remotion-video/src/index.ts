import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

// The films set their body text in 楷体, and the stack they used to name — STKaiti, KaiTi —
// exists on macOS and Windows only. A render on Linux (CI, or any machine that is not this
// one) silently fell back to whatever serif the box had, so the same content module
// produced two different-looking films. 霞鹜文楷 is SIL OFL 1.1, so it is safe for a
// monetised account, and shipping the file removes the platform from the question.
//
// It is 24 MB. That is the price of not having the film's type depend on which machine
// rendered it; the corpus next door is 164 MB.
loadFont({
  family: "LXGW WenKai",
  url: staticFile("fonts/LXGWWenKai-Regular.ttf"),
  weight: "400",
});

registerRoot(RemotionRoot);
