"use client";
import Image from "next/image";
import { Button } from "../components/ui/button";
import React, { useRef, useState } from "react";
import { toast } from "@/components/ui/toaster";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ id: string; expiresAt: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error((await res.json()).error || "Upload failed");
      }
      const data = await res.json();
      setResult(data);
      toast.success("Upload completed! Link copied to clipboard.");
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function triggerFileInput() {
    fileInputRef.current?.click();
  }

  async function handleCopy(link: string) {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
      <header className="flex flex-col items-center gap-4 mt-12 mb-8">
        <Image
          src="/file.svg"
          alt="QQShare logo"
          width={48}
          height={48}
          className="dark:invert"
        />
        <h1 className="text-4xl font-bold tracking-tight text-center">QQShare</h1>
        <p className="text-lg text-muted-foreground text-center max-w-xl">
          Secure, one-time file sharing. Upload a file (≤ 100 MB), get a private link, and share it for a single download within 60 minutes. 100% client-side AES-256 encryption.
        </p>
      </header>
      <main className="flex flex-col items-center gap-8 w-full max-w-md">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <Button size="lg" className="w-full max-w-xs" onClick={triggerFileInput} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload a file"}
        </Button>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {result && (
          <div className="text-green-600 text-sm break-all text-center flex flex-col items-center gap-2">
            File uploaded!<br />
            <div className="flex items-center gap-2">
              <a
                href={`/download/${result.id}`}
                className="underline text-blue-600 dark:text-blue-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download link
              </a>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(`${window.location.origin}/download/${result.id}`)}
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <span className="font-mono">{`${window.location.origin}/download/${result.id}`}</span>
            <span className="text-xs text-muted-foreground">Expires: {new Date(result.expiresAt).toLocaleString()}</span>
          </div>
        )}
        <ul className="text-sm text-muted-foreground space-y-2 text-left">
          <li>• One-time download (file deleted after first access)</li>
          <li>• 60-minute expiry</li>
          <li>• Optional password protection</li>
          <li>• No unencrypted data ever leaves your browser</li>
          <li>• Modern, dark JetBrains/Apple-style UI</li>
        </ul>
      </main>
      <footer className="mt-auto py-8 text-xs text-muted-foreground text-center opacity-70">
        &copy; {new Date().getFullYear()} QQShare. Secure file sharing, open source.
      </footer>
    </div>
  );
}
