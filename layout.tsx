import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EvalBuilder Pro — PT & Nutricionista',
  description: 'Avaliações físicas, treinos e planos alimentares em PDF profissional.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900 min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
