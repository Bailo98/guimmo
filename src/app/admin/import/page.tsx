"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { Upload, X, CheckCircle, Loader2, AlertTriangle, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";

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

const REQUIRED = ["title", "type", "transaction_type", "price", "neighborhood"];
const VALID_TYPES = ["apartment", "house", "studio", "villa", "room", "land"];
const VALID_TX   = ["rent", "sale"];

function validateRow(row: CsvRow, index: number): ImportRow {
  for (const key of REQUIRED) {
    if (!row[key as keyof CsvRow]?.trim()) {
      return { index, data: row, valid: false, error: `Champ requis manquant: ${key}` };
    }
  }
  if (!VALID_TYPES.includes(row.type?.toLowerCase())) {
    return { index, data: row, valid: false, error: `Type invalide: ${row.type}` };
  }
  if (!VALID_TX.includes(row.transaction_type?.toLowerCase())) {
    return { index, data: row, valid: false, error: `Transaction invalide: ${row.transaction_type}` };
  }
  if (isNaN(Number(row.price)) || Number(row.price) <= 0) {
    return { index, data: row, valid: false, error: "Prix invalide" };
  }
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

  const [rows, setRows]         = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [done, setDone]         = useState(0);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setRows([]);
    setDone(0);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const validated = result.data.map((row, i) => validateRow(row, i + 1));
        setRows(validated);
      },
      error: () => toast("Erreur lors du parsing CSV", "error"),
    });
  }

  function clearFile() {
    setRows([]);
    setFileName("");
    setDone(0);
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
      toast(`✅ ${payload.length} annonce(s) importée(s)`, "success");
    }
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele-import-guimmo.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const validCount   = rows.filter((r) => r.valid).length;
  const invalidCount = rows.filter((r) => !r.valid).length;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Importer CSV</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Importez des annonces en masse depuis un fichier CSV</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2a3040] text-slate-600 dark:text-slate-300 hover:border-[#c8901e] hover:text-[#c8901e] transition-colors"
        >
          <Download className="w-4 h-4" /> Modèle CSV
        </button>
      </div>

      {/* Upload zone */}
      <div
        className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-[#2a3040] p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-[#c8901e] transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="w-8 h-8 text-slate-400" />
        {fileName ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-white">{fileName}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); clearFile(); }}
              className="text-slate-400 hover:text-red-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cliquez pour choisir un fichier CSV</p>
            <p className="text-xs text-slate-400">ou glissez-déposez ici</p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          aria-label="Fichier CSV à importer"
          onChange={onFile}
          className="hidden"
        />
      </div>

      {/* Summary + preview */}
      {rows.length > 0 && (
        <>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-xl px-4 py-2.5">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-bold text-green-600 dark:text-green-400">{validCount} ligne(s) valides</span>
            </div>
            {invalidCount > 0 && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl px-4 py-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-bold text-red-600 dark:text-red-400">{invalidCount} erreur(s)</span>
              </div>
            )}
          </div>

          {/* Preview table */}
          <div className="bg-white dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#2a3040]">
                    {["#", "Titre", "Type", "Transaction", "Prix", "Quartier", "Statut"].map((h) => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-[#2a3040]">
                  {rows.map((r) => (
                    <tr key={r.index} className={r.valid ? "" : "bg-red-50 dark:bg-red-900/10"}>
                      <td className="px-3 py-2 text-slate-400 text-xs">{r.index}</td>
                      <td className="px-3 py-2 font-medium text-slate-900 dark:text-white max-w-[180px] truncate">{r.data.title}</td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">{r.data.type}</td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">{r.data.transaction_type}</td>
                      <td className="px-3 py-2 text-[#F97316] font-bold whitespace-nowrap">{Number(r.data.price).toLocaleString("fr-FR")} GNF</td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">{r.data.neighborhood}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {r.valid ? (
                          <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">✓ OK</span>
                        ) : (
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full" title={r.error}>⚠ Erreur</span>
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
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-2xl p-4">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                {done} annonce(s) importée(s) avec succès !
              </p>
            </div>
          )}

          {/* Import button */}
          {done === 0 && validCount > 0 && (
            <button
              onClick={importRows}
              disabled={importing}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#c8901e] hover:bg-[#b87c18] text-white font-bold text-sm transition-colors disabled:opacity-50"
            >
              {importing ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Import en cours…</>
              ) : (
                <><Upload className="w-4 h-4" />Importer {validCount} annonce(s)</>
              )}
            </button>
          )}
        </>
      )}

      {/* Format guide */}
      <div className="bg-slate-50 dark:bg-[#1e2430] rounded-2xl border border-slate-100 dark:border-[#2a3040] p-4 space-y-2">
        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Format attendu</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
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
            <div key={col} className="flex gap-2 text-xs">
              <span className="font-mono font-bold text-[#F97316] flex-shrink-0">{col}</span>
              <span className="text-slate-500 dark:text-slate-400">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
