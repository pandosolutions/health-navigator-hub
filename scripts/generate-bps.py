"""
Generates the BPS (biopsychosocial) profile reference data from one place:

  src/data/bps.generated.ts                       used by the site (lib/bps.ts)
  supabase/migrations/20261019010000_bps_profiles.sql   the database

Source: the "BPS Profile (Moringa)" sheet and the A.D.A.P.T. Profile Coding
Key (infopandosolutions.wixsite.com/adapt/profile-coding-key). Edit the data
below, then run:  python scripts/generate-bps.py

Levels 1-3 (primary, secondary, tertiary) are live. Levels 4-5 are the
premium values: their reference data is stored, but not collected yet.
"""

import itertools
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

# --- Level 1: primary (sex x age band) -------------------------------------
AGE_BANDS = [(18, 29), (30, 39), (40, 49), (50, 59), (60, None)]
PRIMARY = []
for i, (lo, hi) in enumerate(AGE_BANDS):
    for j, sex in enumerate(["male", "female"]):
        band = f"{lo}-{hi}" if hi else f"{lo}+"
        PRIMARY.append({
            "code": i * 2 + j + 1,
            "label": f"{sex.capitalize()}, {band}",
            "sex": sex,
            "ageMin": lo,
            "ageMax": hi,
        })

# --- Level 2: secondary (ancestry) -----------------------------------------
# The Profile Coding Key's numbering. (The sheet repeats "Central African" at 7
# and leaves out Korean, which shifts its 7-10; from 11 on they agree.)
SECONDARY = [
    "East African", "Horn of Africa", "North African", "West African", "Central African",
    "Southern African", "Middle Eastern", "Chinese", "Japanese", "Korean", "Southeast Asian",
    "South Asian", "Indian", "Pacific Islander", "European", "Balkan", "Native American",
    "Hispanic", "Caribbean",
]

