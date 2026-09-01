import type { Metadata } from "next";
import "./globals.css";
import "./ledger.css";

export const metadata: Metadata = {
  title: "دفتر المحطة | حركة الوقود",
  description: "دفتر عربي يومي وشهري لإدارة حركة السولار وبنزين 92.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
