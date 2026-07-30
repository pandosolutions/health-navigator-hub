import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, jsonResult, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "save_reading",
  title: "Save a reading",
  description: "Bookmark a topic for the signed-in user by its slug.",
  inputSchema: {
    topic_slug: z.string().trim().min(1).describe("Topic slug, e.g. 'superfoods'."),
    topic_title: z.string().trim().nullish().describe("Display title for the topic."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ topic_slug, topic_title }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("saved_readings")
      .insert({
        user_id: ctx.getUserId()!,
        topic_slug,
        topic_title: topic_title ?? topic_slug,
      })
      .select("id, topic_slug, topic_title, created_at")
      .maybeSingle();
    if (error) return errorResult(error.message);
    return jsonResult(data);
  },
});
