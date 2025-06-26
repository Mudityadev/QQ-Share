"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../components/ui/button";
import React, { useRef, useState, useEffect } from "react";
import { toast } from "@/components/ui/toaster";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<{ id: string; expiresAt: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  // Countdown timer for rate limit
  useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter(prev => {
          if (prev && prev > 0) {
            return prev - 1;
          } else {
            setRateLimited(false);
            setError(null);
            return null;
          }
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryAfter]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // Use XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            setResult(data);
            setUploadProgress(100);
            toast.success("Upload completed! Link copied to clipboard.");
          } catch (err) {
            setError("Invalid response from server");
          }
        } else if (xhr.status === 429) {
          // Rate limit exceeded
          try {
            const errorData = JSON.parse(xhr.responseText);
            setError(errorData.error);
            setRateLimited(true);
            
            // Parse Retry-After header
            const retryAfterHeader = xhr.getResponseHeader('Retry-After');
            if (retryAfterHeader) {
              setRetryAfter(parseInt(retryAfterHeader));
            }
          } catch (err) {
            setError("Rate limit exceeded. Please wait before trying again.");
            setRateLimited(true);
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            setError(errorData.error || "Upload failed");
          } catch (err) {
            setError("Upload failed");
          }
        }
        setUploading(false);
      });
      
      xhr.addEventListener('error', () => {
        setError("Network error occurred");
        setUploading(false);
      });
      
      xhr.addEventListener('abort', () => {
        setError("Upload was cancelled");
        setUploading(false);
      });
      
      xhr.open('POST', '/api/upload');
      xhr.send(formData);
      
    } catch (err: any) {
      setError(err.message || "Upload failed");
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
            className="w-full py-6 text-lg font-semibold rounded-xl shadow-md transition-all duration-150 hover:scale-[1.03] relative overflow-hidden"
            onClick={triggerFileInput}
            disabled={uploading || rateLimited}
          >
            {uploading ? (
              <>
                <div className="absolute inset-0 bg-primary/20"></div>
                <div 
                  className="absolute inset-0 bg-primary/40 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <span className="relative z-10">Uploading... {uploadProgress}%</span>
              </>
            ) : rateLimited ? (
              <>
                <div className="absolute inset-0 bg-destructive/20"></div>
                <span className="relative z-10">
                  Rate Limited
                  {retryAfter && (
                    <span className="block text-sm font-normal">
                      Wait {Math.floor(retryAfter / 60)}:{(retryAfter % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </span>
              </>
            ) : (
              "Upload a file"
            )}
          </Button>
          {error && (
            <div className={`text-sm text-center p-3 rounded-lg ${
              rateLimited 
                ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                : 'text-red-500'
            }`}>
              {error}
              {rateLimited && retryAfter && (
                <div className="mt-2 text-xs opacity-80">
                  You can upload 2 files every 10 minutes. Please wait for the timer to reset.
                </div>
              )}
            </div>
          )}
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
