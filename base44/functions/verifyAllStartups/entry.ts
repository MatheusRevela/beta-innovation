import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * verifyAllStartups
 * Wrapper chamado pelo cron semanal.
 * Invoca verifyStartup com verify_all: true via service role.
 * Não requer autenticação de usuário (chamado pelo scheduler).
 */

const TIMEOUT_MS = 8000;

async function checkSite(website) {
  if (!website) return { site_online: false, response_time_ms: null, ssl_valid: false, observations: "Sem website cadastrado" };
  let url = website.trim();
  if (!url.startsWith("http")) url = "https://" + url;
  const ssl_valid = url.startsWith("https://");
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    clearTimeout(timeout);
    const response_time_ms = Date.now() - start;
    const site_online = res.ok || res.status < 500;
    return { site_online, response_time_ms, ssl_valid, observations: site_online ? `HTTP ${res.status} — ${response_time_ms}ms` : `HTTP ${res.status} — erro` };
  } catch (err) {
    const response_time_ms = Date.now() - start;
    return { site_online: false, response_time_ms, ssl_valid, observations: err.name === "AbortError" ? `Timeout após ${TIMEOUT_MS}ms` : `Erro: ${err.message}` };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const startups = await base44.asServiceRole.entities.Startup.filter({ is_deleted: false, is_active: true });
    const withSite = startups.filter(s => s.website);

    let alerts = 0;
    for (const startup of withSite) {
      const siteCheck = await checkSite(startup.website);
      const has_contact = !!(startup.contact_email || startup.contact_whatsapp);
      const verification_status = {
        site_online: siteCheck.site_online,
        response_time_ms: siteCheck.response_time_ms,
        ssl_valid: siteCheck.ssl_valid,
        has_contact,
        observations: [siteCheck.observations, !has_contact ? "Sem contato cadastrado" : null].filter(Boolean).join(" | "),
      };
      const verification_alert = !siteCheck.site_online;
      if (verification_alert) alerts++;

      await base44.asServiceRole.entities.Startup.update(startup.id, {
        last_verified_at: new Date().toISOString(),
        verification_status,
        verification_alert,
      });
    }

    console.log(`[verifyAllStartups] ${withSite.length} verificadas, ${alerts} alertas.`);
    return Response.json({ success: true, total: withSite.length, alerts });
  } catch (error) {
    console.error("[verifyAllStartups] Erro:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});