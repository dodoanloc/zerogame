import type { Metadata } from "next";

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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#05050f" />
      </head>
      <body className="m-0 p-0 overflow-hidden">{children}</body>
    </html>
  );
}
