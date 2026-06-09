import {
  DM_Sans,
  Geist,
  Geist_Mono,
  Inter,
  Nunito,
  Open_Sans,
  Poppins,
  Roboto,
} from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import PlatformScripts from "@/components/PlatformScripts";
import PlatformThemeStyles from "@/components/PlatformThemeStyles";
import AdminThemeBootstrap from "@/components/AdminThemeBootstrap";

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

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#10b981",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${inter.variable} ${nunito.variable} ${dmSans.variable} ${roboto.variable} ${openSans.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <AdminThemeBootstrap />
      </head>
      <body className="min-h-full" suppressHydrationWarning>
        <PlatformThemeStyles />
        <PlatformScripts />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
