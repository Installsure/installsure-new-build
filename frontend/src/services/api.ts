const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function getHealth() {
  return json<import("../types").HealthPayload>(await fetch(`${API_URL}/api/health`));
}

export async function getStats() {
  return json<import("../types").DashboardStats>(await fetch(`${API_URL}/api/dashboard/stats`));
}

export async function getProjects() {
  return json<any[]>(await fetch(`${API_URL}/api/projects`));
}

export async function uploadPdf(file: File, onProgress?: (p: number) => void) {
  const form = new FormData();
  form.append("file", file);
  const controller = new AbortController();

  // Why: Browser fetch lacks true progress; fallback to XHR to show UX feedback.
  return await new Promise<{ status: string; estimation: import("../types").Estimation; meta: any }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
        }
      } catch (err) {
        reject(err);
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(form);
  });
}