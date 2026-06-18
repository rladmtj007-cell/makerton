"use client"

import { useEffect, useRef } from "react"
import { CheckCircle2, CreditCard, Smartphone, Gift, ArrowLeft } from "lucide-react"
import { formatWon } from "@/lib/menu"
import { parseYesNo } from "@/lib/intent"
import { useKiosk, type PaymentMethod } from "./store"
import { TopBar } from "./top-bar"
import { VoiceIndicator } from "./voice-indicator"

const PAY_LABEL: Record<PaymentMethod, string> = {
  card: "카드",
  mobile: "휴대폰 간편결제",
  gift: "상품권",
}
const PAY_ICON: Record<PaymentMethod, React.ReactNode> = {
  card: <CreditCard className="h-8 w-8" aria-hidden="true" />,
  mobile: <Smartphone className="h-8 w-8" aria-hidden="true" />,
  gift: <Gift className="h-8 w-8" aria-hidden="true" />,
}

export function ScreenConfirm() {
  const {
    cart,
    cartTotal,
    payment,
    pointsEarned,
    phone,
    voiceMode,
    speech,
    go,
  } = useKiosk()
  const startedRef = useRef(false)

  useEffect(() => {
    if (!voiceMode || startedRef.current) return
    startedRef.current = true
    const method = payment ? PAY_LABEL[payment] : "선택한 방법"
    speech
      .speak(`${method}으로 ${cartTotal.toLocaleString("ko-KR")}원을 결제할게요. 결제하시려면 네, 다시 고르시려면 아니요라고 말씀해 주세요.`)
      .then(() => speech.listen(handleUtterance))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode])

  function handleUtterance(text: string) {
    const yn = parseYesNo(text)
    if (yn === "yes") {
      pay()
      return
    }
    if (yn === "no") {
      speech.cancelAll()
      go("payment")
      return
    }
    speech.speak("결제하시려면 네, 다시 고르시려면 아니요라고 말씀해 주세요.").then(() => speech.listen(handleUtterance))
  }

  function pay() {
    speech.cancelAll()
    go("done")
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <VoiceIndicator />
      <TopBar title="주문 확인" />

      <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-6 pb-44">
        <h2 className="mb-4 text-3xl font-black text-foreground">주문 내역을 확인해 주세요</h2>

        <ul className="flex flex-col gap-3">
          {cart.map((line) => (
            <li
              key={line.lineId}
              className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card px-5 py-4"
            >
              <span className="min-w-0">
                <span className="block text-2xl font-extrabold text-card-foreground">
                  {line.item.name} <span className="text-primary">×{line.quantity}</span>
                </span>
                <span className="block text-lg font-bold text-muted-foreground">
                  {[
                    line.temperature ? (line.temperature === "ice" ? "차갑게" : "따뜻하게") : null,
                    line.size ? (line.size === "large" ? "큰 크기" : "보통 크기") : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "기본"}
                </span>
              </span>
              <span className="shrink-0 text-2xl font-black text-foreground">
                {formatWon(line.unitPrice * line.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-col gap-3 rounded-3xl bg-secondary px-6 py-5">
          <div className="flex items-center justify-between text-xl font-bold text-secondary-foreground">
            <span className="flex items-center gap-2">
              {payment ? PAY_ICON[payment] : null}
              결제 방법
            </span>
            <span>{payment ? PAY_LABEL[payment] : "-"}</span>
          </div>
          {pointsEarned > 0 && (
            <div className="flex items-center justify-between text-xl font-bold text-secondary-foreground">
              <span className="flex items-center gap-2">
                <Gift className="h-7 w-7" aria-hidden="true" />
                포인트 적립
              </span>
              <span>
                {phone ? formatPhoneShort(phone) + " · " : ""}
                {pointsEarned.toLocaleString("ko-KR")}점
              </span>
            </div>
          )}
          <div className="mt-1 flex items-center justify-between border-t-2 border-border pt-3">
            <span className="text-2xl font-black text-foreground">전체 금액</span>
            <span className="text-4xl font-black text-primary">{formatWon(cartTotal)}</span>
          </div>
        </div>
      </div>

      {/* sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-border bg-background/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <button
            type="button"
            onClick={() => go("payment")}
            className="flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-5 py-5 text-xl font-bold text-card-foreground transition hover:bg-secondary"
          >
            <ArrowLeft className="h-6 w-6" aria-hidden="true" /> 뒤로
          </button>
          <button
            type="button"
            onClick={pay}
            className="btn-primary flex flex-1 items-center justify-center gap-3"
          >
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            {formatWon(cartTotal)} 결제하기
          </button>
        </div>
      </div>
    </div>
  )
}

function formatPhoneShort(d: string): string {
  if (d.length < 4) return d
  return `***-****-${d.slice(-4)}`
}
