// src/app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "@/providers/QueryProvider";
import { auth } from "../../auth";
import { Inter, Crimson_Pro } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson-pro",
  display: "swap",
});

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${crimsonPro.variable} min-h-screen bg-gray-50 text-gray-900`}
        style={{
          fontFamily: "var(--font-inter), sans-serif",
        }}
      >
        <SessionProvider session={session}>
          <QueryProvider>
            {children}
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
