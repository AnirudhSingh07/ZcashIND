"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/** Indian languages (+ English) offered in the dropdown. Codes are Google's. */
const LANGUAGES: { code: string; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "or", label: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "as", label: "Assamese", native: "অসমীয়া" },
  { code: "ur", label: "Urdu", native: "اردو" },
];

const INCLUDED = LANGUAGES.map((l) => l.code).join(",");
const COOKIE = "googtrans";

declare global {
  interface Window {
    google?: { translate?: { TranslateElement?: new (opts: object, el: string) => void } };
    googleTranslateElementInit?: () => void;
  }
}

function readCookieLang(): string {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (!m) return "en";
  const parts = decodeURIComponent(m[1]).split("/"); // "/en/hi"
  return parts[2] || "en";
}

function setCookie(lang: string) {
  const value = lang === "en" ? "" : `/en/${lang}`;
  // clear then set on the current host (localhost + prod both work with path=/)
  document.cookie = `${COOKIE}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  if (value) document.cookie = `${COOKIE}=${value};path=/`;
}

/** Apply the selected language via Google's hidden <select class="goog-te-combo">. */
function applyToCombo(lang: string): boolean {
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!combo) return false;
  combo.value = lang === "en" ? "" : lang;
  combo.dispatchEvent(new Event("change"));
  return true;
}

export function LanguageSwitcher() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Inject the Google Website Translator script once.
  useEffect(() => {
    setLang(readCookieLang());

    if (window.google?.translate?.TranslateElement) {
      setReady(true);
      return;
    }
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          { pageLanguage: "en", includedLanguages: INCLUDED, autoDisplay: false },
          "google_translate_element",
        );
        setReady(true);
      }
    };
    if (!document.querySelector("#google-translate-script")) {
      const s = document.createElement("script");
      s.id = "google-translate-script";
      s.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  // Re-apply the chosen language after client-side navigation (new DOM mounts).
  useEffect(() => {
    if (lang === "en") return;
    let tries = 0;
    const t = setInterval(() => {
      if (applyToCombo(lang) || ++tries > 20) clearInterval(t);
    }, 250);
    return () => clearInterval(t);
  }, [pathname, lang, ready]);

  // Close dropdown on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function choose(code: string) {
    setLang(code);
    setOpen(false);
    setCookie(code);
    if (code === "en") {
      // Google has no clean in-place "undo"; a reload restores the source text.
      window.location.reload();
      return;
    }
    if (!applyToCombo(code)) {
      // Widget not ready yet — cookie is set, so a reload will apply it.
      window.location.reload();
    }
  }

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    // notranslate: keep the switcher's own labels out of Google's translation.
    <div ref={wrapRef} className="notranslate relative" translate="no">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Change language"
        className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-gold/50 hover:text-gold"
      >
        <span aria-hidden>🌐</span>
        <span className="max-w-[7rem] truncate">{current.native}</span>
        <span aria-hidden className="text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 max-h-[70vh] w-48 overflow-y-auto rounded-2xl border border-line bg-surface py-1 shadow-xl">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => choose(l.code)}
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-surface-2 ${
                l.code === lang ? "text-gold" : "text-muted hover:text-gold"
              }`}
            >
              <span>{l.native}</span>
              <span className="text-xs text-muted/50">{l.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Hidden mount point for the Google widget */}
      <div id="google_translate_element" className="hidden" aria-hidden />
    </div>
  );
}
