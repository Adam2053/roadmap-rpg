import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Roadmap RPG – AI-Powered Life Operating System',
  description: 'Gamify your personal growth with AI-generated roadmaps, XP, and levels.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster richColors theme="dark" position="top-right" />
      </body>
    </html>
  )
}
