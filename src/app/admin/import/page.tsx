"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Upload, X, CheckCircle, Loader2, AlertTriangle, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/utils";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const SURFACE  = "var(--bg-card)";
const BORDER   = "var(--border)";
const TEXT_PRI = "var(--text-primary)";
const TEXT_SEC = "var(--text-primary-dim)";
const ACCENT   = "var(--accent-gold)";

interface CsvRow {
  title: string;
  type: string;
  transaction_type: string;
  price: string;
  price_period?: string;
  neighborhood: string;
  surface?: string;
  rooms?: string;
  bathrooms?: string;
  description?: string;
  contact_phone?: string;
  furnished?: string;
  available_now?: string;
}

interface ImportRow {
  index: number;
  data: CsvRow;
  valid: boolean;
  error?: string;
}

const REQUIRED   = ["title", "type", "transaction_type", "price", "neighborhood"];
const VALID_TYPES = ["apartment", "house", "studio", "villa", "room", "land"];
const VALID_TX    = ["rent", "sale"];

function validateRow(row: CsvRow, index: number): ImportRow {
  for (const key of REQUIRED) {
    if (!row[key as keyof CsvRow]?.trim()) {
      return { index, data: row, valid: false, error: `Champ requis manquant: ${key}` };
    }
  }
  if (!VALID_TYPES.includes(row.type?.toLowerCase()))
    return { index, data: row, valid: false, error: `Type invalide: ${row.type}` };
  if (!VALID_TX.includes(row.transaction_type?.toLowerCase()))
    return { index, data: row, valid: false, error: `Transaction invalide: ${row.transaction_type}` };
  if (isNaN(Number(row.price)) || Number(row.price) <= 0)
    return { index, data: row, valid: false, error: "Prix invalide" };
  return { index, data: row, valid: true };
}

const TEMPLATE_CSV = [
  "title,type,transaction_type,price,price_period,neighborhood,surface,rooms,bathrooms,description,contact_phone,furnished,available_now",
  '"Appartement 3 pièces Kipé",apartment,rent,2000000,month,kipe,80,3,1,"Beau appartement lumineux","+224628000000",false,true',
  '"Villa 5 pièces Hamdallaye",villa,sale,150000000,total,hamdallaye,250,5,3,"Grande villa avec jardin","+224628000001",false,true',
].join("\n");

export default function AdminImportPage() {
  const { user } = useAuth();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [rows, setRows]           = useState<ImportRow[]>([]);
  const [fileName, setFileName]   = useState("");
  const [importing, setImporting] = useState(false);
  const [done, setDone]           = useState(0);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setRows([]);
    setDone(0);
    Papa.parse<CsvRow>(file, {
      header: true, skipEmptyLines: true,
      complete: (result) => setRows(result.data.map((row, i) => validateRow(row, i + 1))),
      error: () => toast("Erreur lors du parsing CSV", "error"),
    });
  }

  function clearFile() {
    setRows([]); setFileName(""); setDone(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function importRows() {
    if (!supabase || !user) return;
    const valid = rows.filter((r) => r.valid);
    if (valid.length === 0) return;
    setImporting(true);
    const payload = valid.map((r) => ({
      owner_id:         user.id,
      title:            r.data.title.trim(),
      type:             r.data.type.toLowerCase(),
      transaction_type: r.data.transaction_type.toLowerCase(),
      price:            Number(r.data.price),
      price_period:     r.data.price_period?.trim() || "month",
      neighborhood:     r.data.neighborhood.trim().toLowerCase(),
      city:             "Conakry",
      surface:          r.data.surface ? Number(r.data.surface) : null,
      rooms:            r.data.rooms ? Number(r.data.rooms) : 1,
      bathrooms:        r.data.bathrooms ? Number(r.data.bathrooms) : 0,
      description:      r.data.description?.trim() || null,
      contact_phone:    r.data.contact_phone?.trim() || null,
      furnished:        r.data.furnished?.toLowerCase() === "true",
      available_now:    r.data.available_now?.toLowerCase() !== "false",
      status:           "active",
      features:         [],
    }));
    const { error } = await supabase.from("properties").insert(payload);
    setImporting(false);
    if (error) {
      toast("Erreur lors de l'import", "error");
      console.error(error);
    } else {
      setDone(payload.length);
      toast(`${payload.length} annonce(s) importée(s)`, "success");
    }
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "modele-import-LogerBien.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const validCount   = rows.filter((r) => r.valid).length;
  const invalidCount = rows.filter((r) => !r.valid).length;

  return (
    <div style={{ padding: "28px 24px 40px", maxWidth: 800, margin: "0 auto" }} className="px-4 md:px-6">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ color: TEXT_PRI, fontWeight: 900, fontSize: "clamp(20px,4vw,26px)" }}>Importer CSV</h1>
          <p style={{ color: TEXT_SEC, fontSize: 13, marginTop: 2 }}>Importez des annonces en masse depuis un fichier CSV</p>
        </div>
        <button onClick={downloadTemplate}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 16px", borderRadius: 10,
            border: `1px solid ${BORDER}`, background: "transparent",
            color: TEXT_SEC, fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0,
          }}>
          <Download size={15} /> Modèle CSV
        </button>
      </div>

      {/* Upload zone */}
      <div
        style={{
          background: SURFACE, border: `2px dashed ${BORDER}`, borderRadius: 14,
          padding: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          cursor: "pointer", marginBottom: 20,
        }}
        onClick={() => fileRef.current?.click()}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = ACCENT)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER)}
      >
        <Upload size={32} color={TEXT_SEC} />
        {fileName ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRI }}>{fileName}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); clearFile(); }}
              style={{ background: "none", border: "none", color: TEXT_SEC, cursor: "pointer", display: "flex", alignItems: "center" }}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRI }}>Cliquez pour choisir un fichier CSV</p>
            <p style={{ fontSize: 12, color: TEXT_SEC }}>ou glissez-déposez ici</p>
          </>
        )}
        <input ref={fileRef} type="file" accept=".csv" aria-label="Fichier CSV à importer" onChange={onFile} style={{ display: "none" }} />
      </div>

      {/* Summary + preview */}
      {rows.length > 0 && (
        <>
          {/* Counts */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(212,175,55,0.10)", border: "1px solid rgba(212,175,55,0.20)", borderRadius: 10, padding: "8px 14px" }}>
              <CheckCircle size={15} color="var(--accent-gold)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-gold)" }}>{validCount} ligne(s) valides</span>
            </div>
            {invalidCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", borderRadius: 10, padding: "8px 14px" }}>
                <AlertTriangle size={15} color="#ef4444" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>{invalidCount} erreur(s)</span>
              </div>
            )}
          </div>

          {/* Preview table */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 600, borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {["#", "Titre", "Type", "Transaction", "Prix", "Quartier", "Statut"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 700, color: TEXT_SEC, textTransform: "uppercase", letterSpacing: "1px", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.index}
                      style={{
                        borderTop: i === 0 ? "none" : `1px solid ${BORDER}`,
                        background: r.valid ? "transparent" : "rgba(239,68,68,0.06)",
                      }}>
                      <td style={{ padding: "8px 12px", color: TEXT_SEC, fontSize: 12 }}>{r.index}</td>
                      <td style={{ padding: "8px 12px", color: TEXT_PRI, fontWeight: 500, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.data.title}</td>
                      <td style={{ padding: "8px 12px", color: TEXT_SEC, whiteSpace: "nowrap" }}>{r.data.type}</td>
                      <td style={{ padding: "8px 12px", color: TEXT_SEC, whiteSpace: "nowrap" }}>{r.data.transaction_type}</td>
                      <td style={{ padding: "8px 12px", color: ACCENT, fontWeight: 700, whiteSpace: "nowrap" }}>{formatPrice(Number(r.data.price))}</td>
                      <td style={{ padding: "8px 12px", color: TEXT_SEC, whiteSpace: "nowrap" }}>{r.data.neighborhood}</td>
                      <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                        {r.valid ? (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-gold)", background: "rgba(212,175,55,0.12)", padding: "3px 8px", borderRadius: 999 }}>✓ OK</span>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.15)", padding: "3px 8px", borderRadius: 999 }} title={r.error}>⚠ Erreur</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Success banner */}
          {done > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(212,175,55,0.10)", border: "1px solid rgba(212,175,55,0.20)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <CheckCircle size={20} color="var(--accent-gold)" />
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--accent-gold)" }}>
                {done} annonce(s) importée(s) avec succès !
              </p>
            </div>
          )}

          {/* Import button */}
          {done === 0 && validCount > 0 && (
            <button onClick={importRows} disabled={importing}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                height: 52, borderRadius: 12, border: "none",
                background: importing ? "rgba(249,115,22,0.4)" : ACCENT,
                color: "white", fontWeight: 600, fontSize: 14,
                cursor: importing ? "not-allowed" : "pointer",
              }}>
              {importing
                ? <><Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />Import en cours…</>
                : <><Upload size={16} />Importer {validCount} annonce(s)</>}
            </button>
          )}
        </>
      )}

      {/* Format guide */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, marginTop: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: TEXT_SEC, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 12 }}>
          Format attendu
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "6px 24px" }}>
          {[
            ["title", "Texte libre *"],
            ["type", "apartment / house / studio / villa / room / land *"],
            ["transaction_type", "rent / sale *"],
            ["price", "Nombre entier (GNF) *"],
            ["price_period", "month / year / total"],
            ["neighborhood", "Identifiant quartier (ex: kipe) *"],
            ["surface", "Surface en m²"],
            ["rooms", "Nombre de pièces"],
            ["bathrooms", "Nombre de SDB"],
            ["contact_phone", "Numéro de téléphone"],
            ["furnished", "true / false"],
            ["available_now", "true / false"],
          ].map(([col, desc]) => (
            <div key={col} style={{ display: "flex", gap: 8, fontSize: 12 }}>
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: ACCENT, flexShrink: 0 }}>{col}</span>
              <span style={{ color: TEXT_SEC }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
