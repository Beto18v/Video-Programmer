import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: ReactNode;
}

const Card = ({
  interactive = false,
  children,
  className = "",
  ...props
}: CardProps) => {
  const cardClass = interactive ? "card-interactive" : "card";

  return (
    <div className={`${cardClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
