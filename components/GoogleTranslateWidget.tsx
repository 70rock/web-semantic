"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function GoogleTranslateWidget() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    
    const script = document.createElement("script");
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

   
    // @ts-ignore
    window.googleTranslateElementInit = function () {
      // @ts-ignore
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "es",
          includedLanguages: "en,es,fr",
          // @ts-ignore
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        "google_translate_element"
      );
    };

    // Limpieza
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // @ts-ignore
      delete window.googleTranslateElementInit;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      id="google_translate_element"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
      }}
    />,
    document.body
  );
} 