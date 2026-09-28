import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "quiet";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

export function Button({ variant = "primary", icon, children, className = "", ...rest }: Props) {
  return (
    <button type="button" className={`btn btn--${variant} ${className}`} {...rest}>
      {icon}
      <span>{children}</span>
    </button>
  );
}
