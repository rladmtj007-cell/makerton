// app/api/recommend/route.js
import { GoogleGenAI } from "@google/genai";
import { menuList } from "@/data/menuList";

export const runtime = "nodejs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL = "gemini-2.5-flash";
const MAX_RECOMMENDATIONS = 3;

const menuByName = new Map(menuList.map((m) => [m.name, m]));

function buildPrompt(userInput) {
  return `
너는 고령층을 위한 AI 키오스크 주문 도우미야.
사용자의 말을 이해해서 아래 메뉴 목록 중 가장 알맞은 메뉴를 최대 ${MAX_RECOMMENDATIONS}개 추천해줘.

조건:
- 사용자가 메뉴명을 정확히 말하지 않아도 의도를 파악해.
- "시원한 거"는 아이스/스무디 계열로 이해해.
- "따뜻한 거"는 따뜻한 음료로 이해해.
- "노란색 차"는 유자차로 이해해.
- "달달한 커피"는 바닐라라떼로 이해해.
- 반드시 메뉴 목록 안에 있는 "name" 값만 그대로 사용해. 새로 지어내지 마.
- JSON 배열만 반환해.
- 마크다운, 코드블록, 설명 문장은 절대 쓰지 마.

메뉴 목록:
${JSON.stringify(menuList, null, 2)}

사용자 발화:
"${userInput}"

출력 형식 (name과 reason만 채워):
[
  { "name": "메뉴명", "reason": "추천 이유" }
]
`;
}

function extractJsonArray(text) {
  const cleaned = (text ?? "").replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        /* fall through */
      }
    }
  }
  return null;
}

function sanitizeRecommendations(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const result = [];
  for (const item of raw) {
    if (!item || typeof item.name !== "string") continue;
    const menu = menuByName.get(item.name.trim());
    if (!menu) continue;
    if (seen.has(menu.name)) continue;
    seen.add(menu.name);
    result.push({
      name: menu.name,
      description: menu.description,
      price: menu.price,
      reason: typeof item.reason === "string" ? item.reason : "",
    });
    if (result.length >= MAX_RECOMMENDATIONS) break;
  }
  return result;
}

export async function POST(req) {
  let userInput;
  try {
    const body = await req.json();
    userInput = body?.userInput;
  } catch {
    return Response.json(
      { success: false, recommendations: [], error: "잘못된 요청이에요." },
      { status: 400 }
    );
  }

  if (typeof userInput !== "string" || userInput.trim() === "") {
    return Response.json(
      { success: false, recommendations: [], error: "음성이 인식되지 않았어요. 다시 한 번 말씀해 주세요." },
      { status: 400 }
    );
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(userInput.trim()),
    });

    const parsed = extractJsonArray(response.text);
    if (parsed === null) {
      return Response.json(
        { success: false, recommendations: [], error: "추천을 만드는 데 실패했어요. 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    const recommendations = sanitizeRecommendations(parsed);
    return Response.json({ success: true, recommendations });
  } catch (error) {
    console.error("[recommend] Gemini 호출 실패:", error);
    return Response.json(
      { success: false, recommendations: [], error: "잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}