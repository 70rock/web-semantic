import type { Metadata } from 'next'
import './globals.css'
import GoogleTranslateWidget from "@/components/GoogleTranslateWidget";

export const metadata: Metadata = {
  title: 'semantic',
  description: 'Web Semantic',
  generator: 'web semantic',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body>
        {children}
        <GoogleTranslateWidget />
      </body>
    </html>
  )
}
