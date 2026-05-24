import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Dashboard } from "../components/jagakl/Dashboard";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  return (
    <Dashboard
      onSelectSession={(phone) =>
        navigate({ to: "/session/$phone", params: { phone } })
      }
    />
  );
}
