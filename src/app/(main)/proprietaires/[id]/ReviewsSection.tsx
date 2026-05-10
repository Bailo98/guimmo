"use client";

import { useState } from "react";
import { Star, Send } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAppStore } from "@/lib/store";

interface ReviewsSectionProps {
  ownerId: string;
  ownerName: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="w-4 h-4"
          style={{
            fill: rating >= star ? "#F97316" : "#94a3b8",
            color: rating >= star ? "#F97316" : "#94a3b8",
          }}
        />
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <Star
            className="w-7 h-7 transition-colors"
            style={{
              fill: (hovered || value) >= star ? "#F97316" : "transparent",
              color: (hovered || value) >= star ? "#F97316" : "#94a3b8",
            }}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewsSection({ ownerId, ownerName }: ReviewsSectionProps) {
  const ownerReviews = useAppStore((s) => s.ownerReviews);
  const addOwnerReview = useAppStore((s) => s.addOwnerReview);

  const reviews = ownerReviews.filter((r) => r.ownerId === ownerId);

  // Average rating
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  // Form state
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !comment.trim() || rating === 0) {
      toast("Veuillez remplir tous les champs et noter le propriétaire.", "error");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    addOwnerReview({ ownerId, authorName: name.trim(), rating, comment: comment.trim() });
    setName("");
    setRating(0);
    setComment("");
    setSubmitting(false);
    toast("Avis publié avec succès !", "success");
  }

  return (
    <div className="space-y-6">
      {/* Header with average */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Avis sur {ownerName}
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-3 bg-white dark:bg-[#1e2430] rounded-xl px-4 py-2 border border-slate-100 dark:border-[#2a3040]">
            <span className="text-3xl font-black text-[#F97316]">{avgRating.toFixed(1)}</span>
            <div>
              <StarDisplay rating={Math.round(avgRating)} />
              <p className="text-xs text-slate-400 mt-0.5">{reviews.length} avis</p>
            </div>
          </div>
        )}
      </div>

      {/* Reviews list */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040]"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #F97316, #EA6C0A)" }}
                  >
                    {review.authorName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{review.authorName}</p>
                    <p className="text-slate-400 text-xs">
                      {new Date(review.createdAt).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <StarDisplay rating={review.rating} />
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-8 border border-slate-100 dark:border-[#2a3040] text-center">
          <Star className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-400 text-sm">Aucun avis pour le moment. Soyez le premier !</p>
        </div>
      )}

      {/* Add review form */}
      <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-6 border border-slate-100 dark:border-[#2a3040]">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Laisser un avis</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Votre nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Aminata Balde"
              className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            />
          </div>

          {/* Star rating */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Note (1 à 5 étoiles)
            </label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Votre commentaire
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience avec ce propriétaire..."
              className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {submitting ? "Publication..." : "Publier l'avis"}
          </button>
        </form>
      </div>
    </div>
  );
}
