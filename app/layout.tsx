import type { Metadata } from "next";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "URCSTIT Blog App",
    template: "%s | URCSTIT Blog",
  },
  description: "Official announcements and updates for the URCSTIT class.",
  keywords: ["URCSTIT", "Class Blog", "Announcements", "Updates"],
  authors: [{ name: "Class Reps" }],
  creator: "URCSTIT Dev Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "http://localhost:3000",
    title: "URCSTIT Blog App",
    description: "Stay updated with the latest class announcements.",
    siteName: "URCSTIT Blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "URCSTIT Blog App",
    description: "Stay updated with the latest class announcements.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </ThemeRegistry>
      </body>
    </html>
  );
}
