import { MemoColor } from "@/types/memo";

// 요일 한글 배열
const KOREAN_DAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

/**
 * 타임스탬프 또는 날짜 문자열을 일관된 포맷으로 변환:
 * YYYY.MM.DD (요일) HH:mm
 */
export function formatMemoDate(input: number | string | Date): string {
  let date: Date;

  if (typeof input === "number") {
    date = new Date(input);
  } else if (input instanceof Date) {
    date = input;
  } else {
    // 문자열인 경우: 숫자 타임스탬프 문자열인지 확인
    const parsedNum = Number(input);
    if (!isNaN(parsedNum) && parsedNum > 100000000000) {
      date = new Date(parsedNum);
    } else {
      // 일반 날짜 문자열 파싱 시도
      date = new Date(input);
      if (isNaN(date.getTime())) {
        // "2026. 10. 16. 오후 9:52:37" 같은 한국어 포맷 파싱
        const match = String(input).match(/(\d{4})[^\d]+(\d{1,2})[^\d]+(\d{1,2})/);
        if (match) {
          const y = Number(match[1]);
          const m = Number(match[2]) - 1;
          const d = Number(match[3]);
          date = new Date(y, m, d);
        } else {
          date = new Date();
        }
      }
    }
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const dayName = KOREAN_DAYS[date.getDay()];

  return `${year}.${month}.${day} (${dayName}) ${hours}:${minutes}`;
}

export const MEMO_COLORS: MemoColor[] = ["yellow", "pink", "green", "blue"];

export function getRandomColor(): MemoColor {
  const randomIndex = Math.floor(Math.random() * MEMO_COLORS.length);
  return MEMO_COLORS[randomIndex];
}

export const COLOR_STYLES: Record<
  MemoColor,
  {
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    chipBg: string;
  }
> = {
  yellow: {
    bg: "bg-[#FEF9C3] dark:bg-[#713f12]/35",
    border: "border-[#FDE047] dark:border-[#a16207]/60",
    badgeBg: "bg-amber-100/80 dark:bg-amber-950/70",
    badgeText: "text-amber-800 dark:text-amber-200",
    chipBg: "#FEF08A",
  },
  pink: {
    bg: "bg-[#FCE7F3] dark:bg-[#831843]/35",
    border: "border-[#FBCFE8] dark:border-[#be185d]/60",
    badgeBg: "bg-pink-100/80 dark:bg-pink-950/70",
    badgeText: "text-pink-800 dark:text-pink-200",
    chipBg: "#FBCFE8",
  },
  green: {
    bg: "bg-[#DCFCE7] dark:bg-[#14532d]/35",
    border: "border-[#BBF7D0] dark:border-[#15803d]/60",
    badgeBg: "bg-emerald-100/80 dark:bg-emerald-950/70",
    badgeText: "text-emerald-800 dark:text-emerald-200",
    chipBg: "#BBF7D0",
  },
  blue: {
    bg: "bg-[#E0F2FE] dark:bg-[#0c4a6e]/35",
    border: "border-[#BAE6FD] dark:border-[#0284c7]/60",
    badgeBg: "bg-sky-100/80 dark:bg-sky-950/70",
    badgeText: "text-sky-800 dark:text-sky-200",
    chipBg: "#BAE6FD",
  },
};