# --- Level 3: tertiary (condition or common combination) --------------------
# key, label, SNOMED CT id, anatomy systems (home page explorer ids)
CONDITIONS = [
    ("cad", "Coronary artery disease", "8957000", ["cardio"]),
    ("hf", "Heart failure", "84114007", ["cardio"]),
    ("arrhythmia", "Cardiac arrhythmia", "698247007", ["cardio"]),
    ("valve", "Heart valve disorder", "368009", ["cardio"]),
    ("cardiomyopathy", "Cardiomyopathy", "85898001", ["cardio"]),
    ("congenital_heart", "Congenital heart disease", "13213009", ["cardio"]),
    ("pericardium", "Disorder of pericardium", "45822004", ["cardio"]),
    ("pad", "Peripheral arterial disease", "400047006", ["cardio"]),
    ("aorta", "Disorder of aorta", "87709005", ["cardio"]),
    ("htn", "Essential hypertension", "59621000", ["cardio"]),
    ("infective", "Infective disorder", "40733004", []),
    ("stroke", "Cerebrovascular accident (stroke)", "230690007", ["neuro", "cardio"]),
    ("obesity", "Obesity", "414916001", ["endo"]),
    ("hld", "Hyperlipidemia (high cholesterol)", "55822004", ["cardio", "endo"]),
    ("t1d", "Type 1 diabetes", "46635009", ["endo"]),
    ("t2d", "Type 2 diabetes", "44054006", ["endo"]),
    ("ckd", "Chronic kidney disease", "709044004", []),
    ("hypothyroid", "Hypothyroidism", "40930008", ["endo"]),
    ("hyperthyroid", "Hyperthyroidism", "34486009", ["endo"]),
    ("pancreatitis", "Chronic pancreatitis", "25868003", ["digest", "endo"]),
    ("hepatitis", "Chronic viral hepatitis", "128302006", ["digest"]),
    ("nafld", "Nonalcoholic fatty liver", "442685003", ["digest"]),
    ("copd", "Chronic obstructive lung disease (COPD)", "13645005", ["resp"]),
    ("asthma", "Asthma", "195967001", ["resp"]),
    ("psoriasis", "Psoriasis", "9014002", []),
    ("atopic_dermatitis", "Atopic dermatitis (eczema)", "24079001", []),
    ("sle", "Systemic lupus erythematosus", "55464009", ["musc"]),
    ("oa", "Osteoarthritis", "396275006", ["musc"]),
    ("ra", "Rheumatoid arthritis", "69896004", ["musc"]),
    ("osteoporosis", "Osteoporosis", "64859006", ["musc"]),
    ("prostate", "Disorder of prostate", "235329009", []),
    ("gynecologic", "Gynecologic disorder", "198130006", []),
    ("cancer", "Cancer (other)", "363346000", []),
    ("breast_cancer", "Breast cancer", "254837009", []),
    ("colon_cancer", "Colon cancer", "363406005", ["digest"]),
    ("lung_cancer", "Lung cancer", "363358000", ["resp"]),
    ("blood_cancer", "Blood cancer (hematopoietic)", "128462008", []),
    ("hiv", "HIV infection", "86406008", []),
    ("ibd", "Inflammatory bowel disease", "24526004", ["digest"]),
    ("ibs", "Irritable bowel syndrome", "10743008", ["digest"]),
    ("gerd", "Gastroesophageal reflux disease (GERD)", "235595009", ["digest"]),
    ("peptic_ulcer", "Peptic ulcer", "79015004", ["digest"]),
    ("osa", "Obstructive sleep apnea", "78275009", ["resp"]),
    ("chronic_pain", "Chronic pain", "82423001", ["neuro", "musc"]),
    ("alzheimers", "Alzheimer's disease", "26929004", ["neuro"]),
    ("parkinsons", "Parkinson's disease", "49049000", ["neuro"]),
    ("epilepsy", "Epilepsy", "84757009", ["neuro"]),
    ("ms", "Multiple sclerosis", "24700007", ["neuro"]),
    ("migraine", "Migraine", "37796009", ["neuro"]),
    ("mdd", "Major depressive disorder", "370143000", ["neuro"]),
    ("anxiety", "Anxiety disorder", "197480006", ["neuro"]),
    ("bipolar", "Bipolar disorder", "13746004", ["neuro"]),
]
# More specific conditions some combinations name. Choosing one also counts
# as its parent (so atrial fibrillation alone codes as cardiac arrhythmia).
SUBTYPES = [
    ("afib", "Atrial fibrillation", "arrhythmia", ["cardio"]),
    ("bph", "Enlarged prostate (BPH)", "prostate", []),
    ("pcos", "Polycystic ovary syndrome (PCOS)", "gynecologic", ["endo"]),
    ("lupus_nephritis", "Lupus nephritis", "sle", ["musc"]),
    ("psoriatic_arthritis", "Psoriatic arthritis", "psoriasis", ["musc"]),
    ("pancreatogenic_diabetes", "Diabetes from pancreatitis", "pancreatitis", ["endo", "digest"]),
    ("insulin_resistance", "Insulin resistance / prediabetes", None, ["endo"]),
    ("dementia", "Dementia", None, ["neuro"]),
]
ANY_CANCER = ["cancer", "breast_cancer", "colon_cancer", "lung_cancer", "blood_cancer"]
# Combinations, in the sheet's order (codes 53-137). Each requirement is a
# list of conditions, any one of which satisfies it.
COMBOS = [
    ("Essential hypertension + Hyperlipidemia", None, [["htn"], ["hld"]]),
    ("Type 2 diabetes + Essential hypertension", None, [["t2d"], ["htn"]]),
    ("Type 2 diabetes + Hyperlipidemia", "137931000119102", [["t2d"], ["hld"]]),
    ("Type 2 diabetes + Essential hypertension + Hyperlipidemia", None, [["t2d"], ["htn"], ["hld"]]),
    ("Obesity + Type 2 diabetes", "81531005", [["obesity"], ["t2d"]]),
    ("Obesity + Essential hypertension", None, [["obesity"], ["htn"]]),
    ("Obesity + Hyperlipidemia", None, [["obesity"], ["hld"]]),
    ("Metabolic syndrome (Obesity + Hypertension + Hyperlipidemia + Insulin resistance)", "237602007",
     [["obesity"], ["htn"], ["hld"], ["insulin_resistance", "t2d"]]),
    ("Obesity + Nonalcoholic fatty liver", None, [["obesity"], ["nafld"]]),
    ("Type 2 diabetes + Nonalcoholic fatty liver", None, [["t2d"], ["nafld"]]),
    ("Hypothyroidism + Hyperlipidemia", None, [["hypothyroid"], ["hld"]]),
    ("Type 1 diabetes + Hypothyroidism", None, [["t1d"], ["hypothyroid"]]),
    ("Coronary artery disease + Essential hypertension", None, [["cad"], ["htn"]]),
    ("Coronary artery disease + Hyperlipidemia", None, [["cad"], ["hld"]]),
    ("Coronary artery disease + Essential hypertension + Hyperlipidemia", None, [["cad"], ["htn"], ["hld"]]),
    ("Coronary artery disease + Type 2 diabetes", None, [["cad"], ["t2d"]]),
    ("Coronary artery disease + Type 2 diabetes + Hyperlipidemia", None, [["cad"], ["t2d"], ["hld"]]),
    ("Heart failure + Essential hypertension", "46113002", [["hf"], ["htn"]]),
    ("Heart failure + Atrial fibrillation", None, [["hf"], ["afib"]]),
    ("Heart failure + Coronary artery disease", None, [["hf"], ["cad"]]),
    ("Heart failure + Type 2 diabetes", None, [["hf"], ["t2d"]]),
    ("Heart failure + Chronic kidney disease", None, [["hf"], ["ckd"]]),
    ("Heart failure + Essential hypertension + Chronic kidney disease", "15781000119107", [["hf"], ["htn"], ["ckd"]]),
    ("Heart failure + Chronic obstructive lung disease", None, [["hf"], ["copd"]]),
    ("Atrial fibrillation + Essential hypertension", None, [["afib"], ["htn"]]),
    ("Atrial fibrillation + Heart valve disorder", "313377641000119105", [["afib"], ["valve"]]),
    ("Hyperthyroidism + Atrial fibrillation", None, [["hyperthyroid"], ["afib"]]),
    ("Stroke + Essential hypertension", None, [["stroke"], ["htn"]]),
    ("Stroke + Atrial fibrillation", None, [["stroke"], ["afib"]]),
    ("Stroke + Type 2 diabetes", None, [["stroke"], ["t2d"]]),
    ("Peripheral arterial disease + Type 2 diabetes", "314902007", [["pad"], ["t2d"]]),
    ("Peripheral arterial disease + Coronary artery disease", None, [["pad"], ["cad"]]),
    ("Chronic kidney disease + Essential hypertension", "104931000119100", [["ckd"], ["htn"]]),
    ("Chronic kidney disease + Type 2 diabetes", "771000119108", [["ckd"], ["t2d"]]),
    ("Chronic kidney disease + Type 2 diabetes + Essential hypertension", "71421000119105", [["ckd"], ["t2d"], ["htn"]]),
    ("Chronic kidney disease + Type 1 diabetes", "96441000119101", [["ckd"], ["t1d"]]),
    ("Systemic lupus erythematosus + Kidney disease (lupus nephritis)", "68815009", [["sle"], ["lupus_nephritis", "ckd"]]),
    ("Asthma + COPD (overlap)", "10692761000119107", [["asthma"], ["copd"]]),
    ("COPD + Coronary artery disease", None, [["copd"], ["cad"]]),
    ("COPD + Major depressive disorder", None, [["copd"], ["mdd"]]),
    ("COPD + Anxiety disorder", None, [["copd"], ["anxiety"]]),
    ("Asthma + Obesity", None, [["asthma"], ["obesity"]]),
    ("Asthma + Atopic dermatitis", None, [["asthma"], ["atopic_dermatitis"]]),
    ("Asthma + GERD", None, [["asthma"], ["gerd"]]),
    ("Obstructive sleep apnea + Obesity", None, [["osa"], ["obesity"]]),
    ("Obstructive sleep apnea + Essential hypertension", None, [["osa"], ["htn"]]),
    ("Obstructive sleep apnea + Obesity + Essential hypertension", None, [["osa"], ["obesity"], ["htn"]]),
    ("GERD + Obesity", None, [["gerd"], ["obesity"]]),
    ("Irritable bowel syndrome + Anxiety disorder", None, [["ibs"], ["anxiety"]]),
    ("Irritable bowel syndrome + Major depressive disorder", None, [["ibs"], ["mdd"]]),
    ("Inflammatory bowel disease + Anxiety disorder", None, [["ibd"], ["anxiety"]]),
    ("Chronic pancreatitis + Diabetes (pancreatogenic)", "51002006",
     [["pancreatitis"], ["pancreatogenic_diabetes", "t1d", "t2d"]]),
    ("Chronic viral hepatitis + HIV infection", None, [["hepatitis"], ["hiv"]]),
    ("HIV infection + Hyperlipidemia", None, [["hiv"], ["hld"]]),
    ("HIV infection + Major depressive disorder", None, [["hiv"], ["mdd"]]),
    ("Osteoarthritis + Obesity", None, [["oa"], ["obesity"]]),
    ("Osteoarthritis + Essential hypertension", None, [["oa"], ["htn"]]),
    ("Osteoarthritis + Hyperlipidemia", None, [["oa"], ["hld"]]),
    ("Osteoarthritis + Chronic pain", None, [["oa"], ["chronic_pain"]]),
    ("Rheumatoid arthritis + Coronary artery disease", None, [["ra"], ["cad"]]),
    ("Rheumatoid arthritis + Osteoporosis", None, [["ra"], ["osteoporosis"]]),
    ("Rheumatoid arthritis + Major depressive disorder", None, [["ra"], ["mdd"]]),
    ("Psoriasis + Psoriatic arthritis", "156370009", [["psoriasis"], ["psoriatic_arthritis"]]),
    ("Psoriasis + Obesity", None, [["psoriasis"], ["obesity"]]),
    ("Enlarged prostate (BPH) + Essential hypertension", None, [["bph"], ["htn"]]),
    ("PCOS + Obesity", None, [["pcos"], ["obesity"]]),
    ("Cancer + Major depressive disorder", None, [ANY_CANCER, ["mdd"]]),
    ("Breast cancer + Obesity", None, [["breast_cancer"], ["obesity"]]),
    ("Colon cancer + Type 2 diabetes", None, [["colon_cancer"], ["t2d"]]),
    ("Major depressive disorder + Anxiety disorder", None, [["mdd"], ["anxiety"]]),
    ("Major depressive disorder + Chronic pain", None, [["mdd"], ["chronic_pain"]]),
    ("Anxiety disorder + Chronic pain", None, [["anxiety"], ["chronic_pain"]]),
    ("Major depressive disorder + Type 2 diabetes", None, [["mdd"], ["t2d"]]),
    ("Major depressive disorder + Coronary artery disease", None, [["mdd"], ["cad"]]),
    ("Migraine + Major depressive disorder", None, [["migraine"], ["mdd"]]),
    ("Migraine + Anxiety disorder", None, [["migraine"], ["anxiety"]]),
    ("Bipolar disorder + Obesity", None, [["bipolar"], ["obesity"]]),
    ("Bipolar disorder + Anxiety disorder", None, [["bipolar"], ["anxiety"]]),
    ("Stroke + Major depressive disorder", None, [["stroke"], ["mdd"]]),
    ("Alzheimer's disease + Essential hypertension", None, [["alzheimers"], ["htn"]]),
    ("Alzheimer's disease + Major depressive disorder", None, [["alzheimers"], ["mdd"]]),
    ("Parkinson's disease + Major depressive disorder", None, [["parkinsons"], ["mdd"]]),
    ("Parkinson's disease + Dementia", "425390006", [["parkinsons"], ["dementia", "alzheimers"]]),
    ("Epilepsy + Major depressive disorder", None, [["epilepsy"], ["mdd"]]),
    ("Multiple sclerosis + Major depressive disorder", None, [["ms"], ["mdd"]]),
]
assert len(CONDITIONS) == 52 and len(COMBOS) == 85, (len(CONDITIONS), len(COMBOS))

