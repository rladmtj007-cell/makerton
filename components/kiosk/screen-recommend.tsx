"use client"

import { useEffect, useRef } from "react"
import { Sparkles, Hand } from "lucide-react"
import { formatWon, type MenuItem } from "@/lib/menu"
import { useKiosk } from "./store"
import { MenuCard } from "./menu-card"
import { MenuIcon } from "./icon"
import { TopBar } from "./top-bar"
import { CartBar } from "./cart-bar"

const ORDINALS: Record<string, number> = {
  첫: 0,
  첫번째: 0,
  첫번재: 0,
  하나: 0,
  일번: 0,
  왼쪽: 0,
  두: 1,
  두번째: 1,
  둘: 1,
  이번: 1,
  오른쪽: 1,
}

export function ScreenRecommend() {
  const { recommendations, heardKeywords, voiceMode, speech, beginOptions, go } = useKiosk()
  const startedRef = useRef(false)

  function pick(item: MenuItem) {
    speech.cancelAll()
    beginOptions(item, "recommend")
  }

  function handleUtterance(text: string) {
    const t = text.replace(/\s+/g, "")
    const byName = recommendations.find((r) => t.includes(r.name.replace(/\s+/g, "")))
    if (byName) {
      pick(byName)
      return
    }
    for (const [word, idx] of Object.entries(ORDINALS)) {
      if (t.includes(word) && recommendations[idx]) {
        pick(recommendations[idx])
        return
      }
    }
    if (["이거", "그거", "맞아", "응", "네", "예", "좋아"].some((w) => t.includes(w))) {
      if (recommendations[0]) {
        pick(recommendations[0])
        return
      }
    }
    speech
      .speak("어떤 것으로 하시겠어요? 메뉴 이름을 말씀하시거나, 드시고 싶은 그림을 손으로 눌러 주세요.")
      .then(() => speech.listen(handleUtterance))
  }

  useEffect(() => {
    if (!voiceMode || startedRef.current) return
    startedRef.current = true
    const names = recommendations.map((r) => r.name).join(", 그리고 ")
    const intro =
      recommendations.length === 1
        ? `${recommendations[0].name}를 찾았어요. 이걸로 드릴까요? 좋으시면 화면을 눌러 주세요.`
        : `네, 찾아봤어요. ${names}, 두 가지가 있어요. 어떤 게 더 좋으세요? 마음에 드는 그림을 손으로 눌러 주세요.`
    speech.speak(intro).then(() => speech.listen(handleUtterance))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode])

  const isBig = recommendations.length > 0 && recommendations.length <= 2

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar title="찾은 메뉴" />

      <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">
        <div className="mb-6 flex flex-col gap-3 rounded-3xl bg-secondary px-6 py-5">
          <div className="flex items-center gap-3">
            <Sparkles className="h-9 w-9 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-pretty text-2xl font-extrabold leading-snug text-secondary-foreground">
              말씀하신 내용으로 이런 메뉴를 찾았어요.
              <br />
              드시고 싶은 것을 손으로 눌러 주세요.
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
        ) : isBig ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {recommendations.map((item, i) => (
              <BigChoiceCard key={item.id} item={item} index={i} onSelect={pick} />
            ))}
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

/** Large, photo-forward choice card for the 1-2 recommendation case. */
function BigChoiceCard({
  item,
  index,
  onSelect,
}: {
  item: MenuItem
  index: number
  onSelect: (item: MenuItem) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      style={{ animationDelay: `${index * 100}ms` }}
      className="animate-fade-up group flex flex-col overflow-hidden rounded-[2rem] border-4 border-border bg-card text-left shadow-md transition hover:-translate-y-1 hover:border-primary hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-ring"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-secondary">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image || "/placeholder.svg"}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <MenuIcon name={item.icon} className="h-28 w-28 text-secondary-foreground/70" />
        )}
        <span className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-black text-primary-foreground shadow">
          {index + 1}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-6">
        <h3 className="text-4xl font-black leading-tight text-card-foreground">{item.name}</h3>
        <p className="line-clamp-1 text-2xl font-bold text-muted-foreground">{item.description}</p>
        <p className="text-3xl font-black text-primary">{formatWon(item.price)}</p>
        <span className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-3xl font-black text-primary-foreground transition group-hover:brightness-105">
          <Hand className="h-8 w-8" aria-hidden="true" />
          이걸로 할게요
        </span>
      </div>
    </button>
  )
}
