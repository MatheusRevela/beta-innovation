import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { thesisId, corporateId } = await req.json();

    if (!thesisId || !corporateId) {
      return Response.json({ error: 'Missing thesisId or corporateId' }, { status: 400 });
    }

    // Fetch thesis using asServiceRole
    const allTheses = await base44.asServiceRole.entities.InnovationThesis.list();
    const thesisData = allTheses.find(t => t.id === thesisId);
    
    if (!thesisData) {
      return Response.json({ error: 'Thesis not found' }, { status: 404 });
    }

    const thesisTags = new Set((thesisData.tags || []).map(t => t.toLowerCase()));
    const thesisCategories = new Set((thesisData.macro_categories || []).map(c => c.toLowerCase()));

    // Fetch all active startups
    const startups = await base44.asServiceRole.entities.Startup.list();
    const activeStartups = startups.filter(s => s.is_active && !s.is_deleted);

    // Delete old matches for this thesis
    const allMatches = await base44.asServiceRole.entities.StartupMatch.list();
    const oldMatches = allMatches.filter(m => m.thesis_id === thesisId);
    for (const match of oldMatches) {
      await base44.asServiceRole.entities.StartupMatch.delete(match.id);
    }

    // Calculate matches
    const newMatches = [];
    for (const startup of activeStartups) {
      const startupTags = new Set((startup.tags || []).map(t => t.toLowerCase()));
      const startupCategory = (startup.category || '').toLowerCase();

      // Score 1: Tag alignment (50%)
      const tagMatches = Array.from(thesisTags).filter(t => startupTags.has(t)).length;
      const tagScore = Math.min(100, (tagMatches / Math.max(1, thesisTags.size)) * 100);

      // Score 2: Business model relevance (30%)
      const modelScore = startup.business_model ? 60 : 40;

      // Score 3: Impact potential (20%)
      const impactScore = startup.stage === 'Scale' || startup.stage === 'Growth' ? 90 : (startup.stage === 'PMF' ? 70 : 50);

      // Weighted fit score
      const fitScore = (tagScore * 0.5) + (modelScore * 0.3) + (impactScore * 0.2);

      // Find category match
      let categoryMatch = null;
      for (const cat of thesisCategories) {
        if (startupCategory.includes(cat) || cat.includes(startupCategory)) {
          categoryMatch = thesisData.macro_categories.find(c => c.toLowerCase() === cat);
          break;
        }
      }

      newMatches.push({
        corporate_id: corporateId,
        thesis_id: thesisId,
        startup_id: startup.id,
        fit_score: Math.round(fitScore),
        score_tags: Math.round(tagScore),
        score_modelo: modelScore,
        score_impacto: impactScore,
        fit_reasons: [
          tagMatches > 0 ? `${tagMatches} tags alinhadas` : null,
          startup.stage ? `Estágio: ${startup.stage}` : null,
          startup.business_model ? `Modelo: ${startup.business_model}` : null,
        ].filter(Boolean),
        risk_reasons: [],
        category_match: categoryMatch || 'Geral',
        tags_matched: Array.from(thesisTags).filter(t => startupTags.has(t)),
        status: 'suggested',
      });
    }

    // Bulk create matches
    if (newMatches.length > 0) {
      await base44.asServiceRole.entities.StartupMatch.bulkCreate(newMatches);
    }

    // Mark thesis as matching_ran
    await base44.asServiceRole.entities.InnovationThesis.update(thesisId, {
      matching_ran: true,
      matching_ran_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      matchesCreated: newMatches.length,
    });
  } catch (error) {
    console.error('Matching error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});