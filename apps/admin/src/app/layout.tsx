import type { Metadata } from 'next';
import { M_PLUS_Rounded_1c } from 'next/font/google';
import type { ReactNode } from 'react';

import './globals.css';

// M PLUS Rounded 1c, la police de la DA (ronde comme une goutte), auto-hébergée par Next.js.
const rounded = M_PLUS_Rounded_1c({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700', '800'],
  variable: '--font-rounded',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Water Finder — Administration',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={rounded.variable}>
      <body>{children}</body>
    </html>
  );
}
