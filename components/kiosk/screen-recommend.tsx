"use client"

import { useEffect, useRef } from "react"
import { Sparkles } from "lucide-react"
import type { MenuItem } from "@/lib/menu"
import { useKiosk } from "./store"
import { MenuCard } from "./menu-card"
import { TopBar } from "./top-bar"
import { CartBar } from "./cart-bar"

const ORDINALS: Record<string, number> = {
  첫: 0,
  첫번째: 0,
  첫번재: 0,
  하나: 0,
  일번: 0,
  두: 1,
  두번째: 1,
  둘: 1,
  이번: 1,
  세: 2,
  세번째: 2,
  셋: 2,
  삼번: 2,
}

export function ScreenRecommend() {
  const { recommendations, heardKeywords, voiceMode, speech, beginOptions, go } = useKiosk()
  const startedRef = useRef(false)

  function pick(item: MenuItem) {
    beginOptions(item, "recommend")
  }

  function handleUtterance(text: string) {
    const t = text.replace(/\s+/g, "")
    // direct name match
    const byName = recommendations.find((r) =>
      t.includes(r.name.replace(/\s+/g, "")),
    )
    if (byName) {
      pick(byName)
      return
    }
    // ordinal match
    for (const [word, idx] of Object.entries(ORDINALS)) {
      if (t.includes(word) && recommendations[idx]) {
        pick(recommendations[idx])
        return
      }
    }
    // "이거 / 그거 / 맞아" → first option
    if (["이거", "그거", "맞아", "응", "네", "예", "좋아"].some((w) => t.includes(w))) {
      if (recommendations[0]) {
        pick(recommendations[0])
        return
      }
    }
    // not understood
    speech
      .speak("어떤 것으로 하시겠어요? 메뉴 이름을 말씀하시거나 화면을 눌러 주세요.")
      .then(() => speech.listen(handleUtterance))
  }

  useEffect(() => {
    if (!voiceMode || startedRef.current) return
    startedRef.current = true
    const names = recommendations.map((r) => r.name).join(", ")
    const intro =
      recommendations.length === 1
        ? `${names}, 이 메뉴를 찾았어요. 이걸로 하시겠어요?`
        : `이런 메뉴를 찾았어요. ${names} 중에서, 원하시는 것을 말씀하시거나 화면을 눌러 주세요.`
    speech.speak(intro).then(() => speech.listen(handleUtterance))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode])

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar title="찾은 메뉴" />

      <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-6">
        <div className="mb-6 flex flex-col gap-3 rounded-3xl bg-secondary px-6 py-5">
          <div className="flex items-center gap-3">
            <Sparkles className="h-9 w-9 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-pretty text-2xl font-extrabold leading-snug text-secondary-foreground">
              말씀하신 내용으로 이런 메뉴를 찾았어요.
              <br />
              마음에 드는 것을 골라 주세요.
            </p>
          </div>
          {heardKeywords.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pl-12">
              <span className="text-xl font-bold text-muted-foreground">들은 내용:</span>
              {heardKeywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded-full bg-card px-4 py-1.5 text-xl font-bold text-primary"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {recommendations.length === 0 ? (
          <div className="rounded-3xl border-2 border-border bg-card p-8 text-center">
            <p className="text-2xl font-bold text-card-foreground">
              찾은 메뉴가 없어요. 메뉴를 직접 골라 볼까요?
            </p>
            <button
              type="button"
              onClick={() => go("browse")}
              className="mt-5 rounded-2xl bg-primary px-7 py-4 text-2xl font-extrabold text-primary-foreground"
            >
              메뉴 직접 보기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((item, i) => (
              <div key={item.id} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <MenuCard item={item} onSelect={pick} highlight={i === 0} />
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => go("browse")}
          className="mt-8 w-full rounded-3xl border-2 border-border bg-card px-6 py-5 text-2xl font-extrabold text-card-foreground transition hover:bg-secondary"
        >
          다른 메뉴도 볼래요
        </button>
      </div>

      <CartBar />
    </div>
  )
}
