import type { Metadata, Viewport } from "next"
import { Noto_Sans_KR } from "next/font/google"
import type { ReactNode } from "react"
import "./globals.css"

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Vorder · 말로 주문하는 AI 키오스크",
  description:
    "메뉴 이름을 몰라도 괜찮아요. 말로 설명하면 AI가 메뉴를 찾아 주문까지 도와드립니다.",
}

export const viewport: Viewport = {
  themeColor: "#c2410c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} bg-background`}>
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  )
}
