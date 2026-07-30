import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "update_my_profile",
  title: "Update my profile",
  description:
    "Update the signed-in user's username and/or phone number. Omitted fields are left unchanged.",
  inputSchema: {
    username: z.string().trim().min(2).max(40).nullish().describe("New username."),
    phone: z.string().trim().max(40).nullish().describe("New phone number."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ username, phone }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const patch: { username?: string; phone?: string } = {};
    if (typeof username === "string") patch.username = username;
    if (typeof phone === "string") patch.phone = phone;
    if (Object.keys(patch).length === 0)
      return errorResult("Provide at least one of: username, phone.");

    const { data, error } = await supabaseForUser(ctx)
      .from("profiles")
      .update(patch)
      .eq("id", ctx.getUserId()!)
      .select("id, username, email, phone")
      .maybeSingle();
    if (error) return errorResult(error.message);
    return jsonResult(data);
  },
});
