export type IntakeColumn = {
  key: string;
  label: string;
  fullName?: string;
  slug?: string;
};

export type IntakeRow = {
  label: string;
  values: Record<string, string>;
};

export type IntakeGroup = {
  label: string;
  rows: IntakeRow[];
};

export type IntakeSection = {
  id: string;
  title: string;
  source: string;
  columns: IntakeColumn[];
  groups: IntakeGroup[];
};

export const ENERGY_SECTION: IntakeSection = {
  id: "energy",
  title: "Energy",
  source: "EFSA",
  columns: [
    { key: "pal14", label: "PAL 1.4" },
    { key: "pal16", label: "PAL 1.6" },
    { key: "pal18", label: "PAL 1.8" },
    { key: "pal20", label: "PAL 2.0" },
  ],
  groups: [
    {
      label: "Male",
      rows: [
        { label: "18-29", values: { pal14: "2,342 kcal", pal16: "2,677 kcal", pal18: "3,011 kcal", pal20: "3,346 kcal" } },
        { label: "30-39", values: { pal14: "2,270 kcal", pal16: "2,581 kcal", pal18: "2,916 kcal", pal20: "3,226 kcal" } },
        { label: "40-49", values: { pal14: "2,223 kcal", pal16: "2,557 kcal", pal18: "2,868 kcal", pal20: "3,203 kcal" } },
        { label: "50-59", values: { pal14: "2,199 kcal", pal16: "2,510 kcal", pal18: "2,844 kcal", pal20: "3,155 kcal" } },
        { label: ">60", values: { pal14: "2,008 kcal", pal16: "2,294 kcal", pal18: "2,605 kcal", pal20: "2,892 kcal" } },
      ],
    },
    {
      label: "Female",
      rows: [
        { label: "18-29", values: { pal14: "1,888 kcal", pal16: "2,151 kcal", pal18: "2,414 kcal", pal20: "2,677 kcal" } },
        { label: "30-39", values: { pal14: "1,816 kcal", pal16: "2,079 kcal", pal18: "2,342 kcal", pal20: "2,581 kcal" } },
        { label: "40-49", values: { pal14: "1,792 kcal", pal16: "2,055 kcal", pal18: "2,318 kcal", pal20: "2,557 kcal" } },
        { label: "50-59", values: { pal14: "1,792 kcal", pal16: "2,032 kcal", pal18: "2,294 kcal", pal20: "2,557 kcal" } },
        { label: ">60", values: { pal14: "1,628 kcal", pal16: "1,864 kcal", pal18: "2,103 kcal", pal20: "2,318 kcal" } },
      ],
    },
  ],
};

export const MACROS_SECTION: IntakeSection = {
  id: "macros",
  title: "Macros",
  source: "EFSA / NIH",
  columns: [
    { key: "carbs", label: "Carbs", fullName: "Carbohydrates", slug: "carbs" },
    { key: "protein", label: "Protein", fullName: "Protein", slug: "protein" },
    { key: "fat", label: "Fat", fullName: "Fat", slug: "fat" },
    { key: "fiber", label: "Fiber", fullName: "Fiber", slug: "fiber" },
    { key: "omega3", label: "Omega 3", fullName: "Omega 3", slug: "omega-3" },
    { key: "omega6", label: "Omega 6", fullName: "Omega 6 (Linoleic acid)", slug: "omega-6" },
  ],
  groups: [
    {
      label: "Male",
      rows: [
        { label: "19-50", values: { carbs: "130 g", protein: "56 g", fat: "20%-35% TEI", fiber: "38 g", omega3: "1.6 g", omega6: "17 g" } },
        { label: ">50", values: { carbs: "130 g", protein: "56 g", fat: "20%-35% TEI", fiber: "30 g", omega3: "1.6 g", omega6: "14 g" } },
      ],
    },
    {
      label: "Female",
      rows: [
        { label: "19-50", values: { carbs: "130 g", protein: "46 g", fat: "20%-35% TEI", fiber: "25 g", omega3: "1.1 g", omega6: "12 g" } },
        { label: ">50", values: { carbs: "130 g", protein: "46 g", fat: "20%-35% TEI", fiber: "21 g", omega3: "1.1 g", omega6: "11 g" } },
      ],
    },
  ],
};

