import { useEffect } from "react";
import { APP_NAME, APP_TAGLINE } from "@/lib/app";

export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title
      ? `${title} · ${APP_NAME}`
      : `${APP_NAME}: ${APP_TAGLINE}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}