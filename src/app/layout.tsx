import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#05050f",
};

export const metadata: Metadata = {
  title: "Zero Gravity - Space Arcade Game",
  description: "Một game arcade vũ trụ với thao tác vuốt trượt đơn giản. Né tránh thiên thạch và thu thập điểm!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="m-0 p-0 overflow-hidden">{children}</body>
    </html>
  );
}
