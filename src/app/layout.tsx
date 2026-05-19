import { Outfit } from "next/font/google";
import { PostHogProvider } from "@/providers/PostHogProvider";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-geom-sans",
});

export const metadata = {
  title: "ChillToRent | PropTech Platform",
  description: "Transparent, direct property discovery across Nigeria.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="antialiased">
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}