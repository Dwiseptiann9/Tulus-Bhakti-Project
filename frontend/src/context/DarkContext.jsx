import { createContext, useContext, useEffect, useState } from "react";

const DarkContext = createContext(null);

export function DarkProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("pdd_dark");
    if (saved !== null) return saved === "1";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    localStorage.setItem("pdd_dark", dark ? "1" : "0");
    document.body.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <DarkContext.Provider value={{ dark, toggleDark: () => setDark((d) => !d) }}>
      {children}
    </DarkContext.Provider>
  );
}

export const useDark = () => useContext(DarkContext);
