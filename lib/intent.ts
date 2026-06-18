import { categories, menuItems, type CategoryId, type MenuItem } from "./menu"

/** Extra synonym hints that map spoken words to menu keywords. */
const synonyms: Record<string, string[]> = {
  차가운: ["차가운", "시원한", "아이스"],
  시원한: ["차가운", "시원한", "아이스"],
  아이스: ["차가운", "시원한", "아이스"],
  따뜻한: ["따뜻한", "뜨거운", "핫"],
  뜨거운: ["따뜻한", "뜨거운", "핫"],
  단: ["달콤한", "단"],
  달달한: ["달콤한", "단"],
  달콤한: ["달콤한", "단"],
  쓴: ["쓴", "진한"],
  초콜렛: ["초코", "초콜릿"],
  초콜릿: ["초코", "초콜릿"],
  초코: ["초코", "초콜릿"],
}

export interface MatchResult {
  item: MenuItem
  score: number
}

/**
 * Lightweight on-device intent matching. Scores each menu item by how many of
 * its keywords appear in the spoken sentence. No external AI call required, so
 * it works fully hands-free in the browser.
 */
export function matchMenu(utterance: string, limit = 3): MatchResult[] {
  if (!utterance.trim()) return []
  const text = utterance.replace(/\s+/g, "")

  // expand synonyms present in the utterance
  const expanded = new Set<string>()
  Object.entries(synonyms).forEach(([word, mapped]) => {
    if (text.includes(word)) mapped.forEach((m) => expanded.add(m))
  })

  const results: MatchResult[] = menuItems.map((item) => {
    let score = 0

    // direct name hit is a strong signal
    const compactName = item.name.replace(/\s+/g, "")
    if (text.includes(compactName)) score += 6

    item.keywords.forEach((kw) => {
      if (text.includes(kw)) score += 2
      if (expanded.has(kw)) score += 1
    })

    return { item, score }
  })

  return results
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/** Detect a category mention so we can jump straight to that tab. */
export function matchCategory(utterance: string): CategoryId | null {
  const text = utterance.replace(/\s+/g, "")
  for (const c of categories) {
    if (text.includes(c.name.replace(/\s+/g, ""))) return c.id
  }
  if (text.includes("커피")) return "coffee"
  if (text.includes("디저트") || text.includes("빵") || text.includes("케이크")) return "dessert"
  return null
}

export type YesNo = "yes" | "no" | "unknown"

export function parseYesNo(utterance: string): YesNo {
  const t = utterance.replace(/\s+/g, "")
  const yes = ["네", "예", "맞아", "맞아요", "응", "그래", "좋아", "할게", "해줘", "결제", "확인"]
  const no = ["아니", "아니요", "아냐", "틀려", "취소", "다시", "수정", "바꿔"]
  if (no.some((w) => t.includes(w))) return "no"
  if (yes.some((w) => t.includes(w))) return "yes"
  return "unknown"
}

export type Temp = "hot" | "ice" | null
export function parseTemperature(utterance: string): Temp {
  const t = utterance.replace(/\s+/g, "")
  if (["차가운", "시원한", "아이스", "찬", "냉"].some((w) => t.includes(w))) return "ice"
  if (["따뜻한", "뜨거운", "핫", "더운"].some((w) => t.includes(w))) return "hot"
  return null
}

export type Size = "small" | "large" | null
export function parseSize(utterance: string): Size {
  const t = utterance.replace(/\s+/g, "")
  if (["큰", "크게", "라지", "대", "많이"].some((w) => t.includes(w))) return "large"
  if (["작은", "작게", "스몰", "소", "보통", "기본"].some((w) => t.includes(w))) return "small"
  return null
}
