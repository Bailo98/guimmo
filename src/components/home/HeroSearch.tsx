"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { VoiceSearchButton } from "@/components/ui/VoiceSearchButton";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleVoiceResult(text: string) {
    setQuery(text);
    router.push(`/annonces?q=${encodeURIComponent(text)}`);
  }

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    router.push(
      `/annonces${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`,
    );
  }

  return (
    <form
      onSubmit={handleSearch}
      style={{ width: "100%", maxWidth: 680, margin: "0 auto" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 52,
          borderRadius: 30,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          padding: "0 6px 0 18px",
          gap: 8,
        }}
      >
        {/* Search icon */}
        <Search
          style={{
            width: 18,
            height: 18,
            color: "var(--text-tertiary)",
            flexShrink: 0,
          }}
        />

        {/* Text input — .input-bare overrides global !important rules */}
        <input
          type="text"
          className="input-bare"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Où veux-tu habiter ?"
          style={{
            flex: 1,
            fontSize: 15,
            fontFamily: "var(--font-space-grotesk), sans-serif",
          }}
        />

        {/* Voice search */}
        <VoiceSearchButton onResult={handleVoiceResult} />

        {/* Filters → /annonces */}
        <button
          type="button"
          onClick={() =>
            router.push(
              `/annonces${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`,
            )
          }
          aria-label="Filtres avancés"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-tertiary)",
            flexShrink: 0,
            transition: "background 0.2s",
            minHeight: "auto",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,255,255,0.14)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,255,255,0.08)";
          }}
        >
          <SlidersHorizontal style={{ width: 15, height: 15 }} />
        </button>

        {/* Submit */}
        <button
          type="submit"
          style={{
            height: 40,
            paddingLeft: 20,
            paddingRight: 20,
            borderRadius: 24,
            background: "var(--accent-gold)",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
            transition: "opacity 0.2s",
            minHeight: "auto",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "1";
          }}
        >
          Chercher
        </button>
      </div>
    </form>
  );
}
