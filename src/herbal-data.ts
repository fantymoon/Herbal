export type Ingredient = {
  name: string;
  amount: string;
  role: string;
};

export type Formula = {
  name: string;
  pronunciation: string;
  focus: string;
  source: string;
  ingredients: Ingredient[];
};

export type HerbProfile = {
  name: string;
  pinyin: string;
  category: string;
  classicalLine: string;
  modernNote: string;
  nature: string;
  meridians: string;
};

export type HerbalVideoProps = HerbProfile & {
  title: string;
  subtitle: string;
  accent: string;
  formula: Formula;
};

export const exampleHerb: HerbProfile = {
  name: "山药",
  pinyin: "SHAN YAO",
  category: "补益药",
  classicalLine: "补脾养胃，生津益肺，补肾涩精。",
  modernNote: "一味平和的药食同源之品，常见于山野与日常餐桌。",
  nature: "甘，平",
  meridians: "脾、肺、肾经",
};

export const exampleFormula: Formula = {
  name: "四君子汤",
  pronunciation: "SI JUN ZI TANG",
  focus: "益气健脾",
  source: "《太平惠民和剂局方》",
  ingredients: [
    { name: "人参", amount: "9g", role: "君" },
    { name: "白术", amount: "9g", role: "臣" },
    { name: "茯苓", amount: "9g", role: "佐" },
    { name: "炙甘草", amount: "6g", role: "使" },
  ],
};

const defaultHerbalVideoProps: HerbalVideoProps = {
  ...exampleHerb,
  title: exampleHerb.name,
  subtitle: "一味本草 · 一段古意",
  accent: "#9f392c",
  formula: exampleFormula,
};

export const createHerbalVideoProps = (
  overrides: Partial<HerbalVideoProps> = {},
): HerbalVideoProps => ({
  ...defaultHerbalVideoProps,
  ...overrides,
  formula: overrides.formula ?? defaultHerbalVideoProps.formula,
});
