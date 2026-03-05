import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#4FC3F7",
};

export const metadata: Metadata = {
  title: "Flappy Bird - Game vui nhộn",
  description: "Game Flappy Bird phiên bản web. Chạm để bay, vượt qua các ống và ghi điểm cao!",
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
