"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DownloadPage() {
  const { id } = useParams<{ id: string }>();
  const [fileInfo, setFileInfo] = useState<{ originalName: string; expiresAt: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchMeta() {
      try {
        const res = await fetch(`/api/download/${id}`, { method: "HEAD" });
        if (!res.ok) throw new Error("File not found or expired");
        const name = res.headers.get("x-original-filename") || "file";
        const expires = res.headers.get("x-expires-at");
        setFileInfo({ originalName: name, expiresAt: expires ? Number(expires) : 0 });
      } catch (err: any) {
        setError(err.message || "File not found or expired");
      }
    }
    fetchMeta();
  }, [id]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/download/${id}`);
      if (!res.ok) throw new Error("File not found or expired");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileInfo?.originalName || "file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  if (error) return <div className="flex flex-col items-center justify-center min-h-screen text-red-500">{error}</div>;
  if (!fileInfo) return <div className="flex flex-col items-center justify-center min-h-screen">Loading…</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-2xl font-bold">Download File</h1>
      <div className="text-lg">{fileInfo.originalName}</div>
      <div className="text-sm text-muted-foreground">Expires: {new Date(fileInfo.expiresAt).toLocaleString()}</div>
      <Button size="lg" onClick={handleDownload} disabled={downloading}>
        {downloading ? "Downloading…" : "Download"}
      </Button>
    </div>
  );
} 