SYSTEMS_BY_KEY = {k: s for k, _, _, s in CONDITIONS}
SYSTEMS_BY_KEY.update({k: s for k, _, _, s in SUBTYPES})

TERTIARY = [{"code": 0, "label": "No listed condition", "snomed": None, "requires": [], "systems": []}]
for i, (key, label, snomed, systems) in enumerate(CONDITIONS, start=1):
    TERTIARY.append({"code": i, "label": label, "snomed": snomed, "requires": [[key]], "systems": systems})
for i, (label, snomed, requires) in enumerate(COMBOS, start=53):
    systems = []
    for req in requires:
        for s in SYSTEMS_BY_KEY[req[0]]:
            if s not in systems:
                systems.append(s)
    TERTIARY.append({"code": i, "label": label, "snomed": snomed, "requires": requires, "systems": systems})
assert TERTIARY[-1]["code"] == 137

# --- Premium levels (reference data only) -----------------------------------
BODY_FAT = ["0 - 5%", "6 - 11%", "12 - 17%", "18 - 24%", "25 - 30%", ">30%"]
BLOOD_PRESSURE = ["<90/<60 mm Hg", "<90/>60 mm Hg", "<120/<80 mm Hg", "<120/>80 mm Hg",
                  ">120/<80 mm Hg", "<130/<90 mm Hg", "<130/>90 mm Hg", ">130/<90 mm Hg",
                  ">130/>90 mm Hg"]
