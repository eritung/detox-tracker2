import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "清新計畫｜21 天健康打卡";
  const description = "為 KOL 打造的 21 天課程體驗與每日健康紀錄工具。";
  const image = new URL("/og.png", origin).toString();
  return {
    title, description,
    openGraph: { title, description, type: "website", images: [{ url: image, width: 1731, height: 909, alt: "清新計畫 21 天健康打卡" }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
