import { createFileRoute, redirect } from "@tanstack/react-router";

// Old Ingredient Index URL; kept so existing links still work.
export const Route = createFileRoute("/programs")({
  beforeLoad: () => {
    throw redirect({ to: "/nutrition/ingredient-index" });
  },
});