export const VITAMINS_SECTION: IntakeSection = {
  id: "vitamins",
  title: "Vitamins",
  source: "NIH",
  columns: [
    { key: "a", label: "A", fullName: "Vitamin A", slug: "vitamin-a" },
    { key: "c", label: "C", fullName: "Vitamin C", slug: "vitamin-c" },
    { key: "d", label: "D", fullName: "Vitamin D", slug: "vitamin-d" },
    { key: "e", label: "E", fullName: "Vitamin E", slug: "vitamin-e" },
    { key: "k", label: "K", fullName: "Vitamin K", slug: "vitamin-k" },
  ],
  groups: [
    {
      label: "Male",
      rows: [
        { label: "19-50", values: { a: "900 mcg", c: "110 mg", d: "15 mcg", e: "15 mg", k: "120 mcg" } },
        { label: ">50", values: { a: "900 mcg", c: "110 mg", d: "15 mcg", e: "15 mg", k: "120 mcg" } },
      ],
    },
    {
      label: "Female",
      rows: [
        { label: "19-50", values: { a: "700 mcg", c: "95 mg", d: "15 mcg", e: "15 mg", k: "90-120 mcg" } },
        { label: ">50", values: { a: "700 mcg", c: "95 mg", d: "15 mcg", e: "15 mg", k: "90-120 mcg" } },
      ],
    },
  ],
};

export const B_VITAMINS_SECTION: IntakeSection = {
  id: "b-vitamins",
  title: "B Vitamins",
  source: "NIH / EFSA",
  columns: [
    { key: "b1", label: "1 (Thiamin)", fullName: "Vitamin B1 (Thiamin)", slug: "vitamin-b1" },
    { key: "b2", label: "2 (Riboflavin)", fullName: "Vitamin B2 (Riboflavin)", slug: "vitamin-b2" },
    { key: "b3", label: "3 (Niacin)", fullName: "Vitamin B3 (Niacin)", slug: "vitamin-b3" },
    { key: "b5", label: "5 (Pantothenic Acid)", fullName: "Vitamin B5 (Pantothenic Acid)", slug: "vitamin-b5" },
    { key: "b6", label: "6 (Pyridoxine)", fullName: "Vitamin B6 (Pyridoxine)", slug: "vitamin-b6" },
    { key: "b7", label: "7 (Biotin)", fullName: "Vitamin B7 (Biotin)", slug: "vitamin-b7" },
    { key: "b9", label: "9 (Folate)", fullName: "Vitamin B9 (Folate)", slug: "vitamin-b9" },
    { key: "b12", label: "12 (Cobalamin)", fullName: "Vitamin B12 (Cobalamin)", slug: "vitamin-b12" },
    { key: "choline", label: "Choline", fullName: "Choline", slug: "choline" },
  ],
  groups: [
    {
      label: "Male",
      rows: [
        { label: "19-50", values: { b1: "1.2 mg", b2: "1.6 mg", b3: "16 mg", b5: "5 mg", b6: "1.3 mg", b7: "30 mcg", b9: "400 mcg", b12: "2.4 mcg", choline: "550 mg" } },
        { label: ">50", values: { b1: "1.2 mg", b2: "1.6 mg", b3: "16 mg", b5: "5 mg", b6: "1.3 mg", b7: "30 mcg", b9: "400 mcg", b12: "2.4 mcg", choline: "550 mg" } },
      ],
    },
    {
      label: "Female",
      rows: [
        { label: "19-50", values: { b1: "1.1 mg", b2: "1.6 mg", b3: "14 mg", b5: "5 mg", b6: "1.3 mg", b7: "30 mcg", b9: "400 mcg", b12: "2.4 mcg", choline: "425 mg" } },
        { label: ">50", values: { b1: "1.1 mg", b2: "1.6 mg", b3: "14 mg", b5: "5 mg", b6: "1.3 mg", b7: "30 mcg", b9: "400 mcg", b12: "2.4 mcg", choline: "425 mg" } },
      ],
    },
  ],
};

