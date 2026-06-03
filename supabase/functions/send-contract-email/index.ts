const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { clientEmail, clientName, merchantEmail, contractHtml, vehicleModel, startDate, endDate, totalPrice } = await req.json();
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    const wrapperHtml = (title: string, content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <div style="max-width:700px;margin:0 auto;background:white">
    <div style="background:#000;padding:24px 32px;text-align:center">
      <h1 style="color:white;margin:0;font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:-1px">
        Shift <span style="color:#D4AF37">Luxury</span>
      </h1>
      <p style="color:#888;margin:6px 0 0;font-size:10px;text-transform:uppercase;letter-spacing:3px">Location de Véhicules de Prestige</p>
    </div>
    <div style="padding:32px;background:#f9f9f9;border-bottom:1px solid #eee">
      <h2 style="margin:0 0 8px;font-size:18px;font-weight:900;text-transform:uppercase">${title}</h2>
      <p style="margin:0;color:#666;font-size:13px">Bonjour ${clientName}, votre contrat de location a été signé avec succès.</p>
    </div>
    <div style="padding:24px 32px;background:#fff">
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr style="background:#f9f9f9"><td style="padding:12px 16px;font-size:11px;color:#999;font-weight:700;text-transform:uppercase;width:40%">Véhicule</td><td style="padding:12px 16px;font-size:13px;font-weight:900">${vehicleModel}</td></tr>
        <tr><td style="padding:12px 16px;font-size:11px;color:#999;font-weight:700;text-transform:uppercase">Départ</td><td style="padding:12px 16px;font-size:13px;font-weight:700">${startDate}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:12px 16px;font-size:11px;color:#999;font-weight:700;text-transform:uppercase">Retour</td><td style="padding:12px 16px;font-size:13px;font-weight:700">${endDate}</td></tr>
        <tr style="background:#D4AF37"><td style="padding:14px 16px;font-size:12px;font-weight:900;text-transform:uppercase">Total TTC</td><td style="padding:14px 16px;font-size:18px;font-weight:900">${totalPrice} €</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      ${contractHtml ? `<div style="font-size:11px;color:#666;line-height:1.6">${contractHtml}</div>` : ''}
    </div>
    <div style="background:#f5f5f5;padding:16px;text-align:center;border-top:1px solid #eee">
      <p style="color:#bbb;font-size:10px;margin:0;text-transform:uppercase;letter-spacing:2px">Shift Luxury SaaS • Plateforme de gestion de flotte</p>
    </div>
  </div>
</body>
</html>`;

    // Email client
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Shift Luxury <onboarding@resend.dev>',
        to: [clientEmail],
        subject: `✅ Votre contrat de location — ${vehicleModel}`,
        html: wrapperHtml('Contrat signé ✅', ''),
      }),
    });

    // Email marchand
    if (merchantEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Shift Luxury <onboarding@resend.dev>',
          to: [merchantEmail],
          subject: `📋 Contrat signé par ${clientName} — ${vehicleModel}`,
          html: wrapperHtml(`Contrat signé par ${clientName}`, ''),
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
