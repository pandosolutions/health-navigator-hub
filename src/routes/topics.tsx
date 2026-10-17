import { createFileRoute, redirect } from "@tanstack/react-router";

// Topics became Diseases; keep old links working.
export const Route = createFileRoute("/topics")({
  beforeLoad: () => {
    throw redirect({ to: "/diseases", statusCode: 301 });
  },
});