QUATERNARY = [{"code": n, "label": f"Body fat {bf}, blood pressure {bp}", "bodyFat": bf, "bloodPressure": bp}
              for n, (bf, bp) in enumerate(itertools.product(BODY_FAT, BLOOD_PRESSURE), start=1)]
GLUCOSE = ["<100 mg/dL", "100-125 mg/dL", ">126 mg/dL"]
HBA1C = ["<5.7%", "5.7%-6.4%", ">6.5%"]
TRIGLYCERIDES = ["<150 mg/dL", "150-199 mg/dL", "500 mg/dL"]  # as in the sheet
LDL = ["<70 mg/dL", "70-99 mg/dL", "100-129 mg/dL", "130-159 mg/dL", "160-189 mg/dL", ">190 mg/dL"]
QUINARY = [{"code": n, "label": f"Glucose {g}, HbA1c {a}, TG {t}, LDL {l}",
            "fastingGlucose": g, "hba1c": a, "triglycerides": t, "ldl": l}
           for n, (g, a, t, l) in enumerate(itertools.product(GLUCOSE, HBA1C, TRIGLYCERIDES, LDL), start=1)]
assert len(QUATERNARY) == 54 and len(QUINARY) == 162

# Which conditions unlock the premium levels (sheet: "Step 4 if heart disease,
# diabetes, musculoskeletal, endocrine, kidney or gastrointestinal"; "Step 5 if diabetes").
STEP4_SYSTEMS = ["cardio", "endo", "musc", "digest"]
STEP4_KEYS = ["ckd"]
STEP5_KEYS = ["t1d", "t2d", "pancreatogenic_diabetes", "insulin_resistance"]

