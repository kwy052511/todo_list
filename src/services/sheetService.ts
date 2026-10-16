import { MemoItem, MemoCategory, MemoColor } from "@/types/memo";
import { formatMemoDate } from "@/utils/memoUtils";

const SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "";

/**
 * 구글 시트에서 전체 메모 조회 (GET)
 */
export async function fetchMemosFromSheet(): Promise<MemoItem[]> {
  if (!SCRIPT_URL) return [];
  try {
    const res = await fetch(`${SCRIPT_URL}?action=read&t=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch memos from sheet");
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) return [];

    return json.data.map((item: Record<string, unknown>, idx: number) => {
      const ts = Number(item.timestamp) || Date.now();
      return {
        id: String(item.timestamp || ts),
        content: String(item.content || ""),
        category: (item.category as MemoCategory) || "할 일",
        color: (item.color as MemoColor) || "yellow",
        state: item.state === "completed" ? "completed" : "active",
        order: Number(item.order ?? idx),
        createdAt: ts,
        datetime: item.datetime ? String(item.datetime) : formatMemoDate(ts),
        sheetRecordedAt: item.sheetRecordedAt ? String(item.sheetRecordedAt) : undefined,
      };
    });
  } catch (err) {
    console.error("Error in fetchMemosFromSheet:", err);
    return [];
  }
}

/**
 * 구글 시트에 새 메모 저장 (POST action: 'create')
 */
export async function saveMemoToSheet(memo: {
  timestamp: string;
  datetime: string;
  category: string;
  content: string;
  color: string;
  state: string;
  order: number;
}): Promise<boolean> {
  if (!SCRIPT_URL) return false;
  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "create",
        data: memo,
      }),
    });
    return true;
  } catch (err) {
    console.error("Error in saveMemoToSheet:", err);
    return false;
  }
}

/**
 * 구글 시트 메모 수정 (POST action: 'update')
 */
export async function updateMemoInSheet(memo: {
  timestamp: string;
  category?: string;
  content?: string;
  color?: string;
  state?: string;
  order?: number;
}): Promise<boolean> {
  if (!SCRIPT_URL) return false;
  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "update",
        data: memo,
      }),
    });
    return true;
  } catch (err) {
    console.error("Error in updateMemoInSheet:", err);
    return false;
  }
}

/**
 * 구글 시트 메모 삭제 (POST action: 'delete')
 */
export async function deleteMemoFromSheet(timestamp: string): Promise<boolean> {
  if (!SCRIPT_URL) return false;
  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "delete",
        timestamp,
      }),
    });
    return true;
  } catch (err) {
    console.error("Error in deleteMemoFromSheet:", err);
    return false;
  }
}

/**
 * 구글 시트 메모 순서 일괄 갱신 (POST action: 'reorder')
 */
export async function reorderMemosInSheet(
  orders: { timestamp: string; order: number }[]
): Promise<boolean> {
  if (!SCRIPT_URL) return false;
  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "reorder",
        orders,
      }),
    });
    return true;
  } catch (err) {
    console.error("Error in reorderMemosInSheet:", err);
    return false;
  }
}
