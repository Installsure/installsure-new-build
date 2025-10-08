import { useState } from "react";
import { uploadPdf } from "../services/api";
import type { Estimation } from "../types";

export default function FileUpload({ onDone }: { onDone: (e: Estimation) => void }) {
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>("");

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported right now.");
      return;
    }
    try {
      const res = await uploadPdf(file, setProgress);
      onDone(res.estimation);
    } catch (err: any) {
      setError(err?.message ?? "Upload failed");
    } finally {
      setProgress(0);
    }
  }

  return (
    <section className="p-4">
      <h2 className="text-base font-semibold mb-2">Upload BIM File (PDF only)</h2>
      <label className="inline-block cursor-pointer border rounded-xl px-4 py-2">
        Select File
        <input type="file" accept="application/pdf,.pdf" onChange={onSelect} className="hidden" />
      </label>
      {progress > 0 && <div className="text-sm mt-2">Uploading… {progress}%</div>}
      {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
    </section>
  );
}