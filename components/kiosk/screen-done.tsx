"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2, Receipt } from "lucide-react"
import { useKiosk } from "./store"

export function ScreenDone() {
  const { cartTotal, pointsEarned, voiceMode, speech, reset } = useKiosk()
  const [seconds, setSeconds] = useState(8)
  const orderNo = useRef(Math.floor(100 + Math.random() * 900))
  const spokenRef = useRef(false)
  const total = useRef(cartTotal)
  const earned = useRef(pointsEarned)

  useEffect(() => {
    if (voiceMode && !spokenRef.current) {
      spokenRef.current = true
      const earnPart = earned.current > 0 ? ` ${earned.current.toLocaleString("ko-KR")}점도 적립되었어요.` : ""
      speech.speak(`결제가 끝났어요. 주문번호는 ${orderNo.current}번이에요.${earnPart} 잠시만 기다려 주세요. 맛있게 드세요.`)
    }
    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer)
          reset()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center justify-center gap-7 px-6 py-12 text-center">
      <span className="flex h-32 w-32 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <CheckCircle2 className="h-20 w-20" aria-hidden="true" />
      </span>

      <h1 className="text-balance text-5xl font-black leading-tight text-foreground">
        주문이 완료되었어요!
      </h1>

      <div className="w-full rounded-3xl border-2 border-border bg-card p-7">
        <div className="flex items-center justify-center gap-3 text-2xl font-bold text-muted-foreground">
          <Receipt className="h-8 w-8" aria-hidden="true" />
          주문 번호
        </div>
        <p className="mt-2 text-7xl font-black text-primary">{orderNo.current}</p>
        <p className="mt-4 text-2xl font-bold text-foreground">
          결제 금액 {total.current.toLocaleString("ko-KR")}원
        </p>
        {earned.current > 0 && (
          <p className="mt-1 text-xl font-bold text-accent">
            {earned.current.toLocaleString("ko-KR")}점이 적립되었어요
          </p>
        )}
      </div>

      <p className="text-2xl font-extrabold text-foreground">
        번호를 부르면 음료를 받아 가세요.
      </p>

      <button
        type="button"
        onClick={reset}
        className="btn-primary"
      >
        처음으로 ({seconds})
      </button>
    </div>
  )
}
