import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/settings");
      setSettings(data);
    } catch {
      setSettings({ site_name: "Portal Desa Digital", season_theme: "netral" });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const theme = settings?.season_theme || "netral";
    document.body.classList.remove("theme-netral", "theme-lebaran", "theme-agustus17");
    document.body.classList.add(`theme-${theme}`);
  }, [settings?.season_theme]);

  return (
    <SettingsContext.Provider value={{ settings: settings || {}, reloadSettings: load }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
