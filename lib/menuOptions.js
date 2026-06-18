// lib/menuOptions.js
import { menuList } from "@/data/menuList";

// 카테고리별 기본 옵션 그룹 (한 메뉴가 여러 옵션을 가질 수 있어 배열)
const TEMPERATURE_OPTION = {
  id: "temperature",
  question: "따뜻한 걸로 드릴까요, 차가운 걸로 드릴까요?",
  options: ["따뜻하게", "차갑게"],
};

const SIZE_OPTION = {
  id: "size",
  question: "사이즈를 선택해 주세요.",
  options: ["레귤러", "라지"],
};

const OPTION_GROUPS = {
  coffee: [TEMPERATURE_OPTION],
  coldbrew: [TEMPERATURE_OPTION],
  tea: [TEMPERATURE_OPTION],
  beverage: [TEMPERATURE_OPTION],
  smoothie_frappe: [SIZE_OPTION],
  ade_juice: [SIZE_OPTION],
  dessert: [],
};

const menuByName = new Map(menuList.map((m) => [m.name, m]));

// 메뉴에 필요한 모든 옵션 그룹 반환
export function getMenuOptions(menuName) {
  const menu = menuByName.get(menuName);

  if (!menu) {
    return {
      success: false,
      selectedMenu: menuName,
      optionGroups: [],
      error: "메뉴를 찾을 수 없습니다.",
    };
  }

  // 우선순위: 메뉴별 직접 지정 > 카테고리 기본값 > 없음
  const optionGroups = menu.options ?? OPTION_GROUPS[menu.category] ?? [];

  return {
    success: optionGroups.length > 0,
    selectedMenu: menu.name,
    optionGroups,
  };
}

// 단계별 진행용: 이미 고른 옵션(answered)을 넘기면 다음에 물어볼 질문 하나를 반환
export function getNextOptionQuestion(menuName, answered = {}) {
  const { optionGroups } = getMenuOptions(menuName);
  const next = optionGroups.find((group) => !(group.id in answered));

  if (!next) {
    return { done: true, selectedMenu: menuName, answered };
  }

  return {
    done: false,
    selectedMenu: menuName,
    question: next.question,
    optionId: next.id,
    options: next.options,
  };
}