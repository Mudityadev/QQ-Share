"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import Image from "next/image";

export default function DownloadPage() {
  const { id } = useParams<{ id: string }>();
  const [fileInfo, setFileInfo] = useState<{ originalName: string; expiresAt: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    async function fetchMeta() {
      try {
        const res = await fetch(`/api/download/${id}`, { method: "HEAD" });
        if (!res.ok) throw new Error("File not found or expired");
        const name = res.headers.get("x-original-filename") || "file";
        const expires = res.headers.get("x-expires-at");
        setFileInfo({ originalName: name, expiresAt: expires ? Number(expires) : 0 });
      } catch (err: any) {
        setError("Sorry, this file is no longer available. It may have expired or was already downloaded.");
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
      setDownloaded(true);
      toast.success("Download started!");
    } catch (err: any) {
      setError("Sorry, this file is no longer available. It may have expired or was already downloaded.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/60 px-4">
      <div className="w-full max-w-lg bg-card/80 shadow-xl rounded-2xl p-8 flex flex-col items-center gap-8 border border-border backdrop-blur-md animate-fade-in">
        <div className="flex flex-col items-center gap-2">
          <Link href="/" className="transition-transform hover:scale-105">
            <Image src="/logo-transparent.png" alt="QQShare logo" width={100} height={100} className="dark:invert drop-shadow-lg" />
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-center mb-1">Download File</h1>
        </div>
        {error ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-destructive text-lg font-semibold">{error}</span>
            <span className="text-muted-foreground text-sm">If you believe this is a mistake, please ask the sender to re-upload the file.</span>
          </div>
        ) : !fileInfo ? (
          <div className="flex flex-col items-center justify-center min-h-[120px]">Loading…</div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="text-lg font-medium text-center break-all">{fileInfo.originalName}</div>
            <div className="text-sm text-muted-foreground">Expires: {new Date(fileInfo.expiresAt).toLocaleString()}</div>
            {!downloaded ? (
              <Button size="lg" className="w-full max-w-xs py-4 text-lg font-semibold rounded-xl shadow-md transition-all duration-150 hover:scale-[1.03]" onClick={handleDownload} disabled={downloading}>
                {downloading ? "Downloading…" : "Download"}
              </Button>
            ) : (
              <div className="text-green-700 dark:text-green-400 font-semibold text-center">Download started! This file is now deleted from the server.</div>
            )}
          </div>
        )}
        <footer className="w-full pt-4 text-xs text-muted-foreground text-center opacity-70">
          &copy; {new Date().getFullYear()} QQShare. Secure file sharing, open source.
        </footer>
      </div>
    </div>
  );
} 