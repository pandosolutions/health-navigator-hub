import { auth, defineMcp } from "@lovable.dev/mcp-js";

import getMyProfile from "./tools/get-my-profile";
import updateMyProfile from "./tools/update-my-profile";
import getMyHealthData from "./tools/get-my-health-data";
import searchNutritionIndex from "./tools/search-nutrition-index";
import listSavedReadings from "./tools/list-saved-readings";
import saveReading from "./tools/save-reading";

// OAuth issuer must be the direct Supabase host; the project ref is inlined at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "health-navigator-hub",
  title: "Health Navigator Hub",
  version: "0.1.0",
  instructions:
    "Tools for Health Navigator Hub, a personalized nutrition app. Read the signed-in user's profile, health record and saved readings, update their profile, bookmark topics, and search the nutrition index. Health data is read-only for users; only admins may edit it in the app.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getMyProfile,
    updateMyProfile,
    getMyHealthData,
    searchNutritionIndex,
    listSavedReadings,
    saveReading,
  ],
});
