import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ミクポスト - 初音ミク画像生成＆X投稿",
  description: "テキストを入力するだけで、初音ミクの画像を自動生成してX（旧Twitter）にポストできます",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}

