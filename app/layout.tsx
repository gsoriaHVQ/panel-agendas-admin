import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Agendas",
  description: "Módulo de gestión de agendas médicas para Hospital Vozandes Quito",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <style>{`
          html {
            font-family: Arial, sans-serif;
          }
        `}</style>
      </head>
      <body className="min-h-screen bg-[#F9F4F6]">{children}</body>
    </html>
  )
}
