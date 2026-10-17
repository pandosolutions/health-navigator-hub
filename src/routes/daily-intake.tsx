import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/daily-intake")({
  component: () => <Outlet />,
});
