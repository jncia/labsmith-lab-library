import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { IS_PRODUCTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LabPack: Junos practice labs on a real router",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Free hands-on Junos labs for JNCIA-Junos. Each lab runs a real Juniper vJunos router on your own computer in LabPack and checks your work stage by stage.",
  openGraph: { siteName: SITE_NAME, type: "website" },
  robots: IS_PRODUCTION ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#202124" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="absolute -top-20 left-4 z-20 rounded bg-card px-3 py-2 text-sm focus:top-2"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
