import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rand Jukebox | Vanderbilt Music Queue",
  description: "A community-driven music queue for Rand Dining Hall at Vanderbilt University. Request songs and shape the soundtrack of your dining experience.",
  keywords: ["Vanderbilt", "Rand", "Music", "Jukebox", "Queue", "Community"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <div className="noise-overlay" />
        {children}
      </body>
    </html>
  );
}

