"use client"

import { useEffect, useRef, useState } from "react"
import { Minus, Plus, Snowflake, Flame, ShoppingBag, ArrowLeft } from "lucide-react"
import { formatWon } from "@/lib/menu"
import { parseSize, parseTemperature, parseYesNo } from "@/lib/intent"
import { useKiosk, computeUnitPrice, type Temp, type Size } from "./store"
import { MenuIcon } from "./icon"
import { TopBar } from "./top-bar"
import { VoiceIndicator } from "./voice-indicator"

type Phase = "temp" | "size" | "qty" | "confirm"

export function ScreenOptions() {
  const {
    selectedItem,
    optionsReturnTo,
    voiceMode,
    speech,
    addToCart,
    go,
  } = useKiosk()

  const [temperature, setTemperature] = useState<Temp | null>(null)
  const [size, setSize] = useState<Size | null>(null)
  const [quantity, setQuantity] = useState(1)
  const startedRef = useRef(false)

  const item = selectedItem

  const needsTemp = !!item && item.temperatures.length > 0
  const needsSize = !!item && item.hasSize

  // Pre-fill options that don't apply so the "담기" button can enable.
  useEffect(() => {
    if (!item) return
    setTemperature(item.temperatures.length === 0 ? ("hot" as Temp) : null)
    setSize(item.hasSize ? null : ("small" as Size))
    setQuantity(1)
    startedRef.current = false
  }, [item])

  const tempReady = !needsTemp || temperature !== null
  const sizeReady = !needsSize || size !== null
  const ready = tempReady && sizeReady

  const unitPrice = item ? computeUnitPrice(item, size) : 0

  // ---- hands-free guidance ----
  function currentPhase(): Phase {
    if (needsTemp && temperature === null) return "temp"
    if (needsSize && size === null) return "size"
    return "confirm"
  }

  function listenForPhase(phase: Phase) {
    speech.listen((text) => handleUtterance(text, phase))
  }

  function handleUtterance(text: string, phase: Phase) {
    if (phase === "temp") {
      const t = parseTemperature(text)
      if (t && item?.temperatures.includes(t)) {
        setTemperature(t)
        askSizeOrConfirm(t)
        return
      }
      speech
        .speak("따뜻한 것과 차가운 것 중에 무엇으로 드릴까요?")
        .then(() => listenForPhase("temp"))
      return
    }
    if (phase === "size") {
      const s = parseSize(text)
      if (s) {
        setSize(s)
        askConfirm(temperature, s)
        return
      }
      speech.speak("보통 크기와 큰 크기 중에 골라 주세요.").then(() => listenForPhase("size"))
      return
    }
    // confirm
    const yn = parseYesNo(text)
    if (yn === "yes") {
      commit()
      return
    }
    if (yn === "no") {
      speech.speak("알겠습니다. 다른 메뉴를 골라 주세요.").then(() => go(optionsReturnTo))
      return
    }
    speech.speak("이대로 담을까요? 네 또는 아니요로 말씀해 주세요.").then(() => listenForPhase("confirm"))
  }

  function askSizeOrConfirm(t: Temp) {
    if (needsSize) {
      speech.speak("크기는 보통과 큰 것 중에 무엇으로 드릴까요?").then(() => listenForPhase("size"))
    } else {
      askConfirm(t, size)
    }
  }

  function askConfirm(t: Temp | null, s: Size | null) {
    const parts: string[] = []
    if (needsTemp && t) parts.push(t === "ice" ? "차가운" : "따뜻한")
    if (needsSize && s) parts.push(s === "large" ? "큰 크기" : "보통 크기")
    const desc = parts.length ? parts.join(" ") + " " : ""
    speech
      .speak(`${desc}${item?.name} 한 잔을 담을까요? 네 또는 아니요로 말씀해 주세요.`)
      .then(() => listenForPhase("confirm"))
  }

  // kick off voice guidance once
  useEffect(() => {
    if (!voiceMode || !item || startedRef.current) return
    startedRef.current = true
    const phase = currentPhase()
    if (phase === "temp") {
      speech
        .speak(`${item.name}를 고르셨어요. 따뜻한 것과 차가운 것 중에 무엇으로 드릴까요?`)
        .then(() => listenForPhase("temp"))
    } else if (phase === "size") {
      speech
        .speak(`${item.name}를 고르셨어요. 크기는 보통과 큰 것 중에 골라 주세요.`)
        .then(() => listenForPhase("size"))
    } else {
      askConfirm(temperature, size)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode, item])

  function commit() {
    if (!item || !ready) return
    addToCart({
      item,
      temperature: needsTemp ? temperature : null,
      size: needsSize ? size : null,
      quantity,
      unitPrice,
    })
    speech.cancelAll()
    go("cart")
  }

  if (!item) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar title="옵션 고르기" />
        <div className="flex flex-1 items-center justify-center p-8">
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
      <TopBar title="옵션 고르기" />

      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-6 pb-40">
        {/* item header */}
        <div className="mb-7 flex items-center gap-5 rounded-3xl border-2 border-border bg-card p-5">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <MenuIcon name={item.icon} className="h-16 w-16 text-secondary-foreground/70" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-4xl font-black leading-tight text-card-foreground">{item.name}</h2>
            <p className="mt-1 text-xl font-bold text-muted-foreground">{item.description}</p>
          </div>
        </div>

        {/* temperature */}
        {needsTemp && (
          <Section step={1} label="온도를 골라 주세요">
            <div className="grid grid-cols-2 gap-4">
              {item.temperatures.includes("hot") && (
                <OptionButton
                  active={temperature === "hot"}
                  onClick={() => setTemperature("hot")}
                  icon={<Flame className="h-12 w-12" aria-hidden="true" />}
                  label="따뜻하게"
                />
              )}
              {item.temperatures.includes("ice") && (
                <OptionButton
                  active={temperature === "ice"}
                  onClick={() => setTemperature("ice")}
                  icon={<Snowflake className="h-12 w-12" aria-hidden="true" />}
                  label="차갑게"
                />
              )}
            </div>
          </Section>
        )}

        {/* size */}
        {needsSize && (
          <Section step={needsTemp ? 2 : 1} label="크기를 골라 주세요">
            <div className="grid grid-cols-2 gap-4">
              <OptionButton
                active={size === "small"}
                onClick={() => setSize("small")}
                icon={<span className="text-4xl font-black">S</span>}
                label="보통"
                sub={formatWon(item.price)}
              />
              <OptionButton
                active={size === "large"}
                onClick={() => setSize("large")}
                icon={<span className="text-5xl font-black">L</span>}
                label="크게"
                sub={`+ ${formatWon(500)}`}
              />
            </div>
          </Section>
        )}

        {/* quantity */}
        <Section step={(needsTemp ? 1 : 0) + (needsSize ? 1 : 0) + 1} label="몇 잔 드릴까요?">
          <div className="flex items-center justify-center gap-6 rounded-3xl border-2 border-border bg-card py-5">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="수량 줄이기"
              className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-border bg-secondary text-secondary-foreground transition hover:bg-muted disabled:opacity-40"
              disabled={quantity <= 1}
            >
              <Minus className="h-10 w-10" aria-hidden="true" />
            </button>
            <span className="w-20 text-center text-6xl font-black text-foreground" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              aria-label="수량 늘리기"
              className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-primary text-primary-foreground transition hover:brightness-105"
            >
              <Plus className="h-10 w-10" aria-hidden="true" />
            </button>
          </div>
        </Section>
      </div>

      {/* sticky action */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-border bg-background/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <button
            type="button"
            onClick={() => go(optionsReturnTo)}
            className="flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-5 py-5 text-xl font-bold text-card-foreground transition hover:bg-secondary"
          >
            <ArrowLeft className="h-6 w-6" aria-hidden="true" /> 뒤로
          </button>
          <button
            type="button"
            onClick={commit}
            disabled={!ready}
            className="btn-primary flex flex-1 items-center justify-center gap-3"
          >
            <ShoppingBag className="h-8 w-8" aria-hidden="true" />
            {formatWon(unitPrice * quantity)} 담기
          </button>
        </div>
        {!ready && (
          <p className="mx-auto mt-2 max-w-3xl text-center text-lg font-bold text-muted-foreground">
            {needsTemp && temperature === null ? "온도를 먼저 골라 주세요" : "크기를 먼저 골라 주세요"}
          </p>
        )}
      </div>
    </div>
  )
}

function Section({
  step,
  label,
  children,
}: {
  step: number
  label: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-7">
      <h3 className="mb-3 flex items-center gap-3 text-2xl font-extrabold text-foreground">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-lg font-black text-primary-foreground">
          {step}
        </span>
        {label}
      </h3>
      {children}
    </section>
  )
}

function OptionButton({
  active,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  sub?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-center justify-center gap-2 rounded-3xl border-4 px-4 py-7 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-ring ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-lg"
          : "border-border bg-card text-card-foreground hover:bg-secondary"
      }`}
    >
      {icon}
      <span className="text-3xl font-extrabold">{label}</span>
      {sub && <span className={`text-lg font-bold ${active ? "opacity-90" : "text-muted-foreground"}`}>{sub}</span>}
    </button>
  )
}
