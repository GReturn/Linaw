import React, { useState } from "react";
import SettingsHeader from "../components/SettingsHeader";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";

export default function SettingsPage() {
    
  const { settings, toggleSetting } = useSettings();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-[#1f2933] font-sans bg-[radial-gradient(circle_at_20%_20%,rgba(78,205,196,0.08),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(255,217,61,0.06),transparent_45%)] bg-white">
      
      <SettingsHeader />

      <section className="pt-32 pb-24">
        <div className="max-w-5xl mx-auto px-6">

          {/* Title */}
          <div className="mb-16">
            <div className="mb-10">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[#4ECDC4] font-semibold hover:gap-3 transition-all"
            >
                <ArrowLeft size={20} />
                Back
            </button>
            </div>
            <h1 className="text-6xl font-bold tracking-tight">
              Customize your
              <span className="block text-[#4ECDC4]">
                learning experience.
              </span>
            </h1>
            <p className="mt-6 text-2xl text-gray-600 max-w-3xl">
              Control how explanations appear and how Linaw responds when you tap a word.
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-[32px] border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-12 space-y-16">

            {/* Display Section */}
            <SettingsSection title="Explanation Display">

              <SettingToggle
                title="Show English definition"
                description="Display the formal English explanation below the localized explanation."
                enabled={settings.showEnglish}
                onToggle={() => toggleSetting("showEnglish")}
              />

              <SettingToggle
                title="Show language context"
                description="Display the explanation rewritten in the target language for deeper understanding."
                enabled={settings.showLanguageContext}
                onToggle={() => toggleSetting("showLanguageContext")}
              />

              <SettingToggle
                title="Show three words confused with the tapped word"
                description="Display the three most commonly confused words when you tap a word."
                enabled={settings.showConfusedWords}
                onToggle={() => toggleSetting("showConfusedWords")}
              />

            </SettingsSection>

            {/* Interaction Section */}
            <SettingsSection title="Interaction Behavior">

              <SettingToggle
                title="Ask before defining"
                description="Require confirmation before opening the explanation panel."
                enabled={settings.askBeforeDefining}
                onToggle={() => toggleSetting("askBeforeDefining")}
              />

            </SettingsSection>

          </div>
        </div>
      </section>
    </div>
  );
}


function SettingsSection({ title, children }) {
  return (
    <div>
      <h2 className="text-3xl font-black mb-8 text-[#2D3748] relative inline-block">
        {title}
        <span className="absolute -bottom-3 left-0 w-16 h-2 bg-[#FFD93D] rounded-full"></span>
      </h2>

      <div className="space-y-8 mt-12">
        {children}
      </div>
    </div>
  );
}


function SettingToggle({ title, description, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between bg-white border-2 border-gray-100 rounded-3xl p-7 hover:shadow-lg transition-all">

      <div className="max-w-lg">
        <h3 className="text-xl font-bold text-[#2D3748]">{title}</h3>
        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
          {description}
        </p>
      </div>

      <button
        onClick={onToggle}
        className={`
            relative w-16 h-10 rounded-full transition-all duration-300
            ${enabled
            ? "bg-[#4ECDC4] shadow-[0_6px_0_#2b9e96]"
            : "bg-[#FF6B6B] shadow-[0_6px_0_#d32f2f]"
            }
            p-[3px]
            active:translate-y-[3px] active:shadow-none
        `}
        >
        <div className="w-full h-full bg-gray-200 rounded-full relative">
            <span
            className={`
                absolute top-1 left-1 w-7 h-7 bg-white rounded-full shadow-md
                transform transition-transform duration-300
                ${enabled ? "translate-x-7" : ""}
            `}
            />
        </div>
        </button>
    </div>
  );
}