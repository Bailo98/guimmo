"use client";
import { useId } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Download } from "lucide-react";

interface Props {
  url: string;
  title: string;
}

export function PropertyQRCode({ url, title }: Props) {
  const reactId = useId();
  const qrId = `qr-${reactId.replace(/:/g, "")}`;


  function handleDownload() {
    const svg = document.getElementById(qrId);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = `qr-BienLoger-${title.slice(0, 20).replace(/\s/g, "-")}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  return (
    <div className="bg-[#2c2f36] rounded-2xl p-5 border border-[#1e2a30] print:break-inside-avoid">
      <h2 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
        <QrCode className="w-4 h-4 text-[#E9E900]" /> QR Code de l&apos;annonce
      </h2>
      <div className="flex items-center gap-4">
        <div className="bg-white p-2 rounded-xl border border-slate-200 flex-shrink-0">
          <QRCodeSVG
            id={qrId}
            value={url}
            size={88}
            bgColor="#ffffff"
            fgColor="#111418"
            level="M"
            includeMargin={false}
          />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Scannez pour partager</p>
          <p className="text-xs text-slate-400 mt-1 mb-3">Collez ce QR code sur une affiche pour que les gens accèdent directement à cette annonce.</p>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#E9E900] hover:text-[#c4c400] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger le QR code
          </button>
        </div>
      </div>
    </div>
  );
}
