"use client";

import { useAuth } from "../../context/AuthContext";
import DashboardTab from "../../components/dashboard/DashboardTab";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  return <DashboardTab user={user} />;
}
