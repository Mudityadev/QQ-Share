import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QQShare | Secure One-Time File Sharing",
  description: "Upload and share files securely, one-time only, with client-side encryption. Files expire after 60 minutes or first download.",
  icons: {
    icon: "/logo-transparent.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo-transparent.png" type="image/png" />
        <title>QQShare | Secure One-Time File Sharing</title>
        <meta name="description" content="Upload and share files securely, one-time only, with client-side encryption. Files expire after 60 minutes or first download." />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
