import { categories, menuItems, type CategoryId, type MenuItem } from "./menu"

/**
 * Spoken word -> canonical menu keyword(s).
 * The user can speak naturally; we map however they phrase it onto the
 * keywords that actually live on the menu items. This is the heart of the
 * keyword-centric matching: we never ask the user to recite a fixed sentence.
 */
const SYNONYMS: Record<string, string[]> = {
  // 온도 - cold
  차가운: ["차가운", "시원한"],
  차가워: ["차가운", "시원한"],
  시원한: ["차가운", "시원한"],
  시원: ["차가운", "시원한"],
  아이스: ["차가운", "시원한"],
  찬: ["차가운", "시원한"],
  냉: ["차가운", "시원한"],
  얼음: ["차가운", "시원한"],
  // 온도 - hot
  따뜻한: ["따뜻한"],
  따듯한: ["따뜻한"],
  뜨거운: ["따뜻한"],
  뜨신: ["따뜻한"],
  핫: ["따뜻한"],
  더운: ["따뜻한"],
  // 단맛
  단: ["단", "달콤한"],
  달달한: ["단", "달콤한"],
  달달: ["단", "달콤한"],
  달콤한: ["단", "달콤한"],
  달콤: ["단", "달콤한"],
  단거: ["단", "달콤한"],
  단것: ["단", "달콤한"],
  당: ["단", "달콤한"],
  // 쓴맛/진함
  쓴: ["쓴", "진한"],
  쓰: ["쓴", "진한"],
  씁쓸한: ["쓴", "진한"],
  진한: ["진한", "쓴"],
  진하게: ["진한", "쓴"],
  강한: ["진한"],
  // 부드러움
  부드러운: ["부드러운", "우유"],
  순한: ["부드러운"],
  연한: ["부드러운"],
  // 초콜릿
  초콜렛: ["초코", "초콜릿"],
  초콜릿: ["초코", "초콜릿"],
  초코: ["초코", "초콜릿"],
  // 고소함/견과
  고소한: ["고소한", "견과"],
  견과: ["견과", "고소한"],
  땅콩: ["견과"],
  너트: ["견과"],
  // 우유
  우유: ["우유"],
  밀크: ["우유"],
  라떼: ["라떼", "우유"],
  // 과일/상큼
  과일: ["과일"],
  상큼한: ["상큼한", "과일"],
  새콤한: ["상큼한", "과일"],
  새콤달콤: ["상큼한", "달콤한"],
  // 커피
  커피: ["커피"],
  // 종류 힌트
  차: ["차"],
  스무디: ["스무디"],
  에이드: ["에이드"],
  케이크: ["케이크"],
  빵: ["빵"],
  과자: ["쿠키"],
  쿠키: ["쿠키"],
}

/** All keyword strings that actually exist on menu items. */
const ALL_KEYWORDS = Array.from(new Set(menuItems.flatMap((i) => i.keywords)))

/**
 * Pull canonical menu keywords out of a free-form spoken sentence.
 * Works two ways: (1) any menu keyword literally present, and
 * (2) any natural synonym the user used, mapped onto menu keywords.
 */
export function extractKeywords(utterance: string): string[] {
  const text = utterance.replace(/\s+/g, "")
  const found = new Set<string>()

  // literal menu keywords spoken directly
  for (const kw of ALL_KEYWORDS) {
    if (text.includes(kw)) found.add(kw)
  }
  // natural synonyms mapped to canonical keywords
  for (const [variant, mapped] of Object.entries(SYNONYMS)) {
    if (text.includes(variant)) mapped.forEach((m) => found.add(m))
  }

  return Array.from(found)
}

export interface MatchResult {
  item: MenuItem
  score: number
  /** which keywords on this item the user actually hit */
  matchedKeywords: string[]
}

/**
 * Keyword-centric menu matching. We extract keywords from whatever the user
 * said and score each menu item by how many of those keywords it carries.
 * No fixed phrasing required and no external AI call, so it runs fully
 * hands-free in the browser.
 */
export function matchMenu(utterance: string, limit = 3): MatchResult[] {
  if (!utterance.trim()) return []
  const text = utterance.replace(/\s+/g, "")
  const heard = new Set(extractKeywords(utterance))

  const results: MatchResult[] = menuItems.map((item) => {
    let score = 0
    const matchedKeywords: string[] = []

    // direct menu-name hit is the strongest signal
    const compactName = item.name.replace(/\s+/g, "")
    if (text.includes(compactName)) score += 8

    item.keywords.forEach((kw) => {
      if (heard.has(kw)) {
        score += 2
        matchedKeywords.push(kw)
      }
    })

    return { item, score, matchedKeywords }
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
