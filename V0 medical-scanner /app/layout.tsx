import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import localFont from "next/font/local"

import { ThemeProvider } from "@/components/theme-provider"

const pretendard = localFont({
  src: [
    {
      path: "../public/fonts/Pretendard-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Pretendard-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Pretendard-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-pretendard",
})

export const metadata: Metadata = {
  title: "개원스캐너 v0 - 가장 빠른 신규 개원 정보",
  description: "행정안전부·국세청 등 공공 인허가 데이터 기반 병의원 개원 정보를 가장 빠르게 제공합니다.",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={pretendard.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
