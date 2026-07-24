import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/hub")({
  // Ensure /hub matches - handled by hub.index.tsx as leaf
  // We need a layout parent so /hub, /hub/health, /hub/saved, /hub/admin nest properly
  beforeLoad: () => {
    // no-op parent
  },
});
