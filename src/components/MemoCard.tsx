"use client";

import React, { useState, useRef, useMemo } from "react";
import { MemoItem, MemoColor, MemoCategory } from "@/types/memo";
import { formatMemoDate, COLOR_STYLES, MEMO_COLORS } from "@/utils/memoUtils";
import { Trash2, Edit3, Check, X, ChevronLeft, ChevronRight, CheckCircle2, Circle, ChevronDown } from "lucide-react";

interface MemoCardProps {
  memo: MemoItem;
  isNew?: boolean;
  onDelete: (id: string) => void;
  onEdit: (memo: MemoItem) => void;
  onToggleComplete?: (memo: MemoItem) => void;
  index: number;
  totalCount: number;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd: () => void;
  onMoveIndex?: (from: number, to: number) => void;
  onTouchDragStart?: (index: number) => void;
  onTouchDragMove?: (targetIndex: number) => void;
  onTouchDragEnd?: () => void;
  isDragging?: boolean;
}

export default function MemoCard({
  memo,
  isNew = false,
  onDelete,
  onEdit,
  onToggleComplete,
  index,
  totalCount,
  onDragStart,
  onDragOver,
  onDragEnd,
  onMoveIndex,
  onTouchDragStart,
  onTouchDragMove,
  onTouchDragEnd,
  isDragging = false,
}: MemoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(memo.title || "");
  const [editContent, setEditContent] = useState(memo.content);
  const [editCategory, setEditCategory] = useState<MemoCategory>(memo.category);
  const [editColor, setEditColor] = useState<MemoColor>(memo.color);

  const cardRef = useRef<HTMLDivElement>(null);
  const style = COLOR_STYLES[memo.color];
  const isCompleted = memo.state === "completed";

  // 메모 ID 기반 고유한 무작위 기울기 각도 및 접힌 모서리 결정
  const { rotationAngle, foldClass } = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < memo.id.length; i++) {
      hash = (hash << 5) - hash + memo.id.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);

    const angles = [-2.2, -1.5, -0.8, 0.6, 1.3, 2.0, -1.8, 1.7];
    const angle = angles[absHash % angles.length];

    const folds = ["dog-ear-br", "none", "dog-ear-br", "none"];
    const fold = folds[absHash % folds.length];

    return {
      rotationAngle: angle,
      foldClass: fold === "none" ? "" : fold,
    };
  }, [memo.id]);

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    onEdit({
      ...memo,
      title: editTitle.trim() || undefined,
      content: editContent.trim(),
      category: editCategory,
      color: editColor,
      updatedAt: Date.now(),
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(memo.title || "");
    setEditContent(memo.content);
    setEditCategory(memo.category);
    setEditColor(memo.color);
    setIsEditing(false);
  };

  // 모바일 터치 드래그 지원
  const handleTouchStart = () => {
    if (isEditing) return;
    if (onTouchDragStart) onTouchDragStart(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isEditing) return;
    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    const memoCardEl = targetElement?.closest("[data-memo-index]");
    if (memoCardEl) {
      const targetIndex = Number(memoCardEl.getAttribute("data-memo-index"));
      if (!isNaN(targetIndex) && onTouchDragMove) {
        onTouchDragMove(targetIndex);
      }
    }
  };

  const handleTouchEnd = () => {
    if (onTouchDragEnd) onTouchDragEnd();
  };

  return (
    <div
      ref={cardRef}
      data-memo-index={index}
      draggable={!isEditing}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`group relative flex flex-col justify-between rounded-sm p-5 border shadow-sm transition-all duration-200 select-none tape-top cursor-grab active:cursor-grabbing
        ${style.bg} ${style.border} ${foldClass}
        ${isNew ? "animate-stick-on" : "hover:-translate-y-1.5 hover:shadow-md hover:rotate-0"}
        ${isDragging ? "opacity-35 scale-95 border-dashed border-amber-500 shadow-lg" : "opacity-100"}
        ${isCompleted ? "brightness-95 opacity-80" : ""}
      `}
      style={{
        minHeight: "220px",
        touchAction: isEditing ? "auto" : "none",
        transform: isDragging ? undefined : `rotate(${rotationAngle}deg)`,
        // @ts-expect-error custom css variable for stickOn animation
        "--target-rot": `${rotationAngle}deg`,
      }}
    >
      {/* 편집 모드 */}
      {isEditing ? (
        <div className="flex flex-col h-full gap-3 cursor-default" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between gap-2">
            <div className="relative">
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as MemoCategory)}
                className="appearance-none pl-3 pr-7 py-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all cursor-pointer shadow-xs"
              >
                <option value="할 일">할 일</option>
                <option value="아이디어">아이디어</option>
                <option value="기타">기타</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center pointer-events-none text-stone-400 dark:text-stone-500">
                <ChevronDown size={13} />
              </div>
            </div>

            <div className="flex gap-1.5">
              {MEMO_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setEditColor(c)}
                  style={{ backgroundColor: COLOR_STYLES[c].chipBg }}
                  className={`w-4 h-4 rounded-full border transition-transform ${
                    editColor === c ? "scale-125 border-stone-800 dark:border-white shadow-sm" : "border-stone-400/50"
                  }`}
                />
              ))}
            </div>
          </div>

          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={5}
            className="w-full flex-1 text-xs resize-none bg-white/70 dark:bg-stone-800/70 rounded-sm p-2 border border-stone-300/60 dark:border-stone-600 focus:outline-none leading-relaxed"
          />

          <div className="flex justify-end gap-1.5 pt-1">
            <button
              onClick={handleCancelEdit}
              className="p-1 rounded-sm bg-stone-200/80 dark:bg-stone-700/80 hover:bg-stone-300 text-stone-600 dark:text-stone-300 transition-colors"
              title="취소"
            >
              <X size={14} />
            </button>
            <button
              onClick={handleSaveEdit}
              className="p-1 rounded-sm bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              title="저장"
            >
              <Check size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* 일반 보기 모드 */
        <>
          {/* 상단: 체크 완료 버튼 + 카테고리 뱃지 & 액션 버튼 */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {/* 체크버튼: 클릭 시 완료/진행중 토글 */}
              <button
                type="button"
                onClick={() => onToggleComplete && onToggleComplete(memo)}
                className={`p-0.5 rounded transition-transform active:scale-90 cursor-pointer ${
                  isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300"
                }`}
                title={isCompleted ? "완료됨 (클릭하여 취소)" : "완료 체크하기"}
              >
                {isCompleted ? <CheckCircle2 size={16} className="fill-emerald-100 dark:fill-emerald-950" /> : <Circle size={16} />}
              </button>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wide ${style.badgeBg} ${style.badgeText}`}
              >
                #{memo.category}
              </span>

              {isCompleted && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-300 dark:border-emerald-700">
                  완료
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              {/* 모바일/터치 환경을 위한 좌우 순서 이동 버튼 */}
              {onMoveIndex && (
                <div className="sm:hidden flex items-center mr-1 bg-black/5 dark:bg-white/10 rounded-sm">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => onMoveIndex(index, index - 1)}
                    className="p-1 text-stone-500 disabled:opacity-20 hover:text-stone-900"
                    title="앞으로 이동"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={index === totalCount - 1}
                    onClick={() => onMoveIndex(index, index + 1)}
                    className="p-1 text-stone-500 disabled:opacity-20 hover:text-stone-900"
                    title="뒤로 이동"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}

              {/* 편집 버튼 */}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1 rounded text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="편집"
                aria-label="메모 편집"
              >
                <Edit3 size={15} />
              </button>

              {/* 삭제 버튼 */}
              <button
                type="button"
                onClick={() => onDelete(memo.id)}
                className="p-1 rounded text-stone-600 hover:text-red-600 dark:text-stone-300 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                title="삭제"
                aria-label="메모 삭제"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* 중앙: 메모 본문 (완료 상태 시 취소선 적용) */}
          <div className="flex-1 flex flex-col my-1 overflow-hidden">
            <p
              className={`text-xs leading-relaxed whitespace-pre-wrap break-words overflow-y-auto max-h-36 pr-1 custom-scrollbar ${
                isCompleted
                  ? "line-through text-stone-400 dark:text-stone-500"
                  : "text-stone-700 dark:text-stone-300"
              }`}
            >
              {memo.content}
            </p>
          </div>

          {/* 하단: 날짜/시간/요일 표기 (일관된 'YYYY.MM.DD (요일) HH:mm' 포맷) */}
          <div className="pt-3 mt-2 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-[11px] text-stone-400/80 dark:text-stone-500 font-medium">
            <span>{formatMemoDate(memo.createdAt || memo.datetime || Date.now())}</span>
          </div>
        </>
      )}
    </div>
  );
}
