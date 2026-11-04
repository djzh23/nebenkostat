"use client";

type CalculatorCtaProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "quiet";
};

export function CalculatorCta({ children, className, variant = "quiet" }: CalculatorCtaProps) {
  function onClick(event: React.MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById("rechner");
    const focusTarget = target?.querySelector<HTMLElement>("select, input, button");
    if (!target || !focusTarget) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    window.history.replaceState(null, "", "#rechner");
    window.setTimeout(() => focusTarget.focus({ preventScroll: true }), 250);
  }

  return (
    <a
      href="#rechner"
      onClick={onClick}
      className={`${
        variant === "primary"
          ? "inline-flex min-h-11 items-center justify-center bg-stamp px-5 text-base font-semibold text-paper transition-colors duration-200 hover:bg-stamp-deep active:translate-y-px"
          : "inline-flex min-h-11 items-center justify-center text-base font-semibold text-ink underline decoration-ink/40 decoration-2 underline-offset-[6px] transition-colors duration-200 hover:decoration-stamp"
      } ${className ?? ""}`}
    >
      {children}
    </a>
  );
}
