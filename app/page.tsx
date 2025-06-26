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
  const [timerDisplay, setTimerDisplay] = useState<string>("");
  const [initialRetryAfter, setInitialRetryAfter] = useState<number | null>(null);

  // Countdown timer for rate limit
  useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      const updateTimer = () => {
        const min = Math.floor(retryAfter / 60);
        const sec = retryAfter % 60;
        setTimerDisplay(`${min}:${sec.toString().padStart(2, "0")}`);
      };
      updateTimer();
      const timer = setInterval(() => {
        setRetryAfter(prev => {
          if (prev && prev > 0) {
            const next = prev - 1;
            const min = Math.floor(next / 60);
            const sec = next % 60;
            setTimerDisplay(`${min}:${sec.toString().padStart(2, "0")}`);
            return next;
          } else {
            setRateLimited(false);
            setError(null);
            setShowProUpgrade(false);
            setTimerDisplay("");
            return null;
          }
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setTimerDisplay("");
    }
  }, [retryAfter]);

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
              setInitialRetryAfter(parseInt(retryAfterHeader));
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
    // In a real app, this would redirect to a payment page
    toast.info("Pro upgrade coming soon! This would redirect to payment.");
    setShowProUpgrade(false);
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
          <div className="bg-muted rounded-xl p-4 shadow border border-border w-full max-w-md">
            <p className="text-base sm:text-lg text-muted-foreground text-center leading-snug">
              Secure, one-time file sharing.<br />
              Upload (≤10&nbsp;MB), get a private link <br /> share for one download.<br />
              100% client-side AES-256 encryption.
            </p>
          </div>
        </div>
        
        {showProUpgrade ? (
          <ProUpgrade 
            variant={upgradeVariant}
            remainingTime={retryAfter || undefined}
            onUpgrade={handleUpgrade}
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
                ) : rateLimited ? (
                  <div className="text-sm text-center p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                    {error}
                  </div>
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
            {rateLimited && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircleIcon className="w-5 h-5 mt-0.5" />
                <div className="w-full">
                  <AlertTitle>Rate Limited</AlertTitle>
                  <AlertDescription className="flex flex-col gap-2">
                    <span>Please wait for the timer to reset.</span>
                    {timerDisplay && (
                      <Badge variant="outline" className="align-middle w-fit">
                        {timerDisplay}
                      </Badge>
                    )}
                    {initialRetryAfter && retryAfter !== null && (
                      <Progress value={100 - (retryAfter / initialRetryAfter) * 100} className="w-full mt-2" />
                    )}
                  </AlertDescription>
                </div>
              </Alert>
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
