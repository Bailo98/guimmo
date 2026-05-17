"use client";
import { useState, useRef, useEffect } from "react";
import { User, Phone, Lock, Bell, Shield, Moon, Sun, Globe, ChevronRight, Save, ArrowLeft, Camera, LogOut, Trash2, X, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/lib/toast";

export default function ParametresPage() {
  const { theme, toggleTheme } = useAppStore();
  const { user, refreshProfile } = useAuth();

  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !supabase) { setProfileLoading(false); return; }
    supabase
      .from("profiles")
      .select("full_name, phone, avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setForm({
          name: data?.full_name ?? "",
          phone: data?.phone ?? "",
          email: user.email ?? "",
        });
        if (data?.avatar_url) setAvatar(data.avatar_url);
        setProfileLoading(false);
      });
  }, [user]);

  async function handleSave() {
    if (!user || !supabase) return;
    setSaving(true);
    setSaveError(null);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: form.name.trim(), phone: form.phone.trim() })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setSaveError("Erreur lors de la sauvegarde.");
      toast("Erreur lors de la sauvegarde.", "error");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast("Profil mis à jour.", "success");
      await refreshProfile();
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleLogout() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    // Clear cookie
    document.cookie = "BienLoger-auth=; path=/; max-age=0";
    localStorage.removeItem("BienLoger-store");
    localStorage.removeItem("logerbien-store");
    window.location.href = "/";
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "SUPPRIMER") return;
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    document.cookie = "BienLoger-auth=; path=/; max-age=0";
    localStorage.removeItem("BienLoger-store");
    localStorage.removeItem("logerbien-store");
    window.location.href = "/";
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header with back arrow */}
      <div className="flex items-center gap-3">
        <Link
          href="/compte"
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-[#1e2430] transition-colors text-slate-600 dark:text-slate-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Paramètres</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gérez votre compte et vos préférences</p>
        </div>
      </div>

      {/* Avatar */}
      <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040] flex items-center gap-4">
        <div className="relative">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden ${profileLoading ? "bg-slate-200 dark:bg-slate-700 animate-pulse" : "bg-gradient-to-br from-[#E9E900] to-[#c4c400]"}`}>
            {!profileLoading && (avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-black text-3xl">{form.name.charAt(0)}</span>
            ))}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#E9E900] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#c4c400] transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{form.name}</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs text-[#E9E900] hover:underline mt-0.5"
          >
            Changer la photo de profil
          </button>
        </div>
      </div>

      {/* Profile fields */}
      <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-5 border border-slate-100 dark:border-[#2a3040] space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-[#E9E900]" /> Profil
        </h2>
        {profileLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-1.5" />
                <div className="h-10 w-full bg-slate-100 dark:bg-[#151922] rounded-xl" />
              </div>
            ))}
            <div className="h-9 w-full bg-slate-100 dark:bg-[#151922] rounded-xl" />
          </div>
        ) : (
          <>
            {[
              { key: "name", label: "Nom complet", type: "text" },
              { key: "phone", label: "Téléphone", type: "tel" },
              { key: "email", label: "Email", type: "email" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => f.key !== "email" && setForm({ ...form, [f.key]: e.target.value })}
                  readOnly={f.key === "email"}
                  className={`w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none ${f.key === "email" ? "opacity-60 cursor-not-allowed" : "focus:ring-2 focus:ring-[#E9E900]"}`}
                />
                {f.key === "email" && (
                  <p className="text-xs text-slate-400 mt-1">L&apos;email ne peut pas être modifié ici.</p>
                )}
              </div>
            ))}
            {saveError && (
              <p className="text-xs text-red-500">{saveError}</p>
            )}
            <Button onClick={handleSave} loading={saving} variant="brand" size="sm" className="w-full">
              {saved ? "✓ Enregistré !" : <><Save className="w-4 h-4" /> Enregistrer</>}
            </Button>
          </>
        )}
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] overflow-hidden">
        <h2 className="font-bold text-slate-900 dark:text-white px-5 pt-5 pb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#E9E900]" /> Préférences
        </h2>
        <div className="divide-y divide-slate-100 dark:divide-[#2a3040]">
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-[#151922] transition-colors">
            {theme === "dark" ? <Moon className="w-4 h-4 text-slate-500" /> : <Sun className="w-4 h-4 text-slate-500" />}
            <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 text-left">Mode {theme === "dark" ? "sombre" : "clair"}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E9E900]/10 text-[#E9E900]">{theme === "dark" ? "Sombre" : "Clair"}</span>
          </button>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <Bell className="w-4 h-4 text-slate-500" />
            <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">Notifications WhatsApp</span>
            <div className="w-10 h-5 bg-green-500 rounded-full relative cursor-pointer">
              <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
            </div>
          </div>
          <button className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-[#151922] transition-colors">
            <Lock className="w-4 h-4 text-slate-500" />
            <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 text-left">Changer le mot de passe</span>
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
          </button>
        </div>
      </div>

      {/* Disconnect */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-[#1e2430] text-slate-700 dark:text-slate-200 font-semibold py-3.5 rounded-2xl border border-slate-200 dark:border-[#2a3040] hover:bg-slate-200 dark:hover:bg-[#2a3040] transition-colors"
      >
        <LogOut className="w-4 h-4" /> Se déconnecter
      </button>

      {/* Danger zone */}
      <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-5 border border-red-100 dark:border-red-900/30">
        <h2 className="font-bold text-red-700 dark:text-red-400 mb-1 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Zone de danger
        </h2>
        <p className="text-xs text-red-500 dark:text-red-400/70 mb-3">Cette action est irréversible.</p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2.5 rounded-xl transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Supprimer mon compte
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-red-200 dark:border-red-900/40" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="font-black text-slate-900 dark:text-white mb-2">Supprimer mon compte ?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              Toutes vos annonces, favoris et messages seront définitivement supprimés. Tapez <strong>SUPPRIMER</strong> pour confirmer.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full bg-slate-50 dark:bg-[#151922] border border-slate-200 dark:border-[#2a3040] rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-[#151922]">
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "SUPPRIMER"}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
