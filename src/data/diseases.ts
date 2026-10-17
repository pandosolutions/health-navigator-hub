/**
 * Conditions listed on /diseases. Each gets its own page at /diseases/{slug};
 * add content per condition as it's written.
 */
export type Disease = {
  slug: string;
  n: string;
  name: string;
  /** One line under the name on the list. */
  summary: string;
};

export const DISEASES: Disease[] = [
  {
    slug: "type-2-diabetes",
    n: "01",
    name: "Type 2 Diabetes",
    summary: "Blood sugar regulation and insulin sensitivity.",
  },
  {
    slug: "hypertension",
    n: "02",
    name: "Hypertension",
    summary: "High blood pressure and vascular health.",
  },
  {
    slug: "heart-disease",
    n: "03",
    name: "Heart Disease",
    summary: "Coronary and cardiovascular conditions.",
  },
  {
    slug: "obesity",
    n: "04",
    name: "Obesity",
    summary: "Weight, metabolism and body composition.",
  },
  {
    slug: "high-cholesterol",
    n: "05",
    name: "High Cholesterol",
    summary: "Blood lipids — LDL, HDL and triglycerides.",
  },
  {
    slug: "anemia",
    n: "06",
    name: "Anemia",
    summary: "Iron, B12, folate and red blood cell health.",
  },
  {
    slug: "inflammation-arthritis",
    n: "07",
    name: "Inflammation & Arthritis",
    summary: "Chronic inflammation and joint health.",
  },
  {
    slug: "digestive-health",
    n: "08",
    name: "Digestive Health",
    summary: "Gut function, microbiome and digestive disorders.",
  },
];

export const diseaseBySlug = (slug: string) => DISEASES.find((d) => d.slug === slug) ?? null;
