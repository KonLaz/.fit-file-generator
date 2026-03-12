import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wahoo Workout Builder",
  description: "Phase 1 workout editor for structured cycling workouts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
