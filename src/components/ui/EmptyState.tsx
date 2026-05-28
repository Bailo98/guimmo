import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="w-20 h-20 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-5">
        <Icon className="w-12 h-12 text-[#D4AF37]" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-6">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="bg-[#D4AF37] hover:bg-[#B8963A] active:bg-[#D96309] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
