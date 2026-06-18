"use client"

import { useEffect, useRef } from "react"
import { CreditCard, Smartphone, Gift } from "lucide-react"
import { formatWon } from "@/lib/menu"
import { useKiosk, type PaymentMethod } from "./store"
import { TopBar } from "./top-bar"
import { VoiceIndicator } from "./voice-indicator"

const METHODS: {
  id: PaymentMethod
  label: string
  sub: string
  icon: React.ReactNode
  keywords: string[]
}[] = [
  {
    id: "card",
    label: "카드",
    sub: "신용 · 체크카드",
    icon: <CreditCard className="h-16 w-16" aria-hidden="true" />,
    keywords: ["카드", "신용", "체크"],
  },
  {
    id: "mobile",
    label: "휴대폰 간편결제",
    sub: "삼성페이 · 카카오페이",
    icon: <Smartphone className="h-16 w-16" aria-hidden="true" />,
    keywords: ["휴대폰", "폰", "간편", "페이", "카카오", "삼성"],
  },
  {
    id: "gift",
    label: "상품권",
    sub: "기프티콘 · 상품권",
    icon: <Gift className="h-16 w-16" aria-hidden="true" />,
    keywords: ["상품권", "기프티콘", "쿠폰"],
  },
]

export function ScreenPayment() {
  const { cartTotal, setPayment, voiceMode, speech, go } = useKiosk()
  const startedRef = useRef(false)

  useEffect(() => {
    if (!voiceMode || startedRef.current) return
    startedRef.current = true
    speech
      .speak("결제 방법을 골라 주세요. 카드, 휴대폰 간편결제, 상품권 중에서 말씀해 주세요.")
      .then(() => speech.listen(handleUtterance))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode])

  function handleUtterance(text: string) {
    const t = text.replace(/\s+/g, "")
    const found = METHODS.find((m) => m.keywords.some((k) => t.includes(k)))
    if (found) {
      choose(found.id)
      return
    }
    speech
      .speak("카드, 휴대폰 간편결제, 상품권 중에서 골라 주세요.")
      .then(() => speech.listen(handleUtterance))
  }

  function choose(id: PaymentMethod) {
    setPayment(id)
    speech.cancelAll()
    go("confirm")
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <VoiceIndicator />
      <TopBar title="결제 방법" />

      <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-6">
        <div className="mb-6 flex items-center justify-between rounded-3xl bg-secondary px-6 py-5">
          <span className="text-2xl font-bold text-secondary-foreground">결제할 금액</span>
          <span className="text-4xl font-black text-primary">{formatWon(cartTotal)}</span>
        </div>

        <h2 className="mb-4 text-3xl font-black text-foreground">어떻게 결제하시겠어요?</h2>

        <div className="flex flex-col gap-4">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => choose(m.id)}
              className="flex items-center gap-5 rounded-3xl border-4 border-border bg-card px-6 py-6 text-left transition hover:border-primary hover:bg-secondary focus:outline-none focus-visible:ring-4 focus-visible:ring-ring active:scale-[0.99]"
            >
              <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {m.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-3xl font-black text-card-foreground">{m.label}</span>
                <span className="block text-xl font-bold text-muted-foreground">{m.sub}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
