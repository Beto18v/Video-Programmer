import type { HTMLAttributes, ReactNode } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "success" | "warning" | "error" | "neutral";
  children: ReactNode;
}

const Badge = ({
  variant = "neutral",
  children,
  className = "",
  ...props
}: BadgeProps) => {
  const variantStyles = {
    primary: "badge-primary",
    success: "badge-success",
    warning: "badge-warning",
    error: "badge-error",
    neutral: "bg-dark-700 text-gray-300 border border-dark-600",
  };

  return (
    <span className={`badge ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

export default Badge;
