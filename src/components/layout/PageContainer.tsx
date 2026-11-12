import { type ReactNode } from "react";

export function PageContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-md px-5 md:max-w-2xl ${className}`.trim()}>
      {children}
    </div>
  );
}