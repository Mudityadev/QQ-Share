import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return {
    title: `Download File | QQShare`,
    description: `Download your secure, one-time file from QQShare. File ID: ${params.id}`,
  };
} 