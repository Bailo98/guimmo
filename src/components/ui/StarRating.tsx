"use client";

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}

export function StarRating({ rating, count, size = "md" }: StarRatingProps) {
  const starSize = size === "sm" ? 12 : 16;
  const textClass = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span className={`inline-flex items-center gap-1 ${textClass}`}>
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rating >= star;
          const partial = !filled && rating > star - 1;
          const fillPercent = partial ? Math.round((rating - (star - 1)) * 100) : 0;
          const id = `star-gradient-${star}-${Math.round(rating * 100)}`;

          return (
            <svg
              key={star}
              width={starSize}
              height={starSize}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {partial && (
                <defs>
                  <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
                    <stop offset={`${fillPercent}%`} stopColor="#F97316" />
                    <stop offset={`${fillPercent}%`} stopColor="#94a3b8" />
                  </linearGradient>
                </defs>
              )}
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={filled ? "#F97316" : partial ? `url(#${id})` : "#94a3b8"}
              />
            </svg>
          );
        })}
      </span>
      <span className="font-semibold text-slate-700 dark:text-slate-300">{rating.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-slate-400">({count} avis)</span>
      )}
    </span>
  );
}
