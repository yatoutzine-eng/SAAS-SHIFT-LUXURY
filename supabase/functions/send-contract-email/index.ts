const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { 
      clientEmail, clientName, clientPhone, clientLicense,
      merchantEmail, merchantName,
      vehicleModel, startDate, endDate, totalPrice, duration,
      signatureData, reservationId,
      isConfirmation, isPending
    } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    const header = `
      <div style="background:#000;padding:28px 40px;text-align:center">
        <div style="font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:-1px;color:white">Shift <span style="color:#D4AF37">Luxury</span></div>
        <div style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:3px;margin-top:6px">Location de Véhicules de Prestige</div>
      </div>`;

    const footer = `
      <div style="background:#000;padding:20px 40px;text-align:center">
        <p style="color:#555;font-size:10px;margin:0;text-transform:uppercase;letter-spacing:2px">Shift Luxury SaaS • ${today}</p>
      </div>`;

    const recap = `
      <div style="margin:0 40px 28px;border:1px solid #eee;border-radius:12px;overflow:hidden">
        <div style="background:#f9f9f9;padding:12px 20px;border-bottom:1px solid #eee">
          <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#999">Détails de la Réservation</div>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:14px 20px;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;width:45%;border-bottom:1px solid #f5f5f5">N° Réservation</td><td style="padding:14px 20px;font-size:13px;font-weight:900;border-bottom:1px solid #f5f5f5">${reservationId?.slice(0,8).toUpperCase() || '—'}</td></tr>
          <tr style="background:#fafafa"><td style="padding:14px 20px;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;border-bottom:1px solid #f5f5f5">Véhicule</td><td style="padding:14px 20px;font-size:13px;font-weight:900;border-bottom:1px solid #f5f5f5">${vehicleModel}</td></tr>
          <tr><td style="padding:14px 20px;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;border-bottom:1px solid #f5f5f5">Agence</td><td style="padding:14px 20px;font-size:13px;font-weight:700;border-bottom:1px solid #f5f5f5">${merchantName || 'Shift Luxury'}</td></tr>
          <tr style="background:#fafafa"><td style="padding:14px 20px;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;border-bottom:1px solid #f5f5f5">Départ</td><td style="padding:14px 20px;font-size:13px;font-weight:700;border-bottom:1px solid #f5f5f5">${startDate}</td></tr>
          <tr><td style="padding:14px 20px;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;border-bottom:1px solid #f5f5f5">Retour</td><td style="padding:14px 20px;font-size:13px;font-weight:700;border-bottom:1px solid #f5f5f5">${endDate}</td></tr>
          <tr style="background:#fafafa"><td style="padding:14px 20px;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;border-bottom:1px solid #f5f5f5">Durée</td><td style="padding:14px 20px;font-size:13px;font-weight:700;border-bottom:1px solid #f5f5f5">${duration} jour(s)</td></tr>
          <tr style="background:#000"><td style="padding:16px 20px;font-size:12px;font-weight:900;text-transform:uppercase;color:#D4AF37">Total TTC</td><td style="padding:16px 20px;font-size:20px;font-weight:900;color:#D4AF37">${totalPrice} €</td></tr>
        </table>
      </div>`;

    // ── Email "demande reçue" (isPending) ──
    const pendingEmail = () => `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif">
<div style="max-width:680px;margin:20px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1)">
  ${header}
  <div style="background:#F59E0B;padding:16px 40px;text-align:center">
    <div style="font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#000">⏳ Demande de Réservation Reçue</div>
  </div>
  <div style="padding:32px 40px 0">
    <p style="font-size:15px;color:#333;margin:0 0 6px">Bonjour <strong>${clientName}</strong>,</p>
    <p style="font-size:13px;color:#666;margin:0 0 28px;line-height:1.6">
      Votre demande de réservation pour le véhicule <strong>${vehicleModel}</strong> a bien été reçue. 
      L'agence <strong>${merchantName || 'Shift Luxury'}</strong> va examiner votre demande et vous envoyer une confirmation sous peu.
    </p>
  </div>
  ${recap}
  <div style="margin:0 40px 28px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px">
    <div style="font-size:10px;font-weight:900;text-transform:uppercase;color:#d97706;letter-spacing:2px;margin-bottom:10px">Prochaines Étapes</div>
    <ul style="margin:0;padding:0 0 0 16px;font-size:12px;color:#333;line-height:2">
      <li>L'agence examine votre demande</li>
      <li>Vous recevrez un email de confirmation</li>
      <li>Un contrat de location sera ensuite généré</li>
      <li>La caution sera prélevée à la remise des clés</li>
    </ul>
  </div>
  ${footer}
</div></body></html>`;

    // ── Email "confirmation" (isConfirmation) ──
    const confirmationEmail = () => `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif">
<div style="max-width:680px;margin:20px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1)">
  ${header}
  <div style="background:#22c55e;padding:16px 40px;text-align:center">
    <div style="font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#fff">✅ Réservation Confirmée !</div>
  </div>
  <div style="padding:32px 40px 0">
    <p style="font-size:15px;color:#333;margin:0 0 6px">Bonjour <strong>${clientName}</strong>,</p>
    <p style="font-size:13px;color:#666;margin:0 0 28px;line-height:1.6">
      Votre réservation pour le véhicule <strong>${vehicleModel}</strong> a été <strong style="color:#22c55e">confirmée</strong> par ${merchantName || 'Shift Luxury'}. Vous serez contacté prochainement pour la signature du contrat.
    </p>
  </div>
  ${recap}
  <div style="margin:0 40px 28px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px">
    <div style="font-size:10px;font-weight:900;text-transform:uppercase;color:#16a34a;letter-spacing:2px;margin-bottom:10px">Prochaines Étapes</div>
    <ul style="margin:0;padding:0 0 0 16px;font-size:12px;color:#333;line-height:2">
      <li>L'agence vous contactera pour fixer le rendez-vous</li>
      <li>Un contrat de location sera généré et signé</li>
      <li>La caution sera prélevée à la remise des clés</li>
    </ul>
  </div>
  ${footer}
</div></body></html>`;

    // ── Email "contrat signé" ──
    const contractEmail = (isClient: boolean) => `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif">
<div style="max-width:680px;margin:20px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1)">
  ${header}
  <div style="background:#D4AF37;padding:16px 40px;text-align:center">
    <div style="font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#000">✅ Contrat de Location Signé</div>
  </div>
  <div style="padding:32px 40px 0">
    <p style="font-size:15px;color:#333;margin:0 0 6px">Bonjour <strong>${isClient ? clientName : merchantName || 'Marchand'}</strong>,</p>
    <p style="font-size:13px;color:#666;margin:0 0 28px;line-height:1.6">
      ${isClient 
        ? `Votre contrat de location pour le véhicule <strong>${vehicleModel}</strong> a été signé avec succès.`
        : `Le contrat de location pour <strong>${clientName}</strong> a été signé.`}
    </p>
  </div>
  ${recap}
  <div style="margin:0 40px 28px;display:flex;gap:16px">
    <div style="flex:1;border:1px solid #eee;border-radius:12px;padding:20px">
      <div style="font-size:9px;font-weight:900;text-transform:uppercase;color:#D4AF37;letter-spacing:2px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f0f0f0">Le Loueur</div>
      <div style="font-size:13px;font-weight:900">${merchantName || 'Shift Luxury'}</div>
    </div>
    <div style="flex:1;border:1px solid #eee;border-radius:12px;padding:20px">
      <div style="font-size:9px;font-weight:900;text-transform:uppercase;color:#D4AF37;letter-spacing:2px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f0f0f0">Le Locataire</div>
      <div style="font-size:13px;font-weight:900">${clientName}</div>
      <div style="font-size:11px;color:#666">${clientEmail || ''}</div>
    </div>
  </div>
  ${signatureData && signatureData !== 'signed' ? `
  <div style="margin:0 40px 28px;border:1px solid #eee;border-radius:12px;padding:20px">
    <div style="font-size:9px;font-weight:900;text-transform:uppercase;color:#D4AF37;letter-spacing:2px;margin-bottom:12px">Signature du Locataire</div>
    <img src="${signatureData}" style="max-height:60px;max-width:200px;display:block"/>
    <div style="font-size:10px;color:#999;margin-top:8px">${today}</div>
  </div>` : ''}
  <div style="margin:0 40px 28px;background:#f9f9f9;border-radius:12px;padding:20px">
    <div style="font-size:10px;font-weight:900;text-transform:uppercase;color:#999;letter-spacing:2px;margin-bottom:12px">Rappel des Conditions</div>
    <ul style="margin:0;padding:0 0 0 16px;font-size:11px;color:#666;line-height:2">
      <li>Véhicule restitué en même état qu'à la prise en charge</li>
      <li>Plein de carburant obligatoire au retour</li>
      <li>Caution restituée sous 7 jours après retour</li>
    </ul>
  </div>
  ${footer}
</div></body></html>`;

    // ── Routage des emails ──
    if (isPending) {
      if (clientEmail) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Shift Luxury <onboarding@resend.dev>',
            to: [clientEmail],
            subject: `⏳ Demande reçue — ${vehicleModel}`,
            html: pendingEmail(),
          }),
        });
      }
    } else if (isConfirmation) {
      if (clientEmail) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Shift Luxury <onboarding@resend.dev>',
            to: [clientEmail],
            subject: `✅ Réservation confirmée — ${vehicleModel}`,
            html: confirmationEmail(),
          }),
        });
      }
    } else {
      if (clientEmail) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Shift Luxury <onboarding@resend.dev>',
            to: [clientEmail],
            subject: `✅ Votre contrat signé — ${vehicleModel}`,
            html: contractEmail(true),
          }),
        });
      }
      if (merchantEmail) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Shift Luxury <onboarding@resend.dev>',
            to: [merchantEmail],
            subject: `📋 Contrat signé — ${clientName} · ${vehicleModel}`,
            html: contractEmail(false),
          }),
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
