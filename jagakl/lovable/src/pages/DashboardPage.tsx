import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dashboard } from "../components/Dashboard";

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <Dashboard
      onSelectSession={(phone) =>
        navigate(`/session/${encodeURIComponent(phone)}`)
      }
    />
  );
}
