import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * verifyStartup
 * Verifica saúde de uma startup (ou todas com is_active=true).
 * Payload:
 *   { startup_id: string }         → verifica uma startup específica
 *   { verify_all: true }           → verifica todas as ativas (apenas admin)
 *
 * Checks:
 *   1. Site online (HEAD request, timeout 8s)
 *   2. SSL válido (HTTPS)
 *   3. Email de contato preenchido
 *
 * Critério de alerta automático: site offline → verification_alert = true
 * Não desativa automaticamente — a desativação é decisão manual do admin.
 */

const TIMEOUT_MS = 8000;

async function checkSite(website) {
  if (!website) return { site_online: false, response_time_ms: null, ssl_valid: false, observations: "Sem website cadastrado" };

  // Normaliza URL
  let url = website.trim();
  if (!url.startsWith("http")) url = "https://" + url;

  const ssl_valid = url.startsWith("https://");
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    const response_time_ms = Date.now() - start;
    const site_online = res.ok || res.status < 500;

    return {
      site_online,
      response_time_ms,
      ssl_valid,
      observations: site_online
        ? `HTTP ${res.status} — ${response_time_ms}ms`
        : `HTTP ${res.status} — site retornou erro`
    };
  } catch (err) {
    const response_time_ms = Date.now() - start;
    const timedOut = err.name === "AbortError";
    return {
      site_online: false,
      response_time_ms,
      ssl_valid,
      observations: timedOut ? `Timeout após ${TIMEOUT_MS}ms` : `Erro de conexão: ${err.message}`
    };
  }
}

async function verifyOne(base44, startup) {
  const siteCheck = await checkSite(startup.website);
  const has_contact = !!(startup.contact_email || startup.contact_whatsapp);

  const verification_status = {
    site_online: siteCheck.site_online,
    response_time_ms: siteCheck.response_time_ms,
    ssl_valid: siteCheck.ssl_valid,
    has_contact,
    observations: [
      siteCheck.observations,
      !has_contact ? "Sem contato (email/whatsapp) cadastrado" : null,
    ].filter(Boolean).join(" | "),
  };

  // Dispara alerta se site offline. Não desativa automaticamente.
  const verification_alert = !siteCheck.site_online;

  await base44.asServiceRole.entities.Startup.update(startup.id, {
    last_verified_at: new Date().toISOString(),
    verification_status,
    verification_alert,
  });

  return { id: startup.id, name: startup.name, ...verification_status, verification_alert };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { startup_id, verify_all } = body;

    if (startup_id) {
      // Verifica startup específica
      const startup = await base44.asServiceRole.entities.Startup.filter({ id: startup_id });
      if (!startup.length) return Response.json({ error: 'Startup não encontrada' }, { status: 404 });
      const result = await verifyOne(base44, startup[0]);
      return Response.json({ success: true, result });
    }

    if (verify_all) {
      // Verifica todas ativas com website
      const startups = await base44.asServiceRole.entities.Startup.filter({ is_deleted: false, is_active: true });
      const withSite = startups.filter(s => s.website);
      const results = [];

      for (const s of withSite) {
        const r = await verifyOne(base44, s);
        results.push(r);
      }

      const alerts = results.filter(r => r.verification_alert).length;
      return Response.json({ success: true, total: results.length, alerts, results });
    }

    return Response.json({ error: 'Forneça startup_id ou verify_all: true' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});