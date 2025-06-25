import Image from "next/image";
import { Button } from "../components/ui/button";

export default function Home() {
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
        <Button size="lg" className="w-full max-w-xs">
          Upload a file
        </Button>
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
