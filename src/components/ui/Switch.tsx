export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={disabled ? undefined : onChange}
      className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ease-in-out after:absolute after:-inset-2 after:content-[''] ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${checked ? "bg-accent" : "bg-surface-3"}`}
    >
      <span
        className={`pointer-events-none inline-block size-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out mt-1 ml-1 ${
          checked ? "bg-on-accent translate-x-5" : "bg-muted translate-x-0"
        }`}
      />
    </button>
  );
}