# --- Site data --------------------------------------------------------------
data = {
    "primary": PRIMARY,
    "secondary": [{"code": i, "label": l} for i, l in enumerate(SECONDARY, start=1)],
    "conditions": [{"key": k, "label": l, "parent": None, "systems": sy} for k, l, _, sy in CONDITIONS]
                  + [{"key": k, "label": l, "parent": p, "systems": sy} for k, l, p, sy in SUBTYPES],
    "tertiary": TERTIARY,
    "premium": {
        "quaternary": {"title": "Body composition & blood pressure", "values": QUATERNARY,
                       "unlockSystems": STEP4_SYSTEMS, "unlockKeys": STEP4_KEYS},
        "quinary": {"title": "Metabolic labs", "values": QUINARY, "unlockKeys": STEP5_KEYS},
    },
}
TS_TYPES = """export type BpsData = {
  primary: { code: number; label: string; sex: "male" | "female"; ageMin: number; ageMax: number | null }[];
  secondary: { code: number; label: string }[];
  conditions: { key: string; label: string; parent: string | null; systems: string[] }[];
  tertiary: {
    code: number;
    label: string;
    snomed: string | null;
    /** Each inner list: any one of these conditions satisfies it. */
    requires: string[][];
    systems: string[];
  }[];
  premium: {
    quaternary: {
      title: string;
      values: { code: number; label: string; bodyFat: string; bloodPressure: string }[];
      unlockSystems: string[];
      unlockKeys: string[];
    };
    quinary: {
      title: string;
      values: {
        code: number;
        label: string;
        fastingGlucose: string;
        hba1c: string;
        triglycerides: string;
        ldl: string;
      }[];
      unlockKeys: string[];
    };
  };
};
"""
ts = ("// Generated by scripts/generate-bps.py. Edit the script, not this file.\n"
      "/* eslint-disable */\n" + TS_TYPES +
      f"\nexport const BPS_DATA: BpsData = {json.dumps(data, indent=2, ensure_ascii=False)};\n")
