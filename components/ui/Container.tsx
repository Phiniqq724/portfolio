import type { ElementType, ReactNode } from "react";

type Props = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  id?: string;
};

/** Page-width wrapper. 1400px cap, fluid side gutter. */
export function Container({ as: Tag = "div", className = "", children, id }: Props) {
  return (
    <Tag id={id} className={`mx-auto w-full max-w-[1400px] px-gutter ${className}`}>
      {children}
    </Tag>
  );
}
