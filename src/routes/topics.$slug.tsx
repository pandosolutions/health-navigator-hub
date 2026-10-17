import { createFileRoute, redirect } from "@tanstack/react-router";

// The old topic pages were removed when Topics became Diseases.
export const Route = createFileRoute("/topics/$slug")({
  beforeLoad: () => {
    throw redirect({ to: "/diseases", statusCode: 301 });
  },
});
