import React from "react";

export function Button({
  className = "",
  variant = "default",
  size = "default",
  children,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-md font-medium transition disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800",
    outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
  };

  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-9 px-3 text-sm",
    lg: "h-11 px-8 text-base"
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
