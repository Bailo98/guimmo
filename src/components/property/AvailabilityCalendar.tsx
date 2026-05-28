"use client";

import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  availableNow: boolean;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  // Monday-based: 0=Mon … 6=Sun
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

type DayStatus = "available" | "unavailable" | "past" | "empty";

function getToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function AvailabilityCalendar({ availableNow }: Props) {
  const [today] = useState(getToday);

  const [displayed, setDisplayed] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const { year, month } = displayed;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);

  function getStatus(day: number): DayStatus {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);

    if (date < today) return "past";

    if (!availableNow) {
      // Unavailable for the next 14 days
      if (diffDays < 14) return "unavailable";
      return "available";
    } else {
      // Past 7 days already handled; next 30 available, beyond that neutral
      if (diffDays <= 30) return "available";
      return "past"; // treat far future as neutral/greyed
    }
  }

  function prevMonth() {
    setDisplayed(({ year, month }) => {
      if (month === 0) return { year: year - 1, month: 11 };
      return { year, month: month - 1 };
    });
  }

  function nextMonth() {
    setDisplayed(({ year, month }) => {
      if (month === 11) return { year: year + 1, month: 0 };
      return { year, month: month + 1 };
    });
  }

  // Build grid cells: empty placeholders + day numbers
  const cells: Array<{ day: number | null; status: DayStatus }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, status: "empty" });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, status: getStatus(d) });

  const statusClasses: Record<DayStatus, string> = {
    available:
      "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-[#D4AF37] font-semibold",
    unavailable:
      "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 line-through",
    past:
      "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600",
    empty: "",
  };

  return (
    <div className="bg-[#2c2f36] rounded-2xl p-5 border border-[#1e2a30]">
      {/* Header */}
      <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-[#D4AF37]" />
        Disponibilités
      </h2>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a3040] transition-colors text-slate-500 dark:text-slate-400"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-[#2a3040] transition-colors text-slate-500 dark:text-slate-400"
          aria-label="Mois suivant"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => (
          <div key={i} className="flex items-center justify-center">
            {cell.day !== null ? (
              <span
                className={`w-8 h-8 flex items-center justify-center rounded-full text-xs transition-colors ${statusClasses[cell.status]}`}
              >
                {cell.day}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-[#2a3040]">
        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="w-3 h-3 rounded-full bg-green-100 dark:bg-green-900/30 inline-block" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="w-3 h-3 rounded-full bg-red-100 dark:bg-red-900/30 inline-block" />
          Indisponible
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="w-3 h-3 rounded-full bg-slate-100 dark:bg-slate-800 inline-block" />
          Passé
        </span>
      </div>
    </div>
  );
}