(ROOT / "src/data/bps.generated.ts").write_text(ts, encoding="utf-8")


# --- Database ---------------------------------------------------------------
def q(v):
    if v is None:
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"


def j(v):
    return q(json.dumps(v, ensure_ascii=False)) + "::jsonb"


rows = []
for p in PRIMARY:
    rows.append(f"(1, {p['code']}, {q(p['label'])}, {j({'sex': p['sex'], 'age_min': p['ageMin'], 'age_max': p['ageMax']})}, false)")
for s in data["secondary"]:
    rows.append(f"(2, {s['code']}, {q(s['label'])}, '{{}}'::jsonb, false)")
for t in TERTIARY:
    rows.append(f"(3, {t['code']}, {q(t['label'])}, {j({'snomed_ct': t['snomed'], 'requires': t['requires'], 'systems': t['systems']})}, false)")
for v in QUATERNARY:
    rows.append(f"(4, {v['code']}, {q(v['label'])}, {j({'body_fat': v['bodyFat'], 'blood_pressure': v['bloodPressure']})}, true)")
for v in QUINARY:
    rows.append(f"(5, {v['code']}, {q(v['label'])}, {j({'fasting_glucose': v['fastingGlucose'], 'hba1c': v['hba1c'], 'triglycerides': v['triglycerides'], 'ldl': v['ldl']})}, true)")

# Seed correlations: which anatomy systems each condition highlights on the
# home page explorer (ux key 'anatomy.systems'), at the tertiary level.
corr = [f"(NULL, NULL, {t['code']}, 'anatomy.systems', {j(t['systems'])}, 'Condition to body system')"
        for t in TERTIARY if t["systems"]]

