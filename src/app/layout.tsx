import type { Metadata } from "next";
import localFont from "next/font/local";

import './globals.css';

import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { Toaster } from "@/components/ui/sonner";
import { Modals } from "@/components/modal";
import { JotaiProvider } from "@/components/ui/jotai-provider";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body>
          <ConvexClientProvider>
            <JotaiProvider>
              <Toaster />
              <Modals />
              {children}

            </JotaiProvider>

          </ConvexClientProvider>

        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 1000",
});

export const metadata: Metadata = {
  title: "WORKWAVE",
  description: "made by beimnet",
};

