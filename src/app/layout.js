import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import PwaRegister from "@/components/pwa/PwaRegister";
import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";
import PullToRefresh from "@/components/pwa/PullToRefresh";
import GlobalToaster from "@/components/common/GlobalToaster";

export const viewport = {
  themeColor: "#F0FDFA",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata = {
  title: "Portal Etos ID",
  description: "Portal Pembinaan & Asesmen Kepemimpinan Etos ID",
  applicationName: "Etos Portal",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Etos Portal",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GlobalToaster />
        <PullToRefresh />
        <PwaRegister />
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
