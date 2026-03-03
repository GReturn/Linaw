import React, { createContext, useContext, useState } from "react";

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    showImage: true,
    showEnglish: true,
    showLanguageContext: true,
    askBeforeDefining: true,
  });

  const toggleSetting = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, toggleSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};