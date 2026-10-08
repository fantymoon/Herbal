// Episode 1 (English) · Why did Chinese doctors warn pregnant women against rabbit?
//
// 这一份**不是中文版的翻译**。同一个题材，但切入点是重写的：
// 中文版开场直接上「食兔肉，令子无声缺唇」——对中文观众有效，因为「兔唇」这个词
// 就在他们的语言里。英文观众没有这个联想，他们不知道为什么要关心。
// 所以英文版从一个更普遍的问题切进去：**一个名字怎么变成了一条禁忌**。
//
// 结构与中文版共用（同一批史料、同一页书影、同一套图形），渲染管线完全复用——
// 换的只有文本与配音。
//
// 引文处理：屏上给英译，书名保留中文原名并附英文，让观众看得懂又不丢出处。

export type Quote = {
  /** 屏上大字。英文版给英译；关键的中文词保留原字，附罗马字。 */
  text: string;
  /** 出处。书名保留中文原名 + 英文/年代。 */
  source: string;
};

export type Segment = {
  /** 旁白：被朗读，同时作为字幕。为耳朵写，不为眼睛写。 */
  narration: string;
  quote?: Quote;
  stat?: { value: string; unit: string; note: string };
  plate?: {
    file?: string;
    natural?: { w: number; h: number };
    crop?: { x: number; y: number; w: number; h: number };
    box?: { x: number; y: number; w: number; h: number };
    highlight?: string;
    note?: string;
  };
  role?: "title" | "quote" | "stat" | "closing";
};

export type TopicContent = {
  id: string;
  question: string;
  deck: string;
  /** 收尾屏那句。渲染器不再硬编码它——否则英文版会照搬中文。 */
  closingLine: string;
  /** 封面底部那句。 */
  tagline: string;
  /** 时间线的朝代数据。不给则用内置的中文默认值。 */
  eras?: { dynasty: string; years: string; books: string[] }[];
  segments: Segment[];
  sources: string[];
  music: string;
  accent: string;
};

