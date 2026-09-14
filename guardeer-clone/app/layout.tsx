import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GUARDEER PRIME",
  description: "Professional Order Flow Trading Terminal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden bg-[#0B0E11] text-[#EAECEF] antialiased">
        {children}
      </body>
    </html>
  );
}