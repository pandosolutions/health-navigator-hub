import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, jsonResult, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "get_my_health_data",
  title: "Get my health data",
  description:
    "Return the signed-in user's health record: age, gender, body fat percentage, skeletal muscle mass and lab values. Read-only — only an admin can change health data.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("health_data")
      .select("age, gender, body_fat_percent, smm_kg, lab_values, updated_at")
      .eq("user_id", ctx.getUserId()!)
      .maybeSingle();
    if (error) return errorResult(error.message);
    if (!data) return jsonResult({ message: "No health data on file yet." });
    return jsonResult(data);
  },
});
