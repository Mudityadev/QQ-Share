"use client";
import { Toaster as SonnerToaster, toast } from "sonner";

export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  return <SonnerToaster {...props} />;
}

export { toast }; 