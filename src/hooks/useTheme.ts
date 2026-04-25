"use client";
import { useEffect, useState } from "react";

const THEME_KEY = "chess_theme";

export function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as "dark" | "light" | null;
    const initial = saved ?? "dark";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };

  return { theme, toggle };
}

function applyTheme(t: "dark" | "light") {
  const html = document.documentElement;
  if (t === "light") {
    html.classList.add("light");
    html.classList.remove("dark");
  } else {
    html.classList.remove("light");
    html.classList.add("dark");
  }
}