sql = f"""-- =========================================================================
-- BPS (biopsychosocial) profiles. Generated by scripts/generate-bps.py.
--
-- A profile code is primary.secondary.tertiary, e.g. BPS 1.4.13:
--   1 primary    sex x age band            (10 values)
--   2 secondary  ancestry                  (19 values)
--   3 tertiary   condition / combination   (138 values, 0 = none listed)
--   4, 5         premium: body composition & blood pressure (54), metabolic
--                labs (162). Reference data only; not collected yet.
--
--   bps_values           the coding key, every level
--   bps_combinations     every live combination (10 x 19 x 138 = 26,220)
--   bps_profiles         each user's inputs and codes (theirs to read and edit)
--   bps_correlations     what a UX should do for a profile; a NULL level
--                        matches anything, so one row can cover many profiles
--   bps_ux(code)         every correlation for a profile, most specific first,
--                        merged into one object per UX key
--   bps_combination_stats()  admin: how many people share each profile,
--                        hidden below 5 so no one can be singled out
-- =========================================================================

CREATE TABLE public.bps_values (
  level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 5),
  code SMALLINT NOT NULL CHECK (code >= 0),
  label TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{{}}'::jsonb,
  premium BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (level, code)
);
ALTER TABLE public.bps_values ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.bps_values TO anon, authenticated;
GRANT ALL ON public.bps_values TO service_role;
CREATE POLICY "Anyone reads the BPS coding key" ON public.bps_values FOR SELECT USING (true);

INSERT INTO public.bps_values (level, code, label, detail, premium) VALUES
{(","+chr(10)).join(rows)};

CREATE TABLE public.bps_combinations (
  code TEXT PRIMARY KEY,
  primary_code SMALLINT NOT NULL,
  secondary_code SMALLINT NOT NULL,
  tertiary_code SMALLINT NOT NULL,
  label TEXT NOT NULL,
  UNIQUE (primary_code, secondary_code, tertiary_code)
);
ALTER TABLE public.bps_combinations ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.bps_combinations TO anon, authenticated;
GRANT ALL ON public.bps_combinations TO service_role;
CREATE POLICY "Anyone reads BPS combinations" ON public.bps_combinations FOR SELECT USING (true);

INSERT INTO public.bps_combinations (code, primary_code, secondary_code, tertiary_code, label)
SELECT p.code || '.' || s.code || '.' || t.code, p.code, s.code, t.code,
       p.label || ' · ' || s.label || ' · ' || t.label
FROM public.bps_values p, public.bps_values s, public.bps_values t
WHERE p.level = 1 AND s.level = 2 AND t.level = 3;

CREATE TABLE public.bps_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
  birth_year SMALLINT NOT NULL CHECK (birth_year BETWEEN 1900 AND 2100),
  ancestry_code SMALLINT NOT NULL,
  conditions TEXT[] NOT NULL DEFAULT '{{}}',
  primary_code SMALLINT NOT NULL,
  secondary_code SMALLINT NOT NULL,
  tertiary_code SMALLINT NOT NULL,
  code TEXT GENERATED ALWAYS AS (
    primary_code::text || '.' || secondary_code::text || '.' || tertiary_code::text
  ) STORED,
  -- Premium levels, reserved: {{ "quaternary": n, "quinary": n, "inputs": {{...}} }}
  premium JSONB NOT NULL DEFAULT '{{}}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (primary_code, secondary_code, tertiary_code)
    REFERENCES public.bps_combinations (primary_code, secondary_code, tertiary_code)
);
CREATE INDEX bps_profiles_code_idx ON public.bps_profiles (code);
ALTER TABLE public.bps_profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bps_profiles TO authenticated;
GRANT ALL ON public.bps_profiles TO service_role;
CREATE POLICY "Users read own BPS profile" ON public.bps_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own BPS profile" ON public.bps_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own BPS profile" ON public.bps_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own BPS profile" ON public.bps_profiles
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.bps_touch()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;
REVOKE EXECUTE ON FUNCTION public.bps_touch() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER bps_profiles_touch BEFORE UPDATE ON public.bps_profiles
  FOR EACH ROW EXECUTE FUNCTION public.bps_touch();

CREATE TABLE public.bps_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_code SMALLINT,
  secondary_code SMALLINT,
  tertiary_code SMALLINT,
  ux_key TEXT NOT NULL CHECK (ux_key ~ '^[a-z0-9_.-]+$'),
  value JSONB NOT NULL,
  -- Breaks ties between rows equally specific for the same key.
  weight INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  specificity SMALLINT GENERATED ALWAYS AS (
    (primary_code IS NOT NULL)::int + (secondary_code IS NOT NULL)::int + (tertiary_code IS NOT NULL)::int
  ) STORED,
  CHECK (primary_code IS NULL OR primary_code BETWEEN 1 AND 10),
  CHECK (secondary_code IS NULL OR secondary_code BETWEEN 1 AND 19),
  CHECK (tertiary_code IS NULL OR tertiary_code BETWEEN 0 AND 137)
);
CREATE INDEX bps_correlations_match_idx ON public.bps_correlations (ux_key, tertiary_code, primary_code, secondary_code);
ALTER TABLE public.bps_correlations ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.bps_correlations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bps_correlations TO authenticated;
GRANT ALL ON public.bps_correlations TO service_role;
CREATE POLICY "Anyone reads BPS correlations" ON public.bps_correlations FOR SELECT USING (true);
CREATE POLICY "Admins manage BPS correlations" ON public.bps_correlations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.bps_correlations (primary_code, secondary_code, tertiary_code, ux_key, value, note) VALUES
{(","+chr(10)).join(corr)};

-- Everything that applies to one profile code ('1.4.13'): for each UX key the
-- most specific matching row wins (then weight, then newest). Returns
--   {{ "code": "1.4.13", "ux": {{ key: value, ... }}, "matches": [ ... ] }}
CREATE OR REPLACE FUNCTION public.bps_ux(_code TEXT)
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH c AS (
    SELECT primary_code AS p, secondary_code AS s, tertiary_code AS t
    FROM bps_combinations WHERE code = _code
  ),
  m AS (
    SELECT r.*, row_number() OVER (
             PARTITION BY r.ux_key ORDER BY r.specificity DESC, r.weight DESC, r.created_at DESC
           ) AS rank
    FROM bps_correlations r, c
    WHERE (r.primary_code IS NULL OR r.primary_code = c.p)
      AND (r.secondary_code IS NULL OR r.secondary_code = c.s)
      AND (r.tertiary_code IS NULL OR r.tertiary_code = c.t)
  )
  SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM c) THEN NULL ELSE jsonb_build_object(
    'code', _code,
    'ux', coalesce((SELECT jsonb_object_agg(ux_key, value) FROM m WHERE rank = 1), '{{}}'::jsonb),
    'matches', coalesce((SELECT jsonb_agg(jsonb_build_object(
                  'ux_key', ux_key, 'value', value, 'specificity', specificity,
                  'primary', primary_code, 'secondary', secondary_code, 'tertiary', tertiary_code,
                  'applied', rank = 1)
                ORDER BY ux_key, rank) FROM m), '[]'::jsonb)
  ) END
$$;
REVOKE EXECUTE ON FUNCTION public.bps_ux(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bps_ux(TEXT) TO anon, authenticated;

-- Admin: how many people share each profile (or each primary / primary.secondary
-- grouping), with groups under 5 people hidden.
CREATE OR REPLACE FUNCTION public.bps_combination_stats(_level SMALLINT DEFAULT 3)
RETURNS TABLE (code TEXT, label TEXT, people BIGINT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT g.code, g.label, g.people FROM (
    SELECT CASE _level WHEN 1 THEN bp.primary_code::text
                       WHEN 2 THEN bp.primary_code || '.' || bp.secondary_code
                       ELSE bp.code END AS code,
           min(CASE _level WHEN 1 THEN p.label
                           WHEN 2 THEN p.label || ' · ' || s.label
                           ELSE c.label END) AS label,
           count(*) AS people
    FROM bps_profiles bp
    JOIN bps_combinations c ON c.code = bp.code
    JOIN bps_values p ON p.level = 1 AND p.code = bp.primary_code
    JOIN bps_values s ON s.level = 2 AND s.code = bp.secondary_code
    GROUP BY 1
  ) g
  WHERE g.people >= 5
  ORDER BY g.people DESC;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.bps_combination_stats(SMALLINT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bps_combination_stats(SMALLINT) TO authenticated;

SELECT 'BPS profiles ready: ' || (SELECT count(*) FROM public.bps_combinations) || ' combinations' AS result;
"""
(ROOT / "supabase/migrations/20261019010000_bps_profiles.sql").write_text(sql, encoding="utf-8")
print("tertiary", len(TERTIARY), "combinations", 10 * 19 * len(TERTIARY), "correlations", len(corr))
