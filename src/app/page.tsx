"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import MemoForm from "@/components/MemoForm";
import MemoCard from "@/components/MemoCard";
import ThemeToggle from "@/components/ThemeToggle";
import { MemoItem, MemoColor, MemoCategory } from "@/types/memo";
import { Filter, Layers, CheckCircle2, ChevronDown, CheckSquare, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";
import {
  fetchMemosFromSheet,
  saveMemoToSheet,
  updateMemoInSheet,
  deleteMemoFromSheet,
  reorderMemosInSheet,
} from "@/services/sheetService";
import { formatMemoDate } from "@/utils/memoUtils";

export default function Home() {
  const [memos, setMemos] = useState<MemoItem[]>([]);
  const [newMemoId, setNewMemoId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("전체");
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Drag and Drop state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDraggingIndex, setIsDraggingIndex] = useState<number | null>(null);

  // 구글 시트에서 최신 데이터 불러오기
  const loadMemos = useCallback(async () => {
    setIsSyncing(true);
    try {
      const sheetMemos = await fetchMemosFromSheet();
      if (sheetMemos && sheetMemos.length > 0) {
        setMemos(sheetMemos);
        localStorage.setItem("nodememo_items", JSON.stringify(sheetMemos));
      } else {
        // 시트가 비어있으면 로컬스토리지 백업 데이터 확인
        const local = localStorage.getItem("nodememo_items");
        if (local) {
          try {
            setMemos(JSON.parse(local));
          } catch {
            setMemos([]);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load from sheet", e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // 마운트 시 데이터 로드
  useEffect(() => {
    setMounted(true);
    // 1. 빠른 초기 화면 렌더링을 위해 로컬스토리지 먼저 표시
    const local = localStorage.getItem("nodememo_items");
    if (local) {
      try {
        setMemos(JSON.parse(local));
      } catch {
        setMemos([]);
      }
    }
    // 2. 구글 시트 최신 데이터 비동기 동기화
    loadMemos();
  }, [loadMemos]);

  // 로컬스토리지 자동 캐싱
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("nodememo_items", JSON.stringify(memos));
    }
  }, [memos, mounted]);

  // 1. CREATE: 메모 저장 ([포스트잇 착! 붙이기])
  const handleAddMemo = async (newMemoData: {
    content: string;
    color: MemoColor;
    category: MemoCategory;
  }) => {
    setIsSaving(true);
    const ts = Date.now();
    const newId = String(ts);
    const dateFormatted = formatMemoDate(ts);

    const newMemo: MemoItem = {
      id: newId,
      content: newMemoData.content,
      color: newMemoData.color,
      category: newMemoData.category,
      state: "active",
      order: 0,
      createdAt: ts,
      datetime: dateFormatted,
    };

    // UI 즉시 반영 (새 메모는 1, 이후 메모들은 2, 3...)
    const updated = [newMemo, ...memos].map((m, idx) => ({ ...m, order: idx + 1 }));
    setMemos(updated);
    setNewMemoId(newId);

    // 파스텔 축하 폭죽
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.35 },
      colors: ["#FDE047", "#FBCFE8", "#BBF7D0", "#BAE6FD", "#F59E0B"],
    });

    setTimeout(() => {
      setNewMemoId(null);
    }, 1000);

    // 구글 시트에 전송 (새 메모는 order 1)
    await saveMemoToSheet({
      timestamp: newId,
      datetime: dateFormatted,
      category: newMemoData.category,
      content: newMemoData.content,
      color: newMemoData.color,
      state: "active",
      order: 1,
    });
    setIsSaving(false);
  };

  // 2. DELETE: 메모 삭제
  const handleDeleteMemo = async (id: string) => {
    // UI 즉시 반영 (남은 메모 1, 2, 3 순서 재정돈)
    setMemos((prev) =>
      prev.filter((m) => m.id !== id).map((m, idx) => ({ ...m, order: idx + 1 }))
    );
    // 구글 시트 삭제 전송
    await deleteMemoFromSheet(id);
  };

  // 3. UPDATE: 메모 수정
  const handleEditMemo = async (updatedMemo: MemoItem) => {
    // UI 즉시 반영
    setMemos((prev) =>
      prev.map((m) => (m.id === updatedMemo.id ? updatedMemo : m))
    );
    // 구글 시트 수정 전송
    await updateMemoInSheet({
      timestamp: updatedMemo.id,
      category: updatedMemo.category,
      content: updatedMemo.content,
      color: updatedMemo.color,
      state: updatedMemo.state,
      order: updatedMemo.order,
    });
  };

  // 4. CHECK TOGGLE: 체크버튼 클릭 시 완료(completed) / 진행중(active) 토글
  const handleToggleComplete = async (memo: MemoItem) => {
    const nextState = memo.state === "completed" ? "active" : "completed";
    const updatedMemo: MemoItem = {
      ...memo,
      state: nextState,
    };

    // UI 즉시 반영
    setMemos((prev) =>
      prev.map((m) => (m.id === memo.id ? updatedMemo : m))
    );

    // 완료 시 축하 이펙트
    if (nextState === "completed") {
      confetti({
        particleCount: 18,
        spread: 45,
        origin: { y: 0.6 },
        colors: ["#BBF7D0", "#10B981", "#34D399"],
      });
    }

    // 구글 시트에 업데이트 전송
    await updateMemoInSheet({
      timestamp: memo.id,
      state: nextState,
    });
  };

  // 5. REORDER: 드래그 앤 드롭 및 순서 이동 (1, 2, 3... 1-based 순서)
  const handleMoveIndex = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= memos.length) return;
    const copy = [...memos];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);

    // order 필드 1부터 순차적으로 재계산
    const reordered = copy.map((m, idx) => ({ ...m, order: idx + 1 }));
    setMemos(reordered);

    // 구글 시트 순서 일괄 갱신 전송
    await reorderMemosInSheet(
      reordered.map((m) => ({ timestamp: m.id, order: m.order }))
    );
  };

  // 데스크톱 Drag and Drop 핸들러
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    setIsDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (
      dragItem.current !== null &&
      dragOverItem.current !== null &&
      dragItem.current !== dragOverItem.current
    ) {
      handleMoveIndex(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setIsDraggingIndex(null);
  };

  // 터치 기반 모바일 드래그 핸들러
  const handleTouchDragStart = (index: number) => {
    dragItem.current = index;
    setIsDraggingIndex(index);
  };

  const handleTouchDragMove = (targetIndex: number) => {
    dragOverItem.current = targetIndex;
  };

  const handleTouchDragEnd = () => {
    if (
      dragItem.current !== null &&
      dragOverItem.current !== null &&
      dragItem.current !== dragOverItem.current
    ) {
      handleMoveIndex(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setIsDraggingIndex(null);
  };

  // 필터링 적용된 메모 리스트
  const filteredMemos =
    categoryFilter === "전체"
      ? memos
      : memos.filter((m) => m.category === categoryFilter);

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-amber-200 selection:text-amber-950">
      {/* 상단 네비게이션 / 동기화 및 테마 토글 */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={loadMemos}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-700 bg-white/80 dark:bg-stone-800/80 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="구글 시트와 즉시 동기화"
          >
            <RefreshCw size={13} className={isSyncing ? "animate-spin text-amber-500" : ""} />
            <span>{isSyncing ? "동기화 중..." : "구글 시트 동기화"}</span>
          </button>
        </div>
        <ThemeToggle />
      </header>

      {/* 중앙 메인 컨테이너 */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-20 flex-1">
        {/* 서비스 타이틀 영역 */}
        <div className="flex flex-col items-center justify-center pt-2 pb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-white shadow-md mb-3 transform hover:rotate-6 transition-transform">
            <CheckSquare size={26} strokeWidth={2.3} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#382416] dark:text-[#F5F5F4]">
            Post-it Todo List
          </h1>
        </div>

        {/* 메모 작성 영역 */}
        <section className="mb-14">
          <MemoForm
            onAddMemo={handleAddMemo}
            isSaving={isSaving}
          />
        </section>

        {/* 메모 보드 헤더: 제목, 카테고리 필터 드롭다운, 메모 개수 */}
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Layers size={17} className="text-amber-500 dark:text-amber-400" />
              <h2 className="text-base sm:text-lg font-bold text-stone-800 dark:text-stone-200">
                저장된 메모지 보드
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              {filteredMemos.length}개
            </span>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {/* 카테고리 필터 */}
            <div className="relative min-w-[125px]">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-amber-500">
                <Filter size={13} className="stroke-[2.2]" />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full appearance-none pl-7 pr-7 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 font-medium text-[12px] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all cursor-pointer shadow-xs"
              >
                <option value="전체">전체 카테고리</option>
                <option value="할 일">할 일</option>
                <option value="아이디어">아이디어</option>
                <option value="기타">기타</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-stone-400 dark:text-stone-500">
                <ChevronDown size={13} />
              </div>
            </div>
          </div>
        </section>

        {/* 메모 그리드: 1개 행에 정확히 4개 카드 (lg:grid-cols-4), 태블릿 2열, 모바일 1열 */}
        {filteredMemos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border-2 border-dashed border-stone-200 dark:border-stone-800 bg-white/40 dark:bg-stone-900/40">
            <p className="text-stone-500 dark:text-stone-400 text-sm font-semibold mb-1">
              저장된 메모가 없습니다.
            </p>
            <p className="text-stone-400 dark:text-stone-500 text-xs">
              상단 입력창에서 생각을 적고 첫 번째 포스트잇을 붙여보세요!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredMemos.map((memo, index) => (
              <MemoCard
                key={memo.id}
                memo={memo}
                index={index}
                totalCount={filteredMemos.length}
                isNew={memo.id === newMemoId}
                isDragging={isDraggingIndex === index}
                onDelete={handleDeleteMemo}
                onEdit={handleEditMemo}
                onToggleComplete={handleToggleComplete}
                onMoveIndex={handleMoveIndex}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onTouchDragStart={handleTouchDragStart}
                onTouchDragMove={handleTouchDragMove}
                onTouchDragEnd={handleTouchDragEnd}
              />
            ))}
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="w-full border-t border-stone-200/80 dark:border-stone-800/80 py-6 text-center text-xs text-stone-500 dark:text-stone-400 bg-stone-100/40 dark:bg-stone-900/40">
        <p className="font-medium">Copyright INU Post-it Todo List by Wooyoung Kwon</p>
      </footer>
    </div>
  );
}
