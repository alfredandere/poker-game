import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CustomToaster } from '@/components/ui/custom-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Poker Game',
  description: 'Texas Hold\'em Poker Game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
      <CustomToaster />
    </html>
  )
}