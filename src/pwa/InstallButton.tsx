import { useState } from "react";
import { Download } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { installStrings as S } from "./installStrings";
import { IN_APP_BROWSER } from "./pwaInstall";

const PANEL_ID = "pwa-install-ios-panel";

export function InstallButton() {
  const { canInstall, isIos, isStandalone, promptInstall } = usePwaInstall();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isStandalone) return null;

  if (isIos) {
    const inApp = IN_APP_BROWSER.test(navigator.userAgent);
    return (
      <div className="w-full">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={PANEL_ID}
          onClick={() => setExpanded((v) => !v)}
          className="min-h-10 w-full rounded-full inline-flex items-center justify-center gap-2 bg-accent text-on-accent px-4 py-2 text-sm font-medium cursor-pointer"
        >
          <Download className="size-4 shrink-0" />
          <span>{expanded ? S.hideInstructions : S.installApp}</span>
          <svg
            className={`size-4 shrink-0 transition-transform motion-reduce:transition-none ${
              expanded ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <div
          id={PANEL_ID}
          className={`overflow-hidden transition-[max-height,opacity] duration-300 motion-reduce:transition-none ${
            expanded ? "max-h-[1000px] opacity-100 mt-3" : "max-h-0 opacity-0"
          }`}
        >
          <div className="rounded-2xl border border-line bg-surface-2 p-4 text-sm">
            {inApp ? (
              <div className="space-y-3">
                <p className="font-medium">{S.inAppTitle}</p>
                <p className="text-muted">{S.inAppBody}</p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      // ignore
                    }
                  }}
                  className="rounded-full bg-surface-3 px-4 py-2 text-sm"
                >
                  {copied ? S.copied : S.copyLink}
                </button>
              </div>
            ) : null}

            <ol className="space-y-3">
              {inApp ? (
                <li className="flex items-start gap-3">
                  <StepIconOpen />
                  <div>
                    <span className="font-medium">1. </span>
                    {S.inAppTitle}
                  </div>
                </li>
              ) : (
                <li className="flex items-start gap-3">
                  <StepIconShare />
                  <div>
                    <span className="font-medium">1. </span>
                    {S.steps.share}
                    <div className="text-xs text-muted mt-1">
                      {S.steps.shareDetailIphone}
                    </div>
                    <div className="text-xs text-muted">
                      {S.steps.shareDetailIpad}
                    </div>
                  </div>
                </li>
              )}
              <li className="flex items-start gap-3">
                <StepIconAdd />
                <div>
                  <span className="font-medium">2. </span>
                  {S.steps.add}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <StepIconConfirm />
                <div>
                  <span className="font-medium">3. </span>
                  {S.steps.confirm}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <StepIconOpen />
                <div>
                  <span className="font-medium">4. </span>
                  {S.steps.open}
                </div>
              </li>
            </ol>

            <p className="mt-3 text-xs text-muted">{S.footer}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!canInstall) return null;

  return (
    <button
      type="button"
      onClick={() => void promptInstall()}
      className="min-h-10 w-full rounded-full inline-flex items-center justify-center gap-2 bg-accent text-on-accent px-4 py-2 text-sm font-medium cursor-pointer"
    >
      <Download className="size-4 shrink-0" />
      {S.androidButton}
    </button>
  );
}

function StepIconShare() {
  return (
    <svg className="size-5 shrink-0 text-muted mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
function StepIconAdd() {
  return (
    <svg className="size-5 shrink-0 text-muted mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}
function StepIconConfirm() {
  return (
    <svg className="size-5 shrink-0 text-muted mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function StepIconOpen() {
  return (
    <svg className="size-5 shrink-0 text-muted mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2v20M2 12h20" />
    </svg>
  );
}