"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "sgr_cookie_consent";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "acknowledged");
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
      <div className="mx-auto flex max-w-2xl flex-col gap-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Wir verwenden nur technisch notwendige Cookies, um den Betrieb der
          Seite zu gewährleisten.{" "}
          <Link
            href="/legal/datenschutz"
            className="font-medium text-blue-600 hover:underline"
          >
            Mehr Infos
          </Link>
        </p>
        <button
          type="button"
          onClick={handleAccept}
          className="self-start rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 sm:self-auto"
        >
          Okay
        </button>
      </div>
    </div>
  );
}
