import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Printer, CheckCircle2, Eraser, FileText, Loader2, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import SignaturePad from 'react-signature-canvas';

const GOLD = "#D4AF37";

export default function ContractModal({ reservation, onClose, onSign }) {
  const sigPad = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const clearSignature = () => sigPad.current?.clear?.();

  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const startDate = reservation.startDate ? new Date(reservation.startDate).toLocaleDateString('fr-FR') : '___________';
  const endDate = reservation.endDate ? new Date(reservation.endDate).toLocaleDateString('fr-FR') : '___________';
  const duration = reservation.startDate && reservation.endDate
    ? Math.ceil((new Date(reservation.endDate) - new Date(reservation.startDate)) / (1000 * 60 * 60 * 24))
    : 0;
  const totalPrice = reservation.totalPrice || reservation.total_price || '___';

  const generateAndUploadContract = async (signatureData) => {
    const contractHTML = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/>
<title>Contrat — ${reservation.id?.slice(0,8).toUpperCase()}</title>
<style>
* { margin:0;padding:0;box-sizing:border-box; }
body { font-family:Georgia,serif;color:#111;background:white;padding:40px;font-size:12px; }
.header { display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:24px;margin-bottom:24px; }
.brand { font-family:Arial;font-size:28px;font-weight:900;text-transform:uppercase; }
.brand span { color:#D4AF37; }
.num { background:#111;color:white;padding:12px 20px;border-radius:8px;text-align:right; }
.title { text-align:center;font-family:Arial;font-size:16px;font-weight:900;text-transform:uppercase;letter-spacing:3px;border:2px solid #111;padding:14px;border-radius:8px;margin:20px 0; }
.grid { display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:20px 0; }
.box { border:1px solid #ddd;border-radius:8px;padding:16px; }
.bt { font-family:Arial;font-size:8px;font-weight:900;text-transform:uppercase;color:#D4AF37;border-bottom:1px solid #eee;padding-bottom:8px;margin-bottom:10px; }
.bn { font-family:Arial;font-size:14px;font-weight:900;margin-bottom:6px; }
.bi { font-size:11px;color:#555;line-height:1.6; }
.fin { border:2px solid #D4AF37;border-radius:8px;overflow:hidden; }
.fh { background:#D4AF37;padding:10px 16px;font-family:Arial;font-size:9px;font-weight:900;text-transform:uppercase; }
.fc { padding:16px; }
.line { display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px; }
.total { display:flex;justify-content:space-between;border-top:1px solid #ddd;padding-top:10px;font-family:Arial;font-size:16px;font-weight:900; }
.total span:last-child { color:#D4AF37; }
.conds { border:1px solid #ddd;border-radius:8px;padding:20px;margin:20px 0; }
.ct { font-family:Arial;font-size:8px;font-weight:900;text-transform:uppercase;color:#D4AF37;margin-bottom:14px; }
.art { margin-bottom:10px; }
.at { font-family:Arial;font-size:10px;font-weight:900;text-transform:uppercase;margin-bottom:3px; }
.ax { font-size:10px;color:#555;line-height:1.5; }
.sigs { display:grid;grid-template-columns:1fr 1fr;gap:40px;border-top:2px solid #111;padding-top:24px;margin-top:24px; }
.st { font-family:Arial;font-size:8px;font-weight:900;text-transform:uppercase;color:#999;margin-bottom:8px; }
.sb { height:80px;border-bottom:1px solid #ccc;display:flex;align-items:flex-end;padding-bottom:4px; }
.foot { text-align:center;font-family:Arial;font-size:9px;color:#bbb;border-top:1px solid #eee;padding-top:16px;margin-top:24px; }
</style></head><body>
<div class="header">
  <div>
    <div class="brand">Shift <span>Luxury</span></div>
    <div style="font-family:Arial;font-size:9px;color:#999;text-transform:uppercase;margin-top:4px">Location de Véhicules de Prestige</div>
    <div style="margin-top:12px;font-size:10px;color:#555;line-height:1.6">SARL SHIFT LUXURY — Capital : 10 000 €<br/>SIRET : XXX XXX XXX 00001</div>
  </div>
  <div class="num">
    <div style="font-family:Arial;font-size:8px;color:#999;text-transform:uppercase">Contrat N°</div>
    <div style="font-family:Arial;font-size:16px;font-weight:900">${reservation.id?.slice(0,8).toUpperCase()}</div>
    <div style="font-family:Arial;font-size:9px;color:#999;margin-top:4px">Paris, le ${today}</div>
  </div>
</div>
<div class="title">Contrat de Location de Véhicule</div>
<div class="grid">
  <div class="box"><div class="bt">Le Loueur</div><div class="bn">${reservation.shopName || 'SHIFT LUXURY'}</div><div class="bi">Tél : ${reservation.shopPhone || '+33 1 00 00 00 00'}<br/>Email : contact@shift-luxury.fr</div></div>
  <div class="box"><div class="bt">Le Locataire</div><div class="bn">${reservation.client?.name || '___'}</div><div class="bi">Tél : ${reservation.client?.phone || '___'}<br/>Email : ${reservation.client?.email || '___'}<br/>Permis N° : ${reservation.client?.license || '___'}</div></div>
</div>
<div class="grid">
  <div class="box">
    <div class="bt">Période</div>
    <div class="line"><span style="color:#999">Départ :</span><strong>${startDate}</strong></div>
    <div class="line"><span style="color:#999">Retour :</span><strong>${endDate}</strong></div>
    <div class="line" style="border-top:1px solid #eee;padding-top:8px"><span style="color:#999">Durée :</span><strong>${duration} jour(s)</strong></div>
  </div>
  <div class="fin">
    <div class="fh">Détail Financier</div>
    <div class="fc">
      <div class="line"><span style="color:#999">Caution :</span><strong>2 000 €</strong></div>
      <div class="total"><span>Total TTC :</span><span>${totalPrice} €</span></div>
    </div>
  </div>
</div>
<div class="conds">
  <div class="ct">Conditions Générales</div>
  <div class="art"><div class="at">Art. 1 — Prise en charge</div><div class="ax">Le locataire reconnaît avoir pris possession du véhicule en bon état avec le plein de carburant.</div></div>
  <div class="art"><div class="at">Art. 2 — Utilisation</div><div class="ax">Le locataire s'engage à utiliser le véhicule en conducteur prudent. Toute utilisation sur circuit est interdite.</div></div>
  <div class="art"><div class="at">Art. 3 — Assurance</div><div class="ax">Le véhicule est assuré tous risques. La franchise est à la charge du locataire.</div></div>
  <div class="art"><div class="at">Art. 4 — Caution</div><div class="ax">Une caution de 2 000 € est prélevée à la remise des clés et restituée sous 7 jours après retour.</div></div>
  <div class="art"><div class="at">Art. 5 — Carburant</div><div class="ax">Le véhicule doit être restitué avec le plein. Des frais seront facturés à défaut.</div></div>
</div>
<div class="sigs">
  <div>
    <div class="st">Signature du Loueur</div>
    <div class="sb"><span style="font-family:Georgia;font-style:italic;font-size:22px;color:#555">Shift Luxury</span></div>
    <div style="font-family:Arial;font-size:9px;color:#999;margin-top:6px">${today}</div>
  </div>
  <div>
    <div class="st" style="color:#D4AF37">Signature du Locataire</div>
    ${signatureData ? `<div class="sb"><img src="${signatureData}" style="max-height:70px;max-width:200px"/></div>` : `<div class="sb"></div>`}
    <div style="font-family:Arial;font-size:9px;color:#999;margin-top:6px">${today}</div>
  </div>
</div>
<div class="foot">Contrat généré par SHIFT LUXURY SaaS • ${today}</div>
</body></html>`;

    try {
      const blob = new Blob([contractHTML], { type: 'application/octet-stream' });
      const fileName = `contracts/contract_${reservation.id}_${Date.now()}.html`;
      const { error } = await supabase.storage.from('documents').upload(fileName, blob, { contentType: 'application/octet-stream', upsert: true });
      if (error) { console.error('Upload error:', error); return null; }
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
      return urlData?.publicUrl || null;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  };

  const sendEmails = async (signatureData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: storeData } = await supabase.from('store_settings').select('shop_name').eq('user_id', user?.id).maybeSingle();

      await fetch('https://nhdancdcsarrgfmfebop.supabase.co/functions/v1/send-contract-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: reservation.client?.email,
          clientName: reservation.client?.name,
          clientPhone: reservation.client?.phone,
          clientLicense: reservation.client?.license,
          merchantEmail: user?.email,
          merchantName: storeData?.shop_name,
          vehicleModel: reservation.vehicle || reservation.vehicle_model || 'Véhicule',
          startDate,
          endDate,
          duration,
          totalPrice,
          signatureData,
          reservationId: reservation.id,
        }),
      });
      setEmailSent(true);
    } catch (err) {
      console.error('Email error:', err);
    }
  };

  const handleSign = async () => {
    setIsGenerating(true);
    try {
      let signatureData = null;
      if (sigPad.current && !sigPad.current.isEmpty()) {
        signatureData = sigPad.current.getCanvas().toDataURL('image/png');
      }
      const contractUrl = await generateAndUploadContract(signatureData);
      await sendEmails(signatureData);
      onSign(signatureData || 'signed', contractUrl);
    } catch (err) {
      console.error('handleSign error:', err);
      onSign('signed', null);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8 print:p-0">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl print:hidden" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-white text-black rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">

        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <FileText size={20} style={{ color: GOLD }} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tighter">Contrat de Location</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Réf : {reservation.id?.slice(0,8).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} className="p-3 hover:bg-zinc-200 rounded-xl transition-colors text-zinc-600 flex items-center gap-2 text-xs font-bold">
              <Printer size={16} /> Imprimer
            </button>
            <button onClick={onClose} className="p-3 hover:bg-red-50 rounded-xl transition-colors text-red-500"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-10 md:p-16 max-w-3xl mx-auto space-y-10 font-serif">
            <div className="flex justify-between items-start border-b-2 border-black pb-8">
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter leading-none font-sans">Shift <span style={{ color: GOLD }}>Luxury</span></h1>
                <p className="text-xs font-sans font-bold uppercase tracking-[0.3em] text-zinc-400 mt-1">Location de Véhicules de Prestige</p>
                <div className="mt-4 text-xs text-zinc-600 leading-relaxed">
                  <p>SARL SHIFT LUXURY — Capital : 10 000 €</p>
                  <p>SIRET : XXX XXX XXX 00001</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block bg-black text-white px-6 py-3 rounded-xl font-sans">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Contrat N°</p>
                  <p className="text-lg font-black">{reservation.id?.slice(0,8).toUpperCase()}</p>
                </div>
                <p className="text-xs text-zinc-500 mt-3">Paris, le {today}</p>
              </div>
            </div>

            <h2 className="text-center text-xl font-black uppercase tracking-widest font-sans border border-black py-4 rounded-xl">Contrat de Location de Véhicule</h2>

            <div className="grid grid-cols-2 gap-8">
              <div className="border border-zinc-200 rounded-xl p-6">
                <p className="text-[9px] font-sans font-black uppercase tracking-widest mb-3 pb-2 border-b border-zinc-100" style={{ color: GOLD }}>Le Loueur</p>
                <p className="font-black text-sm font-sans">{reservation.shopName || 'SHIFT LUXURY'}</p>
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">Tél : {reservation.shopPhone || '+33 1 00 00 00 00'}<br />Email : contact@shift-luxury.fr</p>
              </div>
              <div className="border border-zinc-200 rounded-xl p-6">
                <p className="text-[9px] font-sans font-black uppercase tracking-widest mb-3 pb-2 border-b border-zinc-100" style={{ color: GOLD }}>Le Locataire</p>
                <p className="font-black text-sm font-sans">{reservation.client?.name || '___'}</p>
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                  Tél : {reservation.client?.phone || '___'}<br />
                  Email : {reservation.client?.email || '___'}<br />
                  Permis N° : {reservation.client?.license || '___'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="border border-zinc-200 rounded-xl p-6">
                <p className="text-[9px] font-sans font-black uppercase tracking-widest mb-3" style={{ color: GOLD }}>Période</p>
                <div className="flex justify-between text-sm mb-2"><span className="text-zinc-500">Départ :</span><span className="font-black font-sans">{startDate}</span></div>
                <div className="flex justify-between text-sm mb-2"><span className="text-zinc-500">Retour :</span><span className="font-black font-sans">{endDate}</span></div>
                <div className="flex justify-between text-sm border-t pt-2"><span className="text-zinc-500">Durée :</span><span className="font-black font-sans">{duration} jour(s)</span></div>
              </div>
              <div className="border-2 rounded-xl overflow-hidden" style={{ borderColor: GOLD }}>
                <div className="px-6 py-3 border-b" style={{ background: GOLD }}>
                  <p className="text-[9px] font-sans font-black uppercase tracking-widest text-black">Détail Financier</p>
                </div>
                <div className="p-6 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">Caution :</span><span className="font-black font-sans">2 000 €</span></div>
                  <div className="flex justify-between border-t pt-2 text-lg"><span className="font-black">Total TTC :</span><span className="font-black font-sans" style={{ color: GOLD }}>{totalPrice} €</span></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 pt-6 border-t-2 border-black">
              <div>
                <p className="text-[9px] font-sans font-black uppercase tracking-widest text-zinc-400 mb-4">Signature du Loueur</p>
                <div className="h-24 flex items-end pb-2 border-b border-zinc-300">
                  <p className="font-serif italic text-2xl text-zinc-700">Shift Luxury</p>
                </div>
                <p className="text-[9px] font-sans text-zinc-400 mt-2">{today}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[9px] font-sans font-black uppercase tracking-widest" style={{ color: GOLD }}>Signature du Locataire</p>
                  <button onClick={clearSignature} className="text-zinc-300 hover:text-red-500 transition-colors"><Eraser size={14} /></button>
                </div>
                <div className="h-24 bg-zinc-50 rounded-xl border-2 border-zinc-300 overflow-hidden">
                  <SignaturePad ref={sigPad} canvasProps={{ style: { width: '100%', height: '100%' }, className: 'cursor-crosshair' }} />
                </div>
                <p className="text-[9px] font-sans text-zinc-400 mt-2">{today}</p>
              </div>
            </div>

            <p className="text-center text-[9px] text-zinc-400 font-sans border-t border-zinc-100 pt-6">
              Contrat généré par SHIFT LUXURY SaaS • {today}
            </p>
          </div>
        </div>

        <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
          <div>
            {emailSent && (
              <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase">
                <Mail size={14} /> Emails envoyés !
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-8 py-4 text-zinc-500 font-black uppercase tracking-widest text-[10px]">Annuler</button>
            <button onClick={handleSign} disabled={isGenerating}
              className="px-10 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#D4AF37] disabled:opacity-50 transition-all flex items-center gap-3">
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {isGenerating ? 'Envoi en cours...' : 'Valider & Signer'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

