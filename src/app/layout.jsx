import { Geist, Geist_Mono, Poppins, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import PlatformScripts from "@/components/PlatformScripts";
import PlatformThemeStyles from "@/components/PlatformThemeStyles";
import RestaurantThemeBootstrap from "@/components/RestaurantThemeBootstrap";
import SuperAdminThemeBootstrap from "@/components/SuperAdminThemeBootstrap";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata = {
  title: "RMS · Restaurant Management",
  description: "Premium India-focused Restaurant POS & Food Ordering System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RMS",
  },
};

// Next.js 16: themeColor viewport export mein hona chahiye
export const viewport = {
  themeColor: "#10b981",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full" suppressHydrationWarning>
        <RestaurantThemeBootstrap />
        <SuperAdminThemeBootstrap />
        <PlatformThemeStyles />
        <PlatformScripts />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
