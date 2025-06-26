"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { ProUpgrade } from "../components/ui/pro-upgrade";
import React, { useRef, useState, useEffect } from "react";
import { toast } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<{ id: string; expiresAt: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [showProUpgrade, setShowProUpgrade] = useState(false);
  const [upgradeVariant, setUpgradeVariant] = useState<"rate-limit" | "file-size" | "general">("general");

  // Restore rate limit state from localStorage on mount
  useEffect(() => {
    const storedRetryAfter = localStorage.getItem("qqshare_retryAfter");
    const storedRateLimited = localStorage.getItem("qqshare_rateLimited");
    const storedShowProUpgrade = localStorage.getItem("qqshare_showProUpgrade");
    const storedUpgradeVariant = localStorage.getItem("qqshare_upgradeVariant");
    const storedTimestamp = localStorage.getItem("qqshare_rateLimitTimestamp");

    if (storedRetryAfter && storedRateLimited && storedShowProUpgrade && storedTimestamp) {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = parseInt(storedTimestamp) + parseInt(storedRetryAfter);
      if (now < expiresAt) {
        setRetryAfter(expiresAt - now);
        setRateLimited(storedRateLimited === "true");
        setShowProUpgrade(storedShowProUpgrade === "true");
        setUpgradeVariant((storedUpgradeVariant as any) || "rate-limit");
      } else {
        // Expired, clear
        localStorage.removeItem("qqshare_retryAfter");
        localStorage.removeItem("qqshare_rateLimited");
        localStorage.removeItem("qqshare_showProUpgrade");
        localStorage.removeItem("qqshare_upgradeVariant");
        localStorage.removeItem("qqshare_rateLimitTimestamp");
      }
    }
  }, []);

  // Persist rate limit state to localStorage when set
  useEffect(() => {
    if (rateLimited && retryAfter && showProUpgrade) {
      localStorage.setItem("qqshare_retryAfter", retryAfter.toString());
      localStorage.setItem("qqshare_rateLimited", "true");
      localStorage.setItem("qqshare_showProUpgrade", "true");
      localStorage.setItem("qqshare_upgradeVariant", upgradeVariant);
      localStorage.setItem("qqshare_rateLimitTimestamp", Math.floor(Date.now() / 1000).toString());
    }
  }, [rateLimited, retryAfter, showProUpgrade, upgradeVariant]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setResult(null);
    setShowProUpgrade(false);
    
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
            setError(errorData.message || errorData.error);
            setRateLimited(true);
            setUpgradeVariant("rate-limit");
            setShowProUpgrade(true);
            
            // Parse Retry-After header
            const retryAfterHeader = xhr.getResponseHeader('Retry-After');
            if (retryAfterHeader) {
              setRetryAfter(parseInt(retryAfterHeader));
            }
          } catch (err) {
            setError("Rate limit exceeded. Please wait before trying again.");
            setRateLimited(true);
            setUpgradeVariant("rate-limit");
            setShowProUpgrade(true);
          }
        } else if (xhr.status === 413) {
          // File too large
          try {
            const errorData = JSON.parse(xhr.responseText);
            setError(errorData.message || errorData.error);
            setUpgradeVariant("file-size");
            setShowProUpgrade(true);
          } catch (err) {
            setError("File too large. Max 10MB allowed for free tier.");
            setUpgradeVariant("file-size");
            setShowProUpgrade(true);
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

  function handleUpgrade() {
    toast.info("Pro upgrade coming soon! This would redirect to payment.");
  }

  function handleProTimerEnd() {
    setShowProUpgrade(false);
    setRateLimited(false);
    setRetryAfter(null);
    setError(null);
    // Clear localStorage
    localStorage.removeItem("qqshare_retryAfter");
    localStorage.removeItem("qqshare_rateLimited");
    localStorage.removeItem("qqshare_showProUpgrade");
    localStorage.removeItem("qqshare_upgradeVariant");
    localStorage.removeItem("qqshare_rateLimitTimestamp");
  }

  const downloadUrl = result ? `${window.location.origin}/download/${result.id}` : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg bg-card shadow-xl rounded-2xl p-10 flex flex-col items-center gap-10 border border-border">
        <div className="flex flex-col items-center gap-2 animate-fade-in">
          <Link href="/" className="transition-transform hover:scale-105">
            <Image
              src="/logo-transparent.png"
              alt="QQShare logo"
              width={120}
              height={120}
              className="drop-shadow-lg"
              priority
            />
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-center mb-1 text-foreground">QQShare</h1>
          <div className="w-full max-w-md mx-auto bg-card border border-border rounded-xl p-6 shadow-2xl flex flex-col items-center mb-2">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full mb-3 shadow-lg">
              {/* Use a lock icon from lucide-react */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-7V7a6 6 0 10-12 0v3a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2zm-8-3a4 4 0 118 0v3H6V7z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Secure, one-time file sharing.</h2>
            <ul className="text-base sm:text-lg text-muted-foreground text-center leading-snug space-y-1">
              <li>Upload (≤10&nbsp;MB), get a private link</li>
              <li>Share for one download.</li>
              <li>100% client-side AES-256 encryption.</li>
            </ul>
          </div>
        </div>
        
        {showProUpgrade ? (
          <ProUpgrade 
            variant={upgradeVariant}
            remainingTime={retryAfter || undefined}
            onUpgrade={handleUpgrade}
            onTimerEnd={handleProTimerEnd}
          />
        ) : (
          <div className="w-full flex flex-col gap-6">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {!rateLimited && (
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
                    <span className="relative z-10 flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      Uploading... {uploadProgress}%
                    </span>
                  </>
                ) : (
                  "Upload a file"
                )}
              </Button>
            )}
            {error && !showProUpgrade && (
              <div className={`text-sm text-center p-3 rounded-lg ${
                rateLimited 
                  ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                  : 'text-destructive bg-muted border border-destructive/20'
              }`}>
                {error}
              </div>
            )}
            {result && (
              <div className="flex flex-col items-center gap-3 bg-muted border border-border rounded-xl p-4 shadow-inner animate-fade-in">
                <div className="text-green-600 font-semibold">File uploaded!</div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                  <span className="font-mono text-xs bg-background px-2 py-1 rounded select-all break-all w-full text-center border border-border text-foreground">
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
            {uploading && (
              <div className="flex flex-col items-center gap-3 bg-muted border border-border rounded-xl p-4 shadow-inner animate-fade-in w-full">
                <Skeleton className="h-5 w-1/2 mb-2" />
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                  <Skeleton className="h-8 w-full rounded" />
                  <Skeleton className="h-8 w-20 rounded" />
                </div>
                <Skeleton className="h-4 w-1/3 mt-2" />
              </div>
            )}
          </div>
        )}
        
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
