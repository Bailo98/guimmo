"use client";
import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { Avatar } from "@/components/ui/Avatar";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";

interface Props {
  userId: string;
  currentUrl?: string | null;
  name?: string | null;
  onSuccess: (url: string) => void;
}

export function AvatarUpload({ userId, currentUrl, name, onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    if (file.size > 8 * 1024 * 1024) {
      toast("Image trop grande (max 8 Mo)", "error");
      return;
    }

    // Instant preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 400,
        useWebWorker: true,
      });

      const path = `${userId}/avatar.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, compressed, { upsert: true, contentType: "image/jpeg" });

      if (upErr) { toast(`Erreur upload : ${upErr.message}`, "error"); return; }

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      // Cache-bust
      const urlWithBust = `${publicUrl}?t=${Date.now()}`;

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: urlWithBust })
        .eq("id", userId);

      if (dbErr) { toast(`Erreur sauvegarde : ${dbErr.message}`, "error"); return; }

      onSuccess(urlWithBust);
      toast("✅ Photo mise à jour", "success");
    } catch (err) {
      console.error(err);
      toast("Erreur lors de l'upload", "error");
      setPreview(null);
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const displayUrl = preview ?? currentUrl;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      {/* Clickable avatar — no prominent button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title="Changer la photo de profil"
        style={{
          background: "none", border: "none", padding: 0, cursor: uploading ? "wait" : "pointer",
          position: "relative", borderRadius: "50%", display: "block",
        }}
      >
        <Avatar url={displayUrl} name={name} size="lg" />
        {/* Subtle hover overlay */}
        <span style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: uploading ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.15s",
        }}
          onMouseEnter={(e) => { if (!uploading) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.30)"; }}
          onMouseLeave={(e) => { if (!uploading) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0)"; }}
        >
          {uploading && (
            <span style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.5)", borderTopColor: "#fff", borderRadius: "50%", display: "block", animation: "spin 0.7s linear infinite" }} />
          )}
        </span>
      </button>

      {/* Discret label */}
      <span style={{ fontSize: 11, color: "rgba(240,230,204,0.35)", cursor: "pointer" }}
        onClick={() => !uploading && inputRef.current?.click()}>
        {uploading ? "Téléchargement…" : "Changer la photo"}
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFile}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
