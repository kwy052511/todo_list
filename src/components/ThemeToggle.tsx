"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 기본은 라이트 모드 (localStorage에 'dark'로 저장되어 있을 때만 다크)
    const storedTheme = localStorage.getItem("node_memo_theme");
    if (storedTheme === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("node_memo_theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("node_memo_theme", "dark");
      setIsDark(true);
    }
  };

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-stone-200/50 dark:bg-stone-800/50" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="flex items-center justify-center w-10 h-10 rounded-full border border-stone-200 dark:border-stone-700 bg-white/80 dark:bg-stone-800/80 shadow-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all cursor-pointer"
      title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      aria-label="테마 전환"
    >
      {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-stone-600" />}
    </button>
  );
}
