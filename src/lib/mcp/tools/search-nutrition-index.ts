import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "search_nutrition_index",
  title: "Search the nutrition index",
  description:
    "Search the site's nutrition index for foods by name or category, returning macros, key nutrients and notes.",
  inputSchema: {
    query: z.string().trim().nullish().describe("Text to match against name or category."),
    limit: z.number().int().nullish().describe("Maximum rows to return (default 25, max 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const take = Math.min(Math.max(limit ?? 25, 1), 100);
    let request = supabaseForUser(ctx)
      .from("nutrition_index")
      .select(
        "id, name, category, description, calories, protein_g, carbs_g, fat_g, key_nutrients, notes",
      )
      .order("sort_order", { ascending: true })
      .limit(take);

    if (query) {
      const escaped = query.replace(/[%,()]/g, " ").trim();
      if (escaped) request = request.or(`name.ilike.%${escaped}%,category.ilike.%${escaped}%`);
    }

    const { data, error } = await request;
    if (error) return errorResult(error.message);
    return jsonResult(data ?? []);
  },
});