export const HIGH_MINERALS_SECTION: IntakeSection = {
  id: "high-minerals",
  title: "High intake minerals",
  source: "NIH",
  columns: [
    { key: "potassium", label: "Potassium", slug: "potassium" },
    { key: "sodium", label: "Sodium", slug: "sodium" },
    { key: "magnesium", label: "Magnesium", slug: "magnesium" },
    { key: "calcium", label: "Calcium", slug: "calcium" },
    { key: "phosphorus", label: "Phosphorus", slug: "phosphorus" },
    { key: "chloride", label: "Chloride", slug: "chloride" },
  ],
  groups: [
    {
      label: "Male",
      rows: [
        { label: "19-70", values: { potassium: "3,400 mg", sodium: "1,500-<2,300 mg", magnesium: "400-420 mg", calcium: "1,000 mg", phosphorus: "700 mg", chloride: "2.3 g (19-50) / 2.0 g (51-70)" } },
        { label: ">70", values: { potassium: "3,400 mg", sodium: "1,500 mg", magnesium: "420 mg", calcium: "1,200 mg", phosphorus: "700 mg", chloride: "1.8 g" } },
      ],
    },
    {
      label: "Female",
      rows: [
        { label: "19-70", values: { potassium: "2,600 mg", sodium: "1,500-<2,300 mg", magnesium: "310-320 mg", calcium: "1,000 mg", phosphorus: "700 mg", chloride: "2.3 g (19-50) / 2.0 g (51-70)" } },
        { label: ">70", values: { potassium: "2,600 mg", sodium: "1,500 mg", magnesium: "320 mg", calcium: "1,200 mg", phosphorus: "700 mg", chloride: "1.8 g" } },
      ],
    },
  ],
};

export const MODERATE_MINERALS_SECTION: IntakeSection = {
  id: "moderate-minerals",
  title: "Moderate intake minerals",
  source: "NIH",
  columns: [
    { key: "zinc", label: "Zinc", slug: "zinc" },
    { key: "iron", label: "Iron", slug: "iron" },
    { key: "copper", label: "Copper", slug: "copper" },
    { key: "manganese", label: "Manganese", slug: "manganese" },
    { key: "fluoride", label: "Fluoride", slug: "fluoride" },
  ],
  groups: [
    {
      label: "Male",
      rows: [
        { label: "19-70", values: { zinc: "11 mg", iron: "8 mg", copper: "900 mcg", manganese: "2.3 mg", fluoride: "4 mg" } },
        { label: ">70", values: { zinc: "11 mg", iron: "8 mg", copper: "900 mcg", manganese: "2.3 mg", fluoride: "4 mg" } },
      ],
    },
    {
      label: "Female",
      rows: [
        { label: "19-70", values: { zinc: "8 mg", iron: "18 mg", copper: "900 mcg", manganese: "1.8 mg", fluoride: "3 mg" } },
        { label: ">70", values: { zinc: "8 mg", iron: "8 mg", copper: "900 mcg", manganese: "1.8 mg", fluoride: "3 mg" } },
      ],
    },
  ],
};

export const LOW_MINERALS_SECTION: IntakeSection = {
  id: "low-minerals",
  title: "Low intake minerals",
  source: "NIH",
  columns: [
    { key: "iodine", label: "Iodine", slug: "iodine" },
    { key: "selenium", label: "Selenium", slug: "selenium" },
    { key: "chromium", label: "Chromium", slug: "chromium" },
    { key: "molybdenum", label: "Molybdenum", slug: "molybdenum" },
  ],
  groups: [
    {
      label: "Male",
      rows: [
        { label: "19-70", values: { iodine: "150 mcg", selenium: "55 mcg", chromium: "35 mcg", molybdenum: "45 mcg" } },
        { label: ">70", values: { iodine: "150 mcg", selenium: "55 mcg", chromium: "30 mcg", molybdenum: "45 mcg" } },
      ],
    },
    {
      label: "Female",
      rows: [
        { label: "19-70", values: { iodine: "150 mcg", selenium: "55 mcg", chromium: "25 mcg", molybdenum: "45 mcg" } },
        { label: ">70", values: { iodine: "150 mcg", selenium: "55 mcg", chromium: "20 mcg", molybdenum: "45 mcg" } },
      ],
    },
  ],
};

export const DAILY_INTAKE_SECTIONS: IntakeSection[] = [
  ENERGY_SECTION,
  MACROS_SECTION,
  VITAMINS_SECTION,
  B_VITAMINS_SECTION,
  HIGH_MINERALS_SECTION,
  MODERATE_MINERALS_SECTION,
  LOW_MINERALS_SECTION,
];

export const NUTRIENT_LOOKUP: Record<string, { title: string; section: string }> = {};
for (const section of DAILY_INTAKE_SECTIONS) {
  for (const col of section.columns) {
    if (col.slug) {
      NUTRIENT_LOOKUP[col.slug] = { title: col.fullName ?? col.label, section: section.title };
    }
  }
}
