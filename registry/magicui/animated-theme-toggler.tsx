"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "portfolio-theme-mode";
const THEME_EVENT = "portfolio-theme-change";

function readTheme(): ThemeMode {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

// The server has no access to the saved theme, so it always renders dark
const getServerTheme = (): ThemeMode => "dark";

function subscribe(onChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

function syncDom(theme: ThemeMode) {
  const isLight = theme === "light";
  document.body.classList.toggle("light-mode", isLight);
  document.documentElement.classList.toggle("light-mode", isLight);
}

function saveTheme(theme: ThemeMode) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme } }));
}

export function AnimatedThemeToggler() {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerTheme);

  useEffect(() => {
    syncDom(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    saveTheme(theme === "light" ? "dark" : "light");
  }, [theme]);

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle-btn relative overflow-hidden"
      aria-label="Toggle theme"
      aria-pressed={isLight}
    >
      <motion.span
        className="absolute inset-0 rounded-full"
        initial={false}
        animate={{
          backgroundColor: isLight ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.2)",
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      />
      <motion.span
        className="relative z-10 flex items-center justify-center"
        initial={false}
        animate={{ rotate: isLight ? 0 : 180, scale: isLight ? 1 : 0.95 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
      >
        {isLight ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </motion.span>
    </button>
  );
}
