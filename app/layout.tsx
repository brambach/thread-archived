import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/pwa/sw-register";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thread",
  description: "Your life is a thread you're weaving. This app ties it together.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Thread",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* iOS splash screens — inline SVG data URIs matching app background */}
        <link rel="apple-touch-startup-image" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1290' height='2796'%3E%3Crect fill='%230A0A0A' width='1290' height='2796'/%3E%3C/svg%3E" />
        <link rel="apple-touch-startup-image" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1179' height='2556'%3E%3Crect fill='%230A0A0A' width='1179' height='2556'/%3E%3C/svg%3E" />
        <link rel="apple-touch-startup-image" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1170' height='2532'%3E%3Crect fill='%230A0A0A' width='1170' height='2532'/%3E%3C/svg%3E" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='750' height='1334'%3E%3Crect fill='%230A0A0A' width='750' height='1334'/%3E%3C/svg%3E" />
        <link rel="apple-touch-startup-image" media="(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1320' height='2868'%3E%3Crect fill='%230A0A0A' width='1320' height='2868'/%3E%3C/svg%3E" />
        <link rel="apple-touch-startup-image" media="(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3)" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1206' height='2622'%3E%3Crect fill='%230A0A0A' width='1206' height='2622'/%3E%3C/svg%3E" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
