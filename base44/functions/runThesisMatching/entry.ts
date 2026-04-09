import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const thesisId = body.thesisId;
    const corporateId = body.corporateId;

    if (!thesisId || !corporateId) {
      return Response.json({ error: 'Missing thesisId or corporateId' }, { status: 400 });
    }

    const allTheses = await base44.asServiceRole.entities.InnovationThesis.list();
    const thesisData = allTheses.find(t => t.id === thesisId);
    
    if (!thesisData) {
      return Response.json({ error: 'Thesis not found' }, { status: 404 });
    }

    let diagnosticData = null;
    let aiReadinessData = null;

    if (thesisData.session_id) {
      const allSessions = await base44.asServiceRole.entities.DiagnosticSession.list();
      diagnosticData = allSessions.find(s => s.id === thesisData.session_id);
    }

    const allAssessments = await base44.asServiceRole.entities.AIAssessment.list();
    aiReadinessData = allAssessments.find(a => a.corporate_id === corporateId);

    const allStartups = await base44.asServiceRole.entities.Startup.list();
    const activeStartups = allStartups.filter(s => s.is_active && !s.is_deleted);

    const allMatches = await base44.asServiceRole.entities.StartupMatch.list();
    const oldMatches = allMatches.filter(m => m.thesis_id === thesisId);
    for (const match of oldMatches) {
      await base44.asServiceRole.entities.StartupMatch.delete(match.id);
    }

    const startupsText = activeStartups.map(s => 
      s.id + ' | ' + s.name + ' | ' + (s.category || '') + ' | ' + (s.vertical || '') + ' | ' + (s.stage || '') + ' | ' + (s.business_model || '') + ' | ' + (s.description?.substring(0, 80) || '') + ' | ' + (s.tags || []).join(',')
    ).join('\n');

    const prompt = 'Analyze fit between thesis and startups.\n\nTHESIS:\nName: ' + thesisData.name + '\nText: ' + thesisData.thesis_text + '\nCategories: ' + (thesisData.macro_categories || []).join(', ') + '\nTags: ' + (thesisData.tags || []).join(', ') + '\n\nSTARTUPS:\n' + startupsText + '\n\nFor each startup, return startup_id, fit_score (0-100), score_tags, score_modelo, score_impacto, category_match, fit_reasons (array), risk_reasons (array). Differentiate scores - no uniforms. Semantic match is primary. Return JSON array inside evaluations field only.';

    const startupEvaluations = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          evaluations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                startup_id: { type: 'string' },
                fit_score: { type: 'number' },
                score_tags: { type: 'number' },
                score_modelo: { type: 'number' },
                score_impacto: { type: 'number' },
                category_match: { type: 'string' },
                fit_reasons: { type: 'array', items: { type: 'string' } },
                risk_reasons: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    });

    const newMatches = [];
    if (startupEvaluations && startupEvaluations.evaluations && Array.isArray(startupEvaluations.evaluations)) {
      for (const record of startupEvaluations.evaluations) {
        const startup = activeStartups.find(s => s.id === record.startup_id);
        if (!startup) continue;

        newMatches.push({
          corporate_id: corporateId,
          thesis_id: thesisId,
          startup_id: record.startup_id,
          fit_score: record.fit_score,
          score_tags: record.score_tags,
          score_modelo: record.score_modelo,
          score_impacto: record.score_impacto,
          fit_reasons: record.fit_reasons || [],
          risk_reasons: record.risk_reasons || [],
          category_match: record.category_match || 'Geral',
          tags_matched: (startup.tags || []).filter(t => 
            thesisData.tags.some(tt => tt.toLowerCase() === t.toLowerCase())
          ),
          status: 'suggested',
        });
      }
    }

    newMatches.sort((a, b) => b.fit_score - a.fit_score);

    if (newMatches.length > 0) {
      await base44.asServiceRole.entities.StartupMatch.bulkCreate(newMatches);
    }

    await base44.asServiceRole.entities.InnovationThesis.update(thesisId, {
      matching_ran: true,
      matching_ran_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      matchesCreated: newMatches.length,
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});