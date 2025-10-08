import { useEffect, useState } from "react";
import { getHealth } from "../services/api";

export default function Header() {
  const [ok, setOk] = useState<boolean>(false);
  const [version, setVersion] = useState<string>("—");

  useEffect(() => {
    let mounted = true;
    getHealth()
      .then((h) => {
        if (!mounted) return;
        setOk(h.status === "healthy");
        setVersion(h.version);
      })
      .catch(() => setOk(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="w-full flex items-center justify-between p-4 border-b">
      <h1 className="text-xl font-semibold">InstallSure</h1>
      <div className="flex items-center gap-3">
        <span className={`h-2 w-2 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />
        <span className="text-sm">API: {ok ? "Connected" : "Disconnected"} · v{version}</span>
      </div>
    </header>
  );
}