"use client";

import { useAuth } from "../context/AuthContext";

export default function RootLandingPage() {
  const { loading } = useAuth();

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-100">
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs font-medium text-slate-500 tracking-wider uppercase">
          Verifying session status...
        </span>
      </div>
    </div>
  );
}
