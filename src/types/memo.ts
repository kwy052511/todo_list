export type MemoColor = "yellow" | "pink" | "green" | "blue";
export type MemoCategory = "할 일" | "아이디어" | "기타";

export interface MemoItem {
  id: string; // timestamp (고유 식별자)
  datetime?: string; // 메모생성날짜및시간
  sheetRecordedAt?: string; // 시트기록날짜및시간
  title?: string;
  content: string;
  color: MemoColor;
  category: MemoCategory;
  state: "active" | "completed"; // 체크버튼 완료 여부 ('completed' 또는 'active')
  order: number; // 메모순서
  createdAt: number;
  updatedAt?: number;
}
