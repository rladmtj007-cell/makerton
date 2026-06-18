"use client"

import { useEffect, useRef } from "react"
import { Minus, Plus, Trash2, Plus as PlusIcon, ArrowRight } from "lucide-react"
import { formatWon } from "@/lib/menu"
import { parseYesNo } from "@/lib/intent"
import { useKiosk } from "./store"
import { MenuIcon } from "./icon"
import { TopBar } from "./top-bar"
import { VoiceIndicator } from "./voice-indicator"

export function ScreenCart() {
  const {
    cart,
    cartTotal,
    cartCount,
    changeQuantity,
    removeLine,
    voiceMode,
    speech,
    go,
  } = useKiosk()
  const startedRef = useRef(false)

  useEffect(() => {
    if (!voiceMode || startedRef.current) return
    startedRef.current = true
    const summary = cart
      .map((l) => `${l.item.name} ${l.quantity}잔`)
      .join(", ")
    speech
      .speak(
        `장바구니에 ${summary}을 담았어요. 모두 ${cartTotal.toLocaleString("ko-KR")}원이에요. 이대로 주문할까요? 네 또는 아니요로 말씀해 주세요.`,
      )
      .then(() => speech.listen(handleUtterance))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode])

  function handleUtterance(text: string) {
    const t = text.replace(/\s+/g, "")
    if (t.includes("더") || t.includes("추가") || t.includes("메뉴")) {
      go("browse")
      return
    }
    const yn = parseYesNo(text)
    if (yn === "yes") {
      go("points")
      return
    }
    if (yn === "no") {
      speech.speak("메뉴를 더 고르시려면 메뉴 더 담기를 눌러 주세요.").then(() => speech.listen(handleUtterance))
      return
    }
    speech.speak("주문하시려면 네, 더 담으시려면 아니요라고 말씀해 주세요.").then(() => speech.listen(handleUtterance))
  }

  if (cartCount === 0) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title="담은 메뉴" />
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <p className="text-3xl font-extrabold text-foreground">아직 담은 메뉴가 없어요.</p>
          <button type="button" onClick={() => go("browse")} className="btn-primary">
            메뉴 고르러 가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <VoiceIndicator />
      <TopBar title="담은 메뉴" />

      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-6 pb-44">
        <ul className="flex flex-col gap-4">
          {cart.map((line) => (
            <li
              key={line.lineId}
              className="flex items-center gap-4 rounded-3xl border-2 border-border bg-card p-4"
            >
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
                {line.item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={line.item.image || "/placeholder.svg"} alt={line.item.name} className="h-full w-full object-cover" />
                ) : (
                  <MenuIcon name={line.item.icon} className="h-14 w-14 text-secondary-foreground/70" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-2xl font-extrabold leading-tight text-card-foreground">{line.item.name}</h3>
                <p className="mt-1 text-lg font-bold text-muted-foreground">
                  {[
                    line.temperature ? (line.temperature === "ice" ? "차갑게" : "따뜻하게") : null,
                    line.size ? (line.size === "large" ? "큰 크기" : "보통 크기") : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "기본"}
                </p>
                <p className="mt-1 text-xl font-black text-primary">{formatWon(line.unitPrice * line.quantity)}</p>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeQuantity(line.lineId, -1)}
                    aria-label={`${line.item.name} 수량 줄이기`}
                    className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-secondary text-secondary-foreground"
                  >
                    <Minus className="h-6 w-6" aria-hidden="true" />
                  </button>
                  <span className="w-10 text-center text-3xl font-black">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(line.lineId, 1)}
                    aria-label={`${line.item.name} 수량 늘리기`}
                    className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-primary text-primary-foreground"
                  >
                    <Plus className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(line.lineId)}
                  className="flex items-center gap-1 rounded-xl px-3 py-1 text-lg font-bold text-danger hover:underline"
                >
                  <Trash2 className="h-5 w-5" aria-hidden="true" /> 빼기
                </button>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => go("browse")}
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card px-6 py-6 text-2xl font-extrabold text-card-foreground transition hover:bg-secondary"
        >
          <PlusIcon className="h-7 w-7 text-primary" aria-hidden="true" />
          메뉴 더 담기
        </button>
      </div>

      {/* sticky checkout */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-border bg-background/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">전체 금액</span>
            <span className="text-4xl font-black text-primary">{formatWon(cartTotal)}</span>
          </div>
          <button
            type="button"
            onClick={() => go("points")}
            className="btn-primary flex w-full items-center justify-center gap-3"
          >
            주문하기
            <ArrowRight className="h-8 w-8" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
