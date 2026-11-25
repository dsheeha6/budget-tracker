import type { Metadata, Viewport } from "next";
import { Caveat, DM_Sans, Shantell_Sans, Shrikhand } from "next/font/google";
import { cookies } from "next/headers";
import ServiceWorker from "@/components/ServiceWorker";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import "./globals.css";

// Numbers and body text: clean and easy to scan.
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
// Headings and buttons: marker pen.
const shantell = Shantell_Sans({ variable: "--font-shantell", subsets: ["latin"], weight: ["500", "600", "700"] });
// Penny's notes.
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: ["700"] });
// Wordmark only.
const shrikhand = Shrikhand({ variable: "--font-shrikhand", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Penny: Budget Notebook",
  description: "A money notebook that doesn’t judge you",
  applicationName: "Penny",
  // iPhone "Add to Home Screen": full screen, no Safari bars, content under
  // the status bar (pages pad themselves with the safe-area insets).
  appleWebApp: {
    capable: true,
    title: "Penny",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

// Paper color in each theme, for the browser's bars.
const LIGHT_BAR = "#f3ecdd";
const DARK_BAR = "#1b1916";

// The bars follow the Light or Dark choice when there is one, so they don't
// end up in the phone's color around a page in the other one.
export async function generateViewport(): Promise<Viewport> {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor:
      theme === "system"
        ? [
            { media: "(prefers-color-scheme: light)", color: LIGHT_BAR },
            { media: "(prefers-color-scheme: dark)", color: DARK_BAR },
          ]
        : theme === "dark"
          ? DARK_BAR
          : LIGHT_BAR,
  };
}

// Runs before first paint: picks light or dark from the saved choice, or from
// the phone's setting (and keeps following it) when the choice is "system".
//
// When an app goes to the background (say, to Mail for the sign-in code),
// iOS redraws it in both light and dark for the app switcher, which fires
// "color scheme changed" twice. Those changes are ignored while the app is
// hidden, and the setting is read again once it's back on screen, so the
// page doesn't flip back and forth.
const themeScript = `(function(){try{var d=document,h=d.documentElement,m=d.cookie.match(/(?:^|; )${THEME_COOKIE}=(light|dark|system)/),p=m?m[1]:"system",q=matchMedia("(prefers-color-scheme: dark)"),set=function(){var t=p==="dark"||(p==="system"&&q.matches)?"dark":"light";if(h.dataset.theme!==t)h.dataset.theme=t};set();if(p==="system"){q.addEventListener("change",function(){if(d.visibilityState==="visible")set()});d.addEventListener("visibilitychange",function(){if(d.visibilityState==="visible")set()})}}catch(e){}})()`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html
      lang="en"
      // A fixed choice renders on the server; "system" is settled by the script.
      data-theme={theme === "system" ? undefined : theme}
      suppressHydrationWarning
      className={`${dmSans.variable} ${shantell.variable} ${caveat.variable} ${shrikhand.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full font-sans">
        {/* The slight wobble that makes outlines look hand-inked (.ink in globals.css). */}
        <svg width="0" height="0" className="absolute" aria-hidden>
          <filter id="ink-wobble" x="-4%" y="-8%" width="108%" height="116%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="3.5" />
          </filter>
        </svg>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
