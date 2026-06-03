import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Printer, CheckCircle2, Eraser, FileText, AlertCircle } from 'lucide-react';

let SignaturePad;
try { SignaturePad = require('react-signature-canvas'); } catch (e) { SignaturePad = null; }

const GOLD = "#D4AF37";

export default function ContractModal({ reservation, onClose, onSign }) {
  const sigPad = useRef(null);
  const [isSigned, setIsSigned] = useState(false);

  const clearSignature = () => { sigPad.current?.clear?.(); setIsSigned(false); };

  const handleSign = () => {
    if (!sigPad.current) { onSign("signed"); return; }
    if (typeof sigPad.current.isEmpty === 'function' && sigPad.current.isEmpty()) return;
    onSign(sigPad.current.getTrimmedCanvas().toDataURL('image/png'));
  };

  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const startDate = reservation.startDate ? new Date(reservation.startDate).toLocaleDateString('fr-FR') : '___________';
  const endDate = reservation.endDate ? new Date(reservation.endDate).toLocaleDateString('fr-FR') : '___________';
  const duration = reservation.startDate && reservation.endDate
    ? Math.ceil((new Date(reservation.endDate) - new Date(reservation.startDate)) / (1000 * 60 * 60 * 24))
    : '___';
  const totalPrice = reservation.totalPrice || (reservation.vehicle?.price * duration) || '___';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8 print:p-0">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl print:hidden" onClick={onClose} />

      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-white text-black rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] print:border-0 print:rounded-none print:max-h-none">

        {/* Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 print:hidden sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <FileText size={20} style={{ color: GOLD }} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tighter">Contrat de Location</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Réf : {reservation.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} className="p-3 hover:bg-zinc-200 rounded-xl transition-colors text-zinc-600 flex items-center gap-2 text-xs font-bold">
              <Printer size={16} /> Imprimer
            </button>
            <button onClick={onClose} className="p-3 hover:bg-red-50 rounded-xl transition-colors text-red-500"><X size={20} /></button>
          </div>
        </div>

        {/* Contenu du contrat */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-10 md:p-16 max-w-3xl mx-auto space-y-10 font-serif">

            {/* En-tête */}
            <div className="flex justify-between items-start border-b-2 border-black pb-8">
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter leading-none font-sans">
                  Shift <span style={{ color: GOLD }}>Luxury</span>
                </h1>
                <p className="text-xs font-sans font-bold uppercase tracking-[0.3em] text-zinc-400 mt-1">Location de Véhicules de Prestige</p>
                <div className="mt-4 text-xs text-zinc-600 leading-relaxed">
                  <p>SARL SHIFT LUXURY — Capital : 10 000 €</p>
                  <p>SIRET : XXX XXX XXX 00001</p>
                  <p>RCS Paris B XXX XXX XXX</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block bg-black text-white px-6 py-3 rounded-xl font-sans">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Contrat N°</p>
                  <p className="text-lg font-black">{reservation.id}</p>
                </div>
                <p className="text-xs text-zinc-500 mt-3">Fait à Paris, le {today}</p>
              </div>
            </div>

            <h2 className="text-center text-xl font-black uppercase tracking-widest font-sans border border-black py-4 rounded-xl">
              Contrat de Location de Véhicule
            </h2>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-8">
              <div className="border border-zinc-200 rounded-xl p-6">
                <p className="text-[9px] font-sans font-black uppercase tracking-widest mb-3 pb-2 border-b border-zinc-100" style={{ color: GOLD }}>
                  Le Loueur (Bailleur)
                </p>
                <p className="font-black text-sm font-sans">{reservation.shopName || 'SHIFT LUXURY'}</p>
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                  {reservation.shopAddress || '12 Avenue Montaigne, 75008 Paris'}<br />
                  Tél : {reservation.shopPhone || '+33 1 00 00 00 00'}<br />
                  Email : contact@shift-luxury.fr
                </p>
                <p className="text-[9px] font-sans font-bold uppercase text-zinc-400 mt-3">Code boutique : {reservation.storeCode || 'SHIFT-XXXXX'}</p>
              </div>
              <div className="border border-zinc-200 rounded-xl p-6">
                <p className="text-[9px] font-sans font-black uppercase tracking-widest mb-3 pb-2 border-b border-zinc-100" style={{ color: GOLD }}>
                  Le Locataire (Preneur)
                </p>
                <p className="font-black text-sm font-sans">{reservation.client?.name || '___________________________'}</p>
                <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                  Tél : {reservation.client?.phone || '___________________________'}<br />
                  Email : {reservation.client?.email || '___________________________'}<br />
                  Permis N° : {reservation.client?.license || '___________________________'}
                </p>
              </div>
            </div>

            {/* Véhicule */}
            <div className="border-2 border-black rounded-xl overflow-hidden">
              <div className="bg-black text-white px-6 py-3">
                <p className="text-[9px] font-sans font-black uppercase tracking-widest">Désignation du Véhicule</p>
              </div>
              <div className="p-6 grid grid-cols-3 gap-6 text-sm">
                <div><p className="text-[9px] font-sans font-bold uppercase text-zinc-400 mb-1">Marque / Modèle</p><p className="font-black font-sans">{reservation.vehicle?.model || '_______________'}</p></div>
                <div><p className="text-[9px] font-sans font-bold uppercase text-zinc-400 mb-1">Immatriculation</p><p className="font-black font-sans">{reservation.vehicle?.plate || '_______________'}</p></div>
                <div><p className="text-[9px] font-sans font-bold uppercase text-zinc-400 mb-1">Kilométrage départ</p><p className="font-black font-sans">{reservation.vehicle?.mileage || '_______________'}</p></div>
                <div><p className="text-[9px] font-sans font-bold uppercase text-zinc-400 mb-1">Carburant</p><p className="font-black font-sans">{reservation.vehicle?.fuel || '_______________'}</p></div>
                <div><p className="text-[9px] font-sans font-bold uppercase text-zinc-400 mb-1">Couleur</p><p className="font-black font-sans">{reservation.vehicle?.color || '_______________'}</p></div>
                <div><p className="text-[9px] font-sans font-bold uppercase text-zinc-400 mb-1">Valeur assurée</p><p className="font-black font-sans">{reservation.vehicle?.value || '_______________'} €</p></div>
              </div>
            </div>

            {/* Période & Tarif */}
            <div className="grid grid-cols-2 gap-6">
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <div className="bg-zinc-50 px-6 py-3 border-b border-zinc-100">
                  <p className="text-[9px] font-sans font-black uppercase tracking-widest">Période de Location</p>
                </div>
                <div className="p-6 space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">Départ :</span><span className="font-black font-sans">{startDate}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Retour :</span><span className="font-black font-sans">{endDate}</span></div>
                  <div className="flex justify-between border-t border-zinc-100 pt-3"><span className="text-zinc-500">Durée :</span><span className="font-black font-sans">{duration} jour(s)</span></div>
                </div>
              </div>
              <div className="border-2 rounded-xl overflow-hidden" style={{ borderColor: GOLD }}>
                <div className="px-6 py-3 border-b" style={{ background: GOLD }}>
                  <p className="text-[9px] font-sans font-black uppercase tracking-widest text-black">Détail Financier</p>
                </div>
                <div className="p-6 space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">Tarif/jour :</span><span className="font-black font-sans">{reservation.vehicle?.price || '___'} €</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Caution :</span><span className="font-black font-sans">{reservation.vehicle?.deposit || '2 000'} €</span></div>
                  <div className="flex justify-between border-t border-zinc-100 pt-3 text-lg"><span className="font-black">Total TTC :</span><span className="font-black font-sans" style={{ color: GOLD }}>{totalPrice} €</span></div>
                </div>
              </div>
            </div>

            {/* Conditions générales */}
            <div className="border border-zinc-200 rounded-xl p-6 space-y-4">
              <p className="text-[9px] font-sans font-black uppercase tracking-widest mb-4" style={{ color: GOLD }}>Conditions Générales de Location</p>
              {[
                { num: '1', title: 'PRISE EN CHARGE DU VÉHICULE', text: "Le locataire reconnaît avoir pris possession du véhicule en bon état de fonctionnement, propre, avec le plein de carburant. Un état des lieux contradictoire est établi au départ et au retour. Toute dégradation non mentionnée à l'état des lieux de départ sera imputée au locataire." },
                { num: '2', title: 'UTILISATION DU VÉHICULE', text: "Le locataire s'engage à utiliser le véhicule en conducteur prudent et responsable, dans le respect du Code de la Route. Toute utilisation sur circuit, piste ou compétition est formellement interdite. Le véhicule ne peut être sous-loué ou confié à un tiers non déclaré au contrat." },
                { num: '3', title: 'ASSURANCE ET RESPONSABILITÉS', text: "Le véhicule est assuré tous risques pendant la durée de la location. La franchise en cas de sinistre est à la charge du locataire selon les conditions en vigueur. En cas d'accident, le locataire doit contacter le loueur immédiatement et remplir le constat amiable." },
                { num: '4', title: 'CAUTION', text: `Une caution de ${reservation.vehicle?.deposit || '2 000'} € est prélevée à la remise des clés. Elle sera restituée dans un délai de 7 jours ouvrés après le retour du véhicule, déduction faite de toute réparation éventuelle, contraventions ou frais de remise en état.` },
                { num: '5', title: 'RETARD DE RESTITUTION', text: "Tout retard dans la restitution du véhicule sans accord préalable du loueur sera facturé au double du tarif journalier. Passé 24h de retard non justifié, le loueur se réserve le droit de déclarer le véhicule volé auprès des autorités compétentes." },
                { num: '6', title: 'CARBURANT', text: "Le véhicule est remis avec le plein de carburant et doit être restitué dans les mêmes conditions. À défaut, des frais de remise à niveau seront facturés, majorés d'une pénalité de service de 30 €." },
                { num: '7', title: 'RÉSILIATION', text: "Toute annulation intervenant moins de 48h avant la prise en charge entraîne la facturation de 50% du montant total de la location. Toute annulation moins de 24h avant est facturée à 100%." },
                { num: '8', title: 'LITIGES ET JURIDICTION', text: "En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, le Tribunal de Commerce de Paris sera seul compétent, même en cas de pluralité de défendeurs ou d'appel en garantie." },
              ].map(({ num, title, text }) => (
                <div key={num} className="space-y-1">
                  <p className="text-xs font-black font-sans uppercase">Article {num} — {title}</p>
                  <p className="text-xs text-zinc-600 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-12 pt-6 border-t-2 border-black">
              <div>
                <p className="text-[9px] font-sans font-black uppercase tracking-widest text-zinc-400 mb-4">Signature du Loueur</p>
                <p className="text-xs text-zinc-500 mb-6">Lu et approuvé, bon pour accord</p>
                <div className="h-24 flex items-end pb-2 border-b border-zinc-300">
                  <p className="font-serif italic text-2xl text-zinc-700">Shift Luxury</p>
                </div>
                <p className="text-[9px] font-sans text-zinc-400 mt-2">{today}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[9px] font-sans font-black uppercase tracking-widest" style={{ color: GOLD }}>Signature du Locataire</p>
                  <button onClick={clearSignature} className="text-zinc-300 hover:text-red-500 transition-colors print:hidden"><Eraser size={14} /></button>
                </div>
                <p className="text-xs text-zinc-500 mb-2">Lu et approuvé, bon pour accord</p>
                <div className="h-24 bg-zinc-50 rounded-xl border border-zinc-200 relative overflow-hidden print:hidden flex items-center justify-center">
                  {SignaturePad ? (
                    <SignaturePad ref={sigPad} canvasProps={{ className: "w-full h-full cursor-crosshair" }} onEnd={() => setIsSigned(true)} />
                  ) : (
                    <div className="text-center p-4 cursor-pointer" onClick={() => setIsSigned(true)}>
                      <AlertCircle className="mx-auto mb-2 text-zinc-300" size={20} />
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Zone de signature</p>
                    </div>
                  )}
                </div>
                <p className="text-[9px] font-sans text-zinc-400 mt-2">{today}</p>
              </div>
            </div>

            <p className="text-center text-[9px] text-zinc-400 font-sans border-t border-zinc-100 pt-6">
              Contrat généré par SHIFT LUXURY SaaS • Plateforme de gestion de flotte • {today}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-4 print:hidden">
          <button onClick={onClose} className="px-8 py-4 text-zinc-500 font-black uppercase tracking-widest text-[10px]">Annuler</button>
          <button disabled={!isSigned} onClick={handleSign}
            className="px-10 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#D4AF37] disabled:opacity-30 transition-all flex items-center gap-3">
            <CheckCircle2 size={16} /> Valider & Signer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
