"use client";
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "brand" | "outline" | "ghost" | "whatsapp" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "brand", size = "md", loading, className, children, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

    const variants = {
      brand: "bg-[#F97316] hover:bg-[#EA6C0A] text-white shadow-[0_4px_20px_rgba(249,115,22,0.3)] hover:shadow-[0_8px_32px_rgba(249,115,22,0.4)]",
      outline: "border-2 border-[#F97316] text-[#F97316] hover:bg-[#F97316] hover:text-white",
      ghost: "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
      whatsapp: "bg-[#25D366] hover:bg-[#22c55e] text-white shadow-[0_4px_20px_rgba(37,211,102,0.35)]",
      danger: "bg-red-500 hover:bg-red-600 text-white",
    };

    const sizes = {
      sm: "text-sm px-4 py-2",
      md: "text-sm px-6 py-3",
      lg: "text-base px-8 py-4",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
