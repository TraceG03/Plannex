import * as React from "react";
import clsx from "clsx";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={clsx(
        "h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm",
        "placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        className
      )}
      {...props}
    />
  );
});

