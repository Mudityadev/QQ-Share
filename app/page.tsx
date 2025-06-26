"use client";
import Image from "next/image";
import Link from "next/link";
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
    toast.success("Link copied to clipboard!");
  }

  const downloadUrl = result ? `${window.location.origin}/download/${result.id}` : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/60 px-4">
      <div className="w-full max-w-lg bg-card/80 shadow-xl rounded-2xl p-8 flex flex-col items-center gap-8 border border-border backdrop-blur-md">
        <div className="flex flex-col items-center gap-2 animate-fade-in">
          <Link href="/" className="transition-transform hover:scale-105">
            <Image
              src="/logo-transparent.png"
              alt="QQShare logo"
              width={120}
              height={120}
              className="dark:invert drop-shadow-lg"
              priority
            />
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-center mb-1">QQShare</h1>
          <div className="bg-muted/40 rounded-xl p-4 shadow-sm border border-border w-full max-w-md">
            <p className="text-base sm:text-lg text-muted-foreground text-center leading-snug">
              Secure, one-time file sharing.<br />
              Upload (≤100&nbsp;MB), get a private link <br /> share for one download.<br />
              100% client-side AES-256 encryption.
            </p>
          </div>
        </div>
        <div className="w-full flex flex-col gap-6">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <Button
            size="lg"
            className="w-full py-6 text-lg font-semibold rounded-xl shadow-md transition-all duration-150 hover:scale-[1.03]"
            onClick={triggerFileInput}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload a file"}
          </Button>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          {result && (
            <div className="flex flex-col items-center gap-3 bg-muted/60 border border-border rounded-xl p-4 shadow-inner animate-fade-in">
              <div className="text-green-700 dark:text-green-400 font-semibold">File uploaded!</div>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                <span className="font-mono text-xs bg-background/80 px-2 py-1 rounded select-all break-all w-full text-center border border-border">
                  {downloadUrl}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => handleCopy(downloadUrl)}
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Expires: {new Date(result.expiresAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>
        <div className="w-full border-t border-border pt-6 mt-2 flex flex-col items-center gap-3">
          <div className="text-sm text-muted-foreground text-center w-full max-w-xs mx-auto">
            One-time download. 60-minute expiry. 100% private.
          </div>
        </div>
        <footer className="w-full pt-4 text-xs text-muted-foreground text-center opacity-70">
          &copy; {new Date().getFullYear()} QQShare. Secure file sharing, open source.
        </footer>
      </div>
    </div>
  );
}
