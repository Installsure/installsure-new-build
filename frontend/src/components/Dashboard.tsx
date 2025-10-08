import { useEffect, useState } from "react";
import { getProjects, getStats } from "../services/api";
import type { DashboardStats } from "../types";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
    getProjects().then(setProjects).catch(() => {});
  }, []);

  return (
    <section className="p-4 grid gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Projects", stats?.total_projects ?? 0],
          ["Uploads", stats?.total_uploads ?? 0],
          ["Pages", stats?.pages_processed ?? 0],
          ["Avg Cost", `$${stats?.avg_cost?.toLocaleString() ?? "0"}`],
        ].map(([k, v]) => (
          <div key={k} className="border rounded-xl p-4">
            <div className="text-xs text-gray-500">{k}</div>
            <div className="text-lg font-semibold">{v as any}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-base font-semibold mb-2">Projects</h2>
        <ul className="list-disc pl-6">
          {projects.map((p) => (
            <li key={p.id}>
              {p.name} <span className="text-gray-500 text-xs">({p.id})</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}