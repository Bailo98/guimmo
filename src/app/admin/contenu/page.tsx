"use client";
import { useState, useEffect } from "react";
import { Save, Globe, Phone, Mail, Link, Video, MessageCircle, Users, FileText, Info } from "lucide-react";

const TABS = [
  { id: "contact", label: "Coordonnées", icon: Phone },
  { id: "about", label: "À propos", icon: Info },
  { id: "team", label: "Équipe", icon: Users },
  { id: "blog", label: "Blog", icon: FileText },
];

const INITIAL_CONTACT = {
  email: "contact@BienLoger.gn",
  emailSupport: "support@BienLoger.gn",
  phone: "+224 628 222 510",
  whatsapp: "+224 628 222 510",
  facebook: "https://facebook.com/BienLoger",
  instagram: "https://instagram.com/BienLoger",
  youtube: "",
  address: "Kipé, Conakry, Guinée",
  website: "https://BienLoger-orcin.vercel.app",
};

const INITIAL_ABOUT = {
  title: "La plateforme immobilière de confiance en Guinée",
  subtitle: "BienLoger connecte propriétaires et locataires en toute sécurité.",
  mission: "Notre mission est de simplifier la recherche immobilière en Guinée en offrant une plateforme fiable, transparente et accessible à tous.",
  vision: "Devenir la référence de l'immobilier en Afrique de l'Ouest.",
  founded: "2024",
  employees: "12",
  listings: "2 400+",
  users: "15 000+",
};

export default function AdminContenuPage() {
  const [tab, setTab] = useState("contact");
  const [contact, setContact] = useState(INITIAL_CONTACT);
  const [about, setAbout] = useState(INITIAL_ABOUT);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const c = localStorage.getItem("BienLoger-contact");
      if (c) setContact((prev) => ({ ...prev, ...JSON.parse(c) }));
      const a = localStorage.getItem("BienLoger-about");
      if (a) setAbout((prev) => ({ ...prev, ...JSON.parse(a) }));
    } catch { /* ignore */ }
  }, []);

  function handleSave() {
    localStorage.setItem("BienLoger-contact", JSON.stringify(contact));
    localStorage.setItem("BienLoger-about", JSON.stringify(about));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Contenu du site</h1>
          <p className="text-slate-500 text-sm">Modifiez les informations affichées sur le site</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-[#E9E900] text-white font-bold px-4 py-2.5 rounded-xl hover:bg-[#c4c400] transition-colors"
        >
          <Save className="w-4 h-4" />
          {saved ? "✓ Enregistré !" : "Enregistrer"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-[#2a3040]">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.id
                  ? "border-[#E9E900] text-[#E9E900]"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Contact tab */}
      {tab === "contact" && (
        <div className="bg-[#2c2f36] rounded-2xl p-6 border border-[#1e2a30] space-y-5">
          <h2 className="font-bold text-slate-900 dark:text-white">Coordonnées de BienLoger</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "email", label: "Email principal", icon: Mail, placeholder: "contact@BienLoger.gn" },
              { key: "emailSupport", label: "Email support", icon: Mail, placeholder: "support@BienLoger.gn" },
              { key: "phone", label: "Téléphone", icon: Phone, placeholder: "+224 620 000 000" },
              { key: "whatsapp", label: "WhatsApp support", icon: MessageCircle, placeholder: "+224 620 000 000" },
              { key: "facebook", label: "Page Facebook", icon: Link, placeholder: "https://facebook.com/BienLoger" },
              { key: "instagram", label: "Instagram", icon: Link, placeholder: "https://instagram.com/BienLoger" },
              { key: "youtube", label: "YouTube", icon: Video, placeholder: "https://youtube.com/@BienLoger" },
              { key: "website", label: "Site web", icon: Globe, placeholder: "https://BienLoger.gn" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{f.label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={contact[f.key as keyof typeof contact]}
                      onChange={(e) => setContact({ ...contact, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E9E900]"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Adresse physique</label>
            <input
              type="text"
              value={contact.address}
              onChange={(e) => setContact({ ...contact, address: e.target.value })}
              className="w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E9E900]"
            />
          </div>
        </div>
      )}

      {/* About tab */}
      {tab === "about" && (
        <div className="bg-[#2c2f36] rounded-2xl p-6 border border-[#1e2a30] space-y-5">
          <h2 className="font-bold text-slate-900 dark:text-white">Page À propos</h2>

          <div className="space-y-4">
            {[
              { key: "title", label: "Titre principal", multiline: false },
              { key: "subtitle", label: "Sous-titre", multiline: false },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{f.label}</label>
                <input
                  type="text"
                  value={about[f.key as keyof typeof about]}
                  onChange={(e) => setAbout({ ...about, [f.key]: e.target.value })}
                  className="w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E9E900]"
                />
              </div>
            ))}

            {[
              { key: "mission", label: "Notre mission" },
              { key: "vision", label: "Notre vision" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{f.label}</label>
                <textarea
                  rows={3}
                  value={about[f.key as keyof typeof about]}
                  onChange={(e) => setAbout({ ...about, [f.key]: e.target.value })}
                  className="w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E9E900] resize-none"
                />
              </div>
            ))}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: "founded", label: "Année de création" },
                { key: "employees", label: "Employés" },
                { key: "listings", label: "Annonces actives" },
                { key: "users", label: "Utilisateurs" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{f.label}</label>
                  <input
                    type="text"
                    value={about[f.key as keyof typeof about]}
                    onChange={(e) => setAbout({ ...about, [f.key]: e.target.value })}
                    className="w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E9E900]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team tab */}
      {tab === "team" && (
        <TeamEditor />
      )}

      {/* Blog tab */}
      {tab === "blog" && (
        <BlogEditor />
      )}
    </div>
  );
}

const DEFAULT_MEMBERS = [
  { id: "1", name: "Mamadou Diallo", role: "CEO & Fondateur", bio: "Passionné d'immobilier et de technologie.", photo: "" },
  { id: "2", name: "Fatoumata Camara", role: "Directrice commerciale", bio: "10 ans d'expérience en immobilier.", photo: "" },
];

function TeamEditor() {
  const [members, setMembers] = useState(DEFAULT_MEMBERS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("BienLoger-team");
      if (saved) setMembers(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  function save(next: typeof members) {
    setMembers(next);
    try { localStorage.setItem("BienLoger-team", JSON.stringify(next)); } catch { /* ignore */ }
  }

  function addMember() {
    save([...members, { id: Date.now().toString(), name: "", role: "", bio: "", photo: "" }]);
  }

  function removeMember(id: string) {
    save(members.filter((m) => m.id !== id));
  }

  function updateMember(id: string, field: string, value: string) {
    save(members.map((m) => m.id === id ? { ...m, [field]: value } : m));
  }

  return (
    <div className="space-y-4">
      {members.map((m) => (
        <div key={m.id} className="bg-[#2c2f36] rounded-2xl p-5 border border-[#1e2a30]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "name", label: "Nom" },
              { key: "role", label: "Poste" },
              { key: "photo", label: "URL photo" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{f.label}</label>
                <input
                  type="text"
                  value={m[f.key as keyof typeof m]}
                  onChange={(e) => updateMember(m.id, f.key, e.target.value)}
                  className="w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E9E900] text-slate-900 dark:text-white"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Bio</label>
              <textarea
                rows={2}
                value={m.bio}
                onChange={(e) => updateMember(m.id, "bio", e.target.value)}
                className="w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E9E900] resize-none text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <button onClick={() => removeMember(m.id)} className="mt-3 text-xs text-red-500 hover:text-red-700 font-semibold">
            Supprimer ce membre
          </button>
        </div>
      ))}
      <button
        onClick={addMember}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-[#2a3040] text-slate-500 hover:border-[#E9E900] hover:text-[#E9E900] transition-colors text-sm font-semibold"
      >
        + Ajouter un membre
      </button>
    </div>
  );
}

const DEFAULT_POSTS = [
  { id: "1", title: "Comment trouver un logement à Conakry", category: "Guide", content: "", published: true, date: "2024-01-15" },
];

function BlogEditor() {
  const [posts, setPosts] = useState(DEFAULT_POSTS);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("BienLoger-blog-posts");
      if (saved) setPosts(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  function savePosts(next: typeof posts) {
    setPosts(next);
    try { localStorage.setItem("BienLoger-blog-posts", JSON.stringify(next)); } catch { /* ignore */ }
  }

  function addPost() {
    const newPost = { id: Date.now().toString(), title: "", category: "Actualité", content: "", published: false, date: new Date().toISOString().split("T")[0] };
    savePosts([newPost, ...posts]);
    setEditing(newPost.id);
  }

  function updatePost(id: string, field: string, value: string | boolean) {
    savePosts(posts.map((p) => p.id === id ? { ...p, [field]: value } : p));
  }

  return (
    <div className="space-y-4">
      <button
        onClick={addPost}
        className="flex items-center gap-2 bg-[#E9E900] text-white font-bold px-4 py-2.5 rounded-xl hover:bg-[#c4c400] transition-colors text-sm"
      >
        + Nouvel article
      </button>

      {posts.map((post) => (
        <div key={post.id} className="bg-[#2c2f36] rounded-2xl border border-[#1e2a30] overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{post.title || "Nouvel article"}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-slate-400">{post.date}</span>
                <span className={`text-xs font-semibold ${post.published ? "text-green-500" : "text-yellow-500"}`}>
                  {post.published ? "Publié" : "Brouillon"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setEditing(editing === post.id ? null : post.id)}
              className="text-xs font-semibold text-[#E9E900] hover:underline"
            >
              {editing === post.id ? "Fermer" : "Modifier"}
            </button>
          </div>

          {editing === post.id && (
            <div className="border-t border-slate-100 dark:border-[#2a3040] p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Titre</label>
                  <input type="text" value={post.title} onChange={(e) => updatePost(post.id, "title", e.target.value)}
                    className="w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E9E900] text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Catégorie</label>
                  <select value={post.category} onChange={(e) => updatePost(post.id, "category", e.target.value)}
                    className="w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E9E900] text-slate-900 dark:text-white">
                    {["Guide", "Actualité", "Conseil", "Marché", "Annonce"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Contenu</label>
                <textarea rows={6} value={post.content} onChange={(e) => updatePost(post.id, "content", e.target.value)}
                  className="w-full bg-[#2c2f36] border border-[#1e2a30] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E9E900] resize-none text-slate-900 dark:text-white"
                  placeholder="Écrivez votre article ici..." />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => updatePost(post.id, "published", !post.published)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${post.published ? "bg-green-500" : "bg-slate-300"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${post.published ? "right-0.5" : "left-0.5"}`} />
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-200">Publié</span>
                </label>
                <button onClick={() => savePosts(posts.filter((p) => p.id !== post.id))} className="text-xs text-red-500 hover:text-red-700 font-semibold">
                  Supprimer
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
