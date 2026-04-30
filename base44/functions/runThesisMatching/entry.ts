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

    // Fetch thesis, assessments and startups in parallel for efficiency
    const [thesisList, assessments] = await Promise.all([
      base44.asServiceRole.entities.InnovationThesis.filter({ corporate_id: corporateId }),
      base44.asServiceRole.entities.AIAssessment.filter({ corporate_id: corporateId }),
    ]);

    const thesisData = thesisList.find(t => t.id === thesisId);
    if (!thesisData) {
      return Response.json({ error: 'Thesis not found' }, { status: 404 });
    }

    let diagnosticData = null;
    const aiReadinessData = assessments[0] || null;

    if (thesisData.session_id) {
      const sessions = await base44.asServiceRole.entities.DiagnosticSession.filter({ corporate_id: corporateId });
      diagnosticData = sessions.find(s => s.id === thesisData.session_id) || null;
    }

    const allStartups = await base44.asServiceRole.entities.Startup.list();
    const activeStartups = allStartups.filter(s => s.is_active && !s.is_deleted);

    // Delete old matches for this thesis in parallel
    const allMatches = await base44.asServiceRole.entities.StartupMatch.filter({ thesis_id: thesisId });
    await Promise.all(allMatches.map(m => base44.asServiceRole.entities.StartupMatch.delete(m.id)));

    const startupsText = activeStartups.map(s => 
      s.id + '|' + s.name + '|' + (s.category || '') + '|' + (s.vertical || '') + '|' + (s.stage || '') + '|' + (s.business_model || '') + '|' + (s.description || '').substring(0, 150) + '|' + (s.value_proposition || '').substring(0, 100) + '|' + (s.tags || []).join(',')
    ).join('\n');

    const thesisCategories = (thesisData.macro_categories || []).join(', ');
    const thesisTags = (thesisData.tags || []).join(', ');
    const thesisPriorities = (thesisData.top_priorities || []).join(', ');

    const prompt = 'Você é um especialista em análise de aderência entre demandas corporativas e soluções de startups brasileiras. TAREFA: Analisar cada startup e avaliar seu nível de FIT com a seguinte demanda corporativa.\n\nDEMANDA (TESE DE INOVAÇÃO):\nTexto: ' + thesisData.thesis_text + '\nCategorias-chave: ' + thesisCategories + '\nPrioridades: ' + thesisPriorities + '\nTags/Áreas: ' + thesisTags + '\n\nCONTEXTO CORPORATIVO:\nAI Readiness Score: ' + (aiReadinessData?.global_score ? Math.round(aiReadinessData.global_score * 20) : 'N/A') + '% (escala 1-5 normalizada)\nDiagnóstico: ' + (diagnosticData ? 'Score ' + diagnosticData.overall_score + ', Nível: ' + diagnosticData.maturity_level : 'Não realizado') + '\n\nSTARTUPS (id|nome|categoria|vertical|estágio|modelo|descrição|proposta|tags):\n' + startupsText + '\n\nANÁLISE - Para CADA startup, retorne exatamente este JSON:\n{\n  "startup_id": "id da startup",\n  "fit_score": número 0-100,\n  "score_tags": número 0-100,\n  "score_modelo": número 0-100,\n  "score_impacto": número 0-100,\n  "category_match": string,\n  "fit_reasons": [string, string],\n  "risk_reasons": [string, string]\n}\n\nCRITÉRIOS DE ANÁLISE:\n1. SEMÂNTICA PROFUNDA (peso 50%): Leia description + value_proposition. A solução RESOLVE o problema descrito na tese? Há sobreposição clara entre as áreas mencionadas?\n   IMPORTANTE: Tags e categorias podem estar em inglês ou português — faça comparação SEMÂNTICA, não literal. "automation tools" = "automação de processos". "data analytics" = "análise de dados". Considere equivalências entre idiomas.\n   - Se houver semelhança superficial mas sem fit real = fit_score < 30\n   - Se resolver exatamente a dor descrita = fit_score > 75\n\n2. ALINHAMENTO SEMÂNTICO DE TAGS (peso 30%): Compare o SIGNIFICADO das tags da startup com as tags+categorias+prioridades da tese, independente do idioma\n   - Cada tag/conceito equivalente = +8 pontos em score_tags\n   - score_tags máx 100\n\n3. MODELO DE NEGÓCIO (peso 15%): SaaS/Plataforma/Software têm maior potencial de escala\n   - SaaS/Plataforma = 80-100. Hardware/Serviço específico = 40-70. Outro = 30-50\n\n4. ESTÁGIO & IMPACTO (peso 5%): Growth/Scale = 90. PMF = 70. MVP/Seed = 50. Ideação = 30\n\nREGRAS CRÍTICAS:\n- Scores NÃO podem ser uniformes. DEVE haver clara diferenciação\n- Se nenhuma sobreposição semântica clara: score máx 35\n- Se fit semântico FORTE: score mín 65\n- fit_reasons deve explicar POR QUÊ (específico à tese), em português\n- risk_reasons: gaps reais, não genéricos, em português\n\nRetorne APENAS um JSON array dentro de "evaluations". Sem markdown, sem explicações extras.';

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
    const seenStartupIds = new Set(); // Deduplicate: LLM may return same startup_id twice
    if (startupEvaluations && startupEvaluations.evaluations && Array.isArray(startupEvaluations.evaluations)) {
      for (const record of startupEvaluations.evaluations) {
        const startup = activeStartups.find(s => s.id === record.startup_id);
        if (!startup) continue;
        if (seenStartupIds.has(record.startup_id)) continue; // skip duplicates
        seenStartupIds.add(record.startup_id);

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
            thesisData.tags.some(tt => tt.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(tt.toLowerCase()))
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