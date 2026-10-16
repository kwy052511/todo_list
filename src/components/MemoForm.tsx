"use client";

import React, { useState } from "react";
import { MemoColor, MemoCategory } from "@/types/memo";
import { getRandomColor } from "@/utils/memoUtils";
import { Tag, ChevronDown, Plus } from "lucide-react";

interface MemoFormProps {
  onAddMemo: (memo: {
    content: string;
    color: MemoColor;
    category: MemoCategory;
  }) => void;
  isSaving?: boolean;
}

export default function MemoForm({ onAddMemo, isSaving = false }: MemoFormProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("전체");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || isSaving) return;

    // 무작위로 메모지 컬러 배정
    const color = getRandomColor();
    // '전체'가 선택된 상태에서 작성 시 기본값 '할 일'로 저장
    const assignedCategory: MemoCategory =
      category === "전체" ? "할 일" : (category as MemoCategory);

    onAddMemo({
      content: content.trim(),
      color,
      category: assignedCategory,
    });

    // 폼 초기화
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl mx-auto bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-100 dark:border-stone-800 shadow-[0_10px_35px_-8px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_-8px_rgba(0,0,0,0.3)] transition-all duration-300"
    >
      <div className="flex flex-col gap-5">
        {/* 1. 카테고리 선택 영역 */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="memo-category"
            className="text-sm font-bold text-stone-800 dark:text-stone-200"
          >
            카테고리
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-500">
              <Tag size={17} className="stroke-[2.2]" />
            </div>
            <select
              id="memo-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none pl-10 pr-10 py-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all cursor-pointer shadow-xs"
            >
              <option value="전체">#전체</option>
              <option value="할 일">#할 일</option>
              <option value="아이디어">#아이디어</option>
              <option value="기타">#기타</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-400 dark:text-stone-500">
              <ChevronDown size={18} />
            </div>
          </div>
        </div>

        {/* 2. 메모 내용 입력 영역 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-stone-800 dark:text-stone-200">
            메모 내용
          </label>
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-3.5 focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-amber-400 transition-all shadow-xs">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="생각을 기록해보세요..."
              rows={4}
              className="w-full text-sm text-stone-700 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 bg-transparent border-none outline-none focus:ring-0 px-1 py-1 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* 3. 하단 저장 버튼 */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={!content.trim() || isSaving}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus size={18} strokeWidth={2.6} />
            <span>{isSaving ? "구글 시트 저장 중..." : "포스트잇 착! 붙이기"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