export const content: TopicContent = {
  id: "TuQueTopicEn",
  question: "Why did Chinese doctors warn pregnant women against eating rabbit?",
  deck: "A taboo that lasted 1,500 years",
  segments: [
    {
      role: "title",
      narration:
        "In 1330, a court physician named Hu Sihui presented a book to the emperor of Mongol-ruled China. It listed foods, drinks, and their properties. Among them was one line: eating rabbit meat will cause a child to be born with a silent, split lip. Hu Sihui did not invent this. The warning was already fifteen hundred years old when he wrote it down, and at least fifty medical books would copy it after him.",
      quote: {
        text: "Eating rabbit meat will cause a child to be born with a silent, split lip.",
        source: "《饮膳正要》 Yinshan Zhengyao, 1330 · dietary avoidances in pregnancy",
      },
      // 与中文版同一页书影：书格《饮膳正要》影印本第 6 页，右半页「妊娠所忌」。
      plate: {
        file: "plates/yinshan-p06.jpg",
        natural: { w: 1500, h: 1313 },
        crop: { x: 640, y: 150, w: 820, h: 620 },
        box: { x: 1315, y: 298, w: 92, h: 428 },
      },
    },
    {
      role: "quote",
      narration:
        "In Chinese, a cleft lip has a name: tu que, rabbit defect. A seventh-century medical text explains where the name comes from. A person born with a split lip, it says, looks like a rabbit's mouth. So that is what they called it. Listen to the logic. It looks like a rabbit. Not it was caused by a rabbit.",
      quote: {
        text: "A person born with a split lip looks like a rabbit's mouth. So they called it tu que, rabbit defect.",
        source: "《诸病源候论》 Zhu Bing Yuan Hou Lun, 610 · disorders of the lips and mouth",
      },
    },
    {
      narration:
        "And in that same passage, the physician Chao Yuanfang did something careful. He marked where the warning came from. The world says, he wrote. He was recording it as a popular belief, not stating it as his own finding.",
      quote: {
        text: "The world says it is caused by a pregnant woman seeing a rabbit, or eating rabbit meat.",
        source: "《诸病源候论》 Zhu Bing Yuan Hou Lun, 610",
      },
    },
    {
      role: "quote",
      narration:
        "Trace it back further, and it leads to the Huainanzi, a philosophical compendium from the second century before the Common Era. A pregnant woman who sees a rabbit will bear a child with a split lip. One who sees a moose will bear a child with four eyes. Nobody believes the second half anymore. The first half survived for fifteen hundred years.",
      quote: {
        text: "A pregnant woman who sees a rabbit will bear a child with a split lip; one who sees a moose will bear a child with four eyes.",
        source: "《淮南子》 Huainanzi, 2nd century BC (quoted in 《本草蒙筌》)",
      },
    },
    {
      narration:
        "It also grew stricter as it travelled. The Huainanzi said sees. By the time it reached the medical texts, it said eats. Seeing was bad. Eating was worse. A taboo getting heavier in the copying is a very common thing.",
      quote: {
        text: "Eating rabbit meat will cause a child to be born with a silent, split lip.",
        source: "《饮膳正要》 Yinshan Zhengyao, 1330",
      },
    },
    {
      narration:
        "And it goes back even further. The Book of Rites, compiled before the Common Era, has a line about eating rabbit: remove the rump. It does not say why. Later writers supplied the reason. Because it is bad for you.",
      quote: {
        text: "When eating rabbit, remove the rump — it is bad for you.",
        source: "《礼记·内则》 Book of Rites, Inner Regulations (quoted in 《饮食须知》)",
      },
    },
    {
      narration:
        "Later writers also supplied a mechanism. In the eighth century, Chen Zangqi explained that rabbits have a hole in their hindquarters and give birth through the mouth. Li Shizhen, the most famous pharmacologist in Chinese history, copied that explanation into his Compendium of Materia Medica in 1578.",
      quote: {
        text: "Rabbits have a hole in their hindquarters and give birth through the mouth. So pregnant women should avoid them.",
        source: "Chen Zangqi, 8th century (quoted in 《本草纲目》 Bencao Gangmu)",
      },
    },
    {
      narration:
        "Chen was wrong. But he was not making things up. Rabbits really do have unusual reproductive biology. They ovulate only after mating. They have two separate uteruses, and can carry two litters at once. To someone watching without modern biology, they were genuinely strange animals, and strangeness invites explanation.",
    },
    {
      role: "quote",
      narration:
        "Nor was everyone convinced. A sixteenth-century text quotes the Huainanzi line and then pushes back. Things have their natural reasons, the author writes, but sometimes they do not look that way. His example: a moose appears to have four eyes. The back two are just night-eyes. Looking like something, he is saying, is not the same as being caused by it.",
      quote: {
        text: "Things have their natural reasons, but sometimes they do not look that way.",
        source: "《本草蒙筌》 Bencao Mengquan, 16th century",
      },
    },
    {
      role: "stat",
      narration:
        "So how far did the warning actually spread? Search the full corpus of seven hundred and one classical Chinese medical texts, and the phrase appears in fifty-one of them, across a thousand years. It is not one book's oddity. It is a consensus of an entire literature.",
      stat: {
        value: "51",
        unit: "medical texts",
        note: "From the Tang dynasty to the Ming, spanning roughly a thousand years",
      },
    },
    {
      role: "quote",
      narration:
        "But here is the part that makes it strange. In the surgical manuals, the same tradition, the same centuries, a cleft lip is a real condition with a real operation. One text describes a powder for closing a split lip. Another says the same powder also stops bleeding from a cut throat. The surgeons were repairing cleft lips while the physicians were copying down a warning about rabbit meat.",
      quote: {
        text: "Two-Dragon Powder. For closing a split lip. Also for a cut throat bleeding freely — applied, the wound closes.",
        source: "《外科大成》 Wai Ke Da Cheng, 1665",
      },
    },
    {
      narration:
        "Today we know how a cleft lip actually forms. In the fourth to seventh week of pregnancy, the tissues that should join to form the upper lip fail to meet. Genetics and environment both play a part: smoking, alcohol, certain medications, folate deficiency. Rabbit meat plays no part at all.",
    },
    {
      role: "closing",
      narration:
        "But the ancients were not wrong about everything. What a mother eats and drinks during pregnancy really does matter. They had the concern right. They attached it to the wrong cause. And a warning that lasted fifteen hundred years may have started with nothing more than a name. Tu que. Rabbit defect. It looked like a rabbit, so they called it that. And somewhere along the way, the naming became the reason.",
    },
  ],
  sources: [
    "《礼记·内则》 Book of Rites (pre-Qin)",
    "《淮南子》 Huainanzi (2nd c. BC)",
    "《诸病源候论》 Zhu Bing Yuan Hou Lun (610)",
    "《外台秘要》 Waitai Miyao (752)",
    "《本草拾遗》 Bencao Shiyi (8th c., via 《本草纲目》)",
    "《太平圣惠方》 Taiping Shenghui Fang (992)",
    "《妇人大全良方》 Furen Daquan Liangfang (1237)",
    "《饮膳正要》 Yinshan Zhengyao (1330)",
    "《饮食须知》 Yinshi Xuzhi (14th c.)",
    "《本草蒙筌》 Bencao Mengquan (16th c.)",
    "《本草纲目》 Bencao Gangmu (1578)",
    "《普济方》 Puji Fang (1406)",
    "《疡医大全》 Yangyi Daquan (1740)",
    "《外科大成》 Wai Ke Da Cheng (1665)",
    "《丹台玉案》 Dantai Yu'an (17th c.)",
  ],
  closingLine: "Ancient books are a record of people, not of nature.",
  tagline: "One claim from the classical record, traced back to its source",
  // 时间线用英文：朝代名与年代都要能被英文观众读懂。
  // **英文版不列书名**——罗马字比中文长得多（"Taiping Shenghui Fang" 21 个字符），
  // 五列并排必然重叠；书名交给旁白去说。
  eras: [
    { dynasty: "Han", years: "2nd c. BC", books: [] },
    { dynasty: "Tang", years: "610", books: [] },
    { dynasty: "Song", years: "992", books: [] },
    { dynasty: "Yuan", years: "1330", books: [] },
    { dynasty: "Ming", years: "1578", books: [] },
  ],
  music: "music/yuzhou-changwan.mp3",
  accent: "#9d3527",
};
