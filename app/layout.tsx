import type { Metadata } from "next";
import { Festive, IBM_Plex_Mono, Outfit, Patrick_Hand } from "next/font/google";
import localFont from "next/font/local";
import SiteLoader from "@/components/SiteLoader";
import "./globals.css";

const festive = Festive({
  weight: "400",
  variable: "--font-festive",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const patrickHand = Patrick_Hand({
  weight: "400",
  variable: "--font-hand",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  weight: "400",
  variable: "--font-mono",
  subsets: ["latin"],
});

// Apply a saved light theme before first paint so the loader doesn't flash dark
const themeScript = `try{var t=localStorage.getItem("portfolio-theme-mode");if(t==="light"||(!t&&matchMedia("(prefers-color-scheme: light)").matches))document.documentElement.classList.add("light-mode")}catch(e){}`;

// Somatic Rounded by Lauren Lee.
const somaticRounded = localFont({
  src: "./fonts/Somatic-Rounded.otf",
  weight: "400",
  style: "normal",
  variable: "--font-somatic-rounded",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Abhinand C | Software Engineer",
  description:
    "Abhinand C — Software Engineer building full-stack web applications, cross-platform mobile experiences and API-driven solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${festive.variable} ${outfit.variable} ${patrickHand.variable} ${plexMono.variable} ${somaticRounded.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SiteLoader />
        {children}
      </body>
    </html>
  );
}
