"use client";

import { useAuth } from "../../../context/AuthContext";
import StaffTab from "../../../components/dashboard/StaffTab";

export default function StaffPage() {
  const { user } = useAuth();
  return <StaffTab user={user} />;
}
