export const PILLARS = [
  {
    id: "financas",
    label: "Finanças",
    emoji: "💰",
    title: "Finanças Empresariais",
    description: "Avalia o domínio sobre números, saúde financeira e capacidade de captação.",
    questions: [
      {
        text: "Qual é o nível de controle financeiro da startup?",
        hint: "Considere DRE, fluxo de caixa, balanço patrimonial e projeções.",
        options: [
          "Sem controle formal",
          "Planilhas simples de entradas/saídas",
          "DRE e fluxo de caixa parciais",
          "BP + DRE + FC + projeções estruturadas",
          "FP&A ativo + cenários e simulações"
        ]
      },
      {
        text: "Como está a saúde do caixa e a previsibilidade financeira?",
        hint: "Runway, burn rate e capacidade de projetar o futuro.",
        options: [
          "Não sabe o runway atual",
          "Runway estimado informalmente",
          "Burn rate e runway calculados mensalmente",
          "Rolling forecast ativo e atualizado",
          "Modelo financeiro dinâmico + plano de contingência"
        ]
      },
      {
        text: "Qual é o estágio da estratégia de captação de recursos?",
        hint: "Pitch, deck, data room, relacionamento com investidores.",
        options: [
          "Captação não iniciada",
          "Materiais em preparação",
          "Pitch deck e business plan prontos",
          "Data room estruturado + conversas ativas com investidores",
          "Term sheet em negociação"
        ]
      },
      {
        text: "O cap table e a estrutura de equity estão organizados?",
        hint: "Divisão de equity entre sócios, vesting, diluição planejada.",
        options: [
          "Sem organização formal",
          "Acordo verbal entre sócios apenas",
          "Cap table documentado formalmente",
          "Vesting + pool de opções definidos",
          "Diluição futura modelada em múltiplos cenários"
        ]
      }
    ]
  },
  {
    id: "produto",
    label: "Produto",
    emoji: "⚙️",
    title: "Produto",
    description: "Avalia a maturidade técnica, gestão de produto e capacidade de evoluir o produto de forma estruturada.",
    questions: [
      {
        text: "Qual é o nível de maturidade técnica do produto?",
        hint: "Infraestrutura, segurança cibernética, escalabilidade e arquitetura.",
        options: [
          "MVP sem preocupação de escala",
          "Em produção com dívida técnica significativa",
          "CI/CD implantado + segurança básica",
          "Observabilidade + LGPD compliant + APIs documentadas",
          "Enterprise-ready: SLA formal, auditoria e multi-tenant"
        ]
      },
      {
        text: "Como é feita a gestão e evolução do produto?",
        hint: "Roadmap, product discovery, métricas de produto e priorização.",
        options: [
          "Sem processo de gestão de produto",
          "Lista informal de features a construir",
          "Roadmap trimestral ativo com priorização",
          "Métricas de produto + testes A/B + heatmaps",
          "PM/PO dedicado + discovery contínuo orientado a dados"
        ]
      },
      {
        text: "Qual é a qualidade da experiência do usuário (UX/UI)?",
        hint: "Jornada do usuário, design, validação e usabilidade.",
        options: [
          "Sem atenção estruturada a UX",
          "Interface razoável sem validação com usuários",
          "Jornada do usuário mapeada + testes de usabilidade",
          "Pesquisa contínua com usuários + design system",
          "UX é diferencial competitivo comprovado com dados"
        ]
      },
      {
        text: "A startup adota novas tecnologias de forma estratégica?",
        hint: "Low-code, IA, open source, avaliação de hype cycle.",
        options: [
          "Adoção reativa ou por pressão externa",
          "Consciente das tendências mas adoção lenta",
          "Avalia tecnologias por ROI antes de adotar",
          "Experimenta em sprints dedicados antes de escalar",
          "Tecnologia é vantagem competitiva central do negócio"
        ]
      }
    ]
  },
  {
    id: "comercial",
    label: "Comercial",
    emoji: "📈",
    title: "Comercial",
    description: "Avalia a operação de vendas, marketing, gestão de clientes e métricas comerciais.",
    questions: [
      {
        text: "Como está estruturada a operação de vendas?",
        hint: "Processo, meios (inbound/outbound), pitch e métricas de funil.",
        options: [
          "Vendas por rede pessoal sem processo definido",
          "Abordagem comercial definida mas sem funil",
          "Pipeline estruturado + SDR/BDR com metas",
          "Multi-canal + playbook de vendas documentado",
          "Máquina de vendas com previsão de receita confiável"
        ]
      },
      {
        text: "Qual é o nível de gestão e conhecimento do cliente?",
        hint: "ICP, customer success, retenção e expansão de receita.",
        options: [
          "ICP não definido formalmente",
          "ICP intuitivo, não formalizado",
          "ICP documentado + customer success básico",
          "NPS monitorado + upsell + churn controlado",
          "NDR acima de 100% + clientes funcionam como canal"
        ]
      },
      {
        text: "As métricas de marketing e aquisição estão estruturadas?",
        hint: "CAC, LTV, payback, canais e eficácia de marketing.",
        options: [
          "Não conhece CAC nem LTV",
          "CAC calculado mas sem LTV definido",
          "CAC, LTV e payback period estimados",
          "Canais rankeados por CAC + SEO estruturado",
          "CAC decrescente + LTV crescente + atribuição completa"
        ]
      },
      {
        text: "A estratégia de precificação está definida e validada?",
        hint: "Metodologia de pricing, willingness to pay, posicionamento de preço.",
        options: [
          "Preço por feeling ou cópia de concorrentes",
          "Preço baseado em custo + margem simples",
          "Precificação por valor entregue ao cliente",
          "WTP pesquisado (Van Westendorp ou conjoint)",
          "Pricing como alavanca estratégica de crescimento"
        ]
      }
    ]
  },
  {
    id: "estrategia",
    label: "Estratégia",
    emoji: "🎯",
    title: "Estratégia",
    description: "Avalia a clareza estratégica, o estágio de evolução do negócio, o moat e o GTM.",
    questions: [
      {
        text: "Qual é o nível de clareza estratégica da empresa?",
        hint: "Visão, missão, valores, OKRs e planejamento.",
        options: [
          "Estratégia existe apenas na cabeça dos fundadores",
          "Visão esboçada mas sem OKRs ou metas formais",
          "Visão + missão + valores + metas anuais documentados",
          "OKRs trimestrais + KPIs monitorados ativamente",
          "Estratégia viva com toda a equipe alinhada e engajada"
        ]
      },
      {
        text: "Em que estágio de evolução está o negócio?",
        hint: "Ideação, validação, PMF, escala ou expansão.",
        options: [
          "Ideação (sem clientes pagantes ainda)",
          "Validação (MVP testado com usuários)",
          "Buscando PMF (primeiros clientes pagantes)",
          "PMF encontrado (alta retenção e receita recorrente)",
          "Escala ou expansão em curso"
        ]
      },
      {
        text: "Qual é a solidez do moat (vantagem competitiva)?",
        hint: "Barreiras de entrada, diferenciação e sustentabilidade da vantagem.",
        options: [
          "Produto facilmente copiável",
          "Diferenciação fraca ou temporária",
          "Vantagem em tecnologia ou base de clientes em crescimento",
          "Efeito de rede ou dados proprietários como vantagem",
          "Moat forte com barreira de 2+ anos para concorrentes"
        ]
      },
      {
        text: "A estratégia de Go-to-Market está definida e funcionando?",
        hint: "Canais, perfil de cliente, caminho para o mercado.",
        options: [
          "GTM não definido",
          "Hipóteses de GTM sem validação",
          "1 a 2 canais validados com métricas positivas",
          "Canal principal escalável identificado e rodando",
          "Multi-canal + expansão para novos segmentos em curso"
        ]
      }
    ]
  },
  {
    id: "juridico",
    label: "Jurídico",
    emoji: "⚖️",
    title: "Jurídico & Governança",
    description: "Avalia a formalização da estrutura societária, propriedade intelectual, contratos e governança.",
    questions: [
      {
        text: "A estrutura corporativa está formalizada e adequada?",
        hint: "Tipo societário (S/A, Ltda.), regime tributário, local de incorporação.",
        options: [
          "Sem CNPJ ou estrutura societária inadequada",
          "CNPJ aberto sem otimização tributária",
          "Tipo societário e regime tributário adequados",
          "Estrutura otimizada para captação (S/A ou Delaware)",
          "Holding + estrutura internacional + offshore planejado"
        ]
      },
      {
        text: "A propriedade intelectual da startup está protegida?",
        hint: "Patentes, marcas, código-fonte, acordos de confidencialidade.",
        options: [
          "Sem nenhuma proteção formal",
          "Marca em processo de registro",
          "Marca registrada + NDA com parceiros-chave",
          "Patente(s) depositada(s) + código protegido contratualmente",
          "Portfólio de PI estruturado e monitorado"
        ]
      },
      {
        text: "Contratos com clientes, fornecedores e parceiros estão estruturados?",
        hint: "Termos de uso, SLA, contratos comerciais e acordos de parceria.",
        options: [
          "Sem contratos formais — acordos verbais",
          "Contratos genéricos não adequados ao negócio",
          "Contratos padrão revisados por advogado",
          "Contratos customizados com SLA e penalidades definidas",
          "Contratos inteligentes + compliance jurídico completo"
        ]
      },
      {
        text: "A governança interna da startup está estabelecida?",
        hint: "Acordo de sócios, board, políticas internas, LGPD.",
        options: [
          "Sem acordo de sócios ou governança formal",
          "Acordo de sócios básico firmado",
          "Acordo de sócios completo + LGPD básica implementada",
          "Board advisory ativo + políticas internas documentadas",
          "Board formal + comitês + auditoria + ESG reportado"
        ]
      }
    ]
  },
  {
    id: "pessoas",
    label: "Pessoas",
    emoji: "👥",
    title: "Pessoas & Cultura",
    description: "Avalia a qualidade do time, processos de contratação, cultura e gestão de talentos.",
    questions: [
      {
        text: "Como está a composição e complementaridade do time fundador?",
        hint: "Habilidades técnicas, de negócio e liderança nos fundadores.",
        options: [
          "Time mono-disciplinar com gaps críticos",
          "Time com alguma complementaridade mas gaps evidentes",
          "Time com habilidades técnicas e de negócio cobertas",
          "Time completo com advisor board especializado",
          "Time de alto nível comprovado em execução + network estratégico"
        ]
      },
      {
        text: "Os processos de atração, seleção e integração de talentos estão estruturados?",
        hint: "Job descriptions, processo seletivo, onboarding e marca empregadora.",
        options: [
          "Contratações por indicação sem processo",
          "Processo básico sem critérios claros",
          "Job descriptions + entrevistas estruturadas + onboarding",
          "Employer branding ativo + pipeline de talentos",
          "Processo de recrutamento escalável + taxa de conversão medida"
        ]
      },
      {
        text: "Como está a retenção, engajamento e desenvolvimento da equipe?",
        hint: "Turnover, benefícios, plano de carreira e cultura.",
        options: [
          "Alto turnover sem diagnóstico das causas",
          "Retenção básica com pacote de benefícios mínimo",
          "Plano de carreira + cultura documentada + equity pool",
          "eNPS monitorado + PDI + programas de desenvolvimento",
          "Cultura reconhecida externamente + low turnover comprovado"
        ]
      },
      {
        text: "Os valores e a cultura da startup estão definidos e vividos?",
        hint: "Missão interna, rituais, diversidade e inclusão.",
        options: [
          "Sem definição de cultura ou valores",
          "Valores escritos mas não praticados",
          "Valores vividos com rituais de reforço consistentes",
          "Cultura como vantagem de recrutamento + D&I estruturado",
          "Cultura reconhecida como diferencial de negócio e atração"
        ]
      }
    ]
  },
  {
    id: "operacoes",
    label: "Operações",
    emoji: "🔧",
    title: "Operações & Processos",
    description: "Avalia a eficiência operacional, uso de ferramentas, processos escaláveis e gestão de projetos.",
    questions: [
      {
        text: "Os processos internos estão documentados e escaláveis?",
        hint: "SOPs, manuais, wikis e padronização de processos.",
        options: [
          "Processos informais dependentes de pessoas-chave",
          "Alguns processos documentados sem padronização",
          "Processos críticos documentados em SOPs",
          "Wiki interna + automação de processos repetitivos",
          "Processos auditáveis + continuous improvement estruturado"
        ]
      },
      {
        text: "Qual é o nível de adoção de ferramentas de gestão e produtividade?",
        hint: "CRM, ERP, gestão de projetos, comunicação interna.",
        options: [
          "Apenas e-mail e planilhas",
          "Ferramentas básicas sem integração",
          "Stack de ferramentas integradas para as áreas principais",
          "Stack completo com automações e dashboards integrados",
          "Data-driven operations com BI em tempo real"
        ]
      },
      {
        text: "Como é feita a gestão de projetos e entregas?",
        hint: "Metodologia (scrum/kanban/outro), ritmo de entregas, qualidade.",
        options: [
          "Sem metodologia — projetos geridos ad hoc",
          "Metodologia básica aplicada parcialmente",
          "Sprints ou ciclos regulares com rituais consistentes",
          "Métricas de delivery + velocity + qualidade monitoradas",
          "DevOps/MLOps maduros + deploy contínuo + SLA interno"
        ]
      },
      {
        text: "A startup tem indicadores operacionais e os monitora ativamente?",
        hint: "KPIs operacionais, dashboards, OKRs de time.",
        options: [
          "Sem KPIs operacionais definidos",
          "KPIs definidos mas raramente revisados",
          "KPIs revisados em reuniões semanais/quinzenais",
          "Dashboards em tempo real acessíveis a toda a equipe",
          "Cultura data-driven consolidada com decisões baseadas em dados"
        ]
      }
    ]
  },
  {
    id: "inovacao",
    label: "Inovação",
    emoji: "🚀",
    title: "Inovação & P&D",
    description: "Avalia a capacidade de inovar continuamente, gerar P&D e construir parcerias estratégicas.",
    questions: [
      {
        text: "A startup tem processos estruturados de inovação contínua?",
        hint: "Ideação, prototipagem, experimentação e aprendizado estruturado.",
        options: [
          "Inovação acontece por acaso sem processo",
          "Brainstorms ocasionais sem estrutura",
          "Processo de ideação com prototipagem rápida",
          "Design sprints + backlog de inovação gerenciado",
          "Innovation pipeline com P&D dedicado e métricas de inovação"
        ]
      },
      {
        text: "Como estão as parcerias estratégicas e o ecossistema de inovação?",
        hint: "Corporates, aceleradoras, universidades, parceiros tecnológicos.",
        options: [
          "Sem parcerias estratégicas formais",
          "Parceiros identificados mas sem contratos ativos",
          "1 a 2 parcerias estratégicas ativas e funcionando",
          "Portfólio de parcerias em múltiplos níveis (tech + go-to-market)",
          "Co-inovação com grandes empresas + acesso a mercado via parcerias"
        ]
      },
      {
        text: "A startup investe em P&D e propriedade intelectual de forma estratégica?",
        hint: "Budget de P&D, pesquisa aplicada, publicações, patentes.",
        options: [
          "Sem investimento em P&D formal",
          "Pesquisa informal por iniciativa individual",
          "Budget de P&D definido com projetos ativos",
          "Parcerias com universidades ou centros de pesquisa",
          "P&D como vantagem competitiva com portfólio de patentes"
        ]
      },
      {
        text: "A startup usa dados e IA para melhorar produto e decisões?",
        hint: "Analytics, machine learning, automação baseada em dados.",
        options: [
          "Sem uso estruturado de dados",
          "Dados coletados mas não analisados sistematicamente",
          "Analytics básico + decisões parcialmente data-driven",
          "Modelos preditivos em produção + IA no produto",
          "IA como core do produto + MLOps + feedback loop automatizado"
        ]
      }
    ]
  },
  {
    id: "impacto",
    label: "Impacto",
    emoji: "🌱",
    title: "Impacto & ESG",
    description: "Avalia o compromisso com sustentabilidade, impacto social e práticas ESG.",
    questions: [
      {
        text: "A startup mede e reporta seu impacto socioambiental?",
        hint: "Métricas de impacto, teoria da mudança, relatórios ESG.",
        options: [
          "Sem medição de impacto formal",
          "Impacto percebido mas não medido",
          "Métricas de impacto definidas e monitoradas",
          "Relatório de impacto publicado anualmente",
          "Certificação B Corp ou equivalente + impacto central ao modelo"
        ]
      },
      {
        text: "As práticas internas de diversidade, inclusão e bem-estar estão estruturadas?",
        hint: "Políticas de D&I, saúde mental, equidade salarial.",
        options: [
          "Sem políticas formais de D&I ou bem-estar",
          "Iniciativas pontuais sem estrutura",
          "Políticas documentadas de D&I e saúde mental",
          "Metas de diversidade com acompanhamento e relatório",
          "D&I como vantagem competitiva com dados comprovados"
        ]
      },
      {
        text: "A startup adota práticas sustentáveis e de governança responsável?",
        hint: "Pegada de carbono, fornecedores responsáveis, anticorrupção.",
        options: [
          "Sem iniciativas de sustentabilidade",
          "Consciência sobre sustentabilidade sem ações formais",
          "Práticas básicas: redução de resíduos, contratos éticos",
          "Metas de carbono + fornecedores avaliados por critérios ESG",
          "Estratégia ESG integrada ao core do negócio e comunicada"
        ]
      }
    ]
  }
];

export const MATURITY_LEVELS = [
  { min: 0,  max: 20,  label: "Embrionária",     color: "#dc2626", bg: "#fef2f2" },
  { min: 21, max: 40,  label: "Em formação",      color: "#d97706", bg: "#fffbeb" },
  { min: 41, max: 60,  label: "Em crescimento",   color: "#2563eb", bg: "#eff6ff" },
  { min: 61, max: 80,  label: "Madura",           color: "#7c3aed", bg: "#f5f3ff" },
  { min: 81, max: 100, label: "Referência",       color: "#059669", bg: "#ecfdf5" },
];

export function getMaturityLevel(score) {
  return MATURITY_LEVELS.find(l => score >= l.min && score <= l.max) || MATURITY_LEVELS[0];
}

export function calcPillarScore(answers, pillarIndex) {
  const pillar = PILLARS[pillarIndex];
  const vals = pillar.questions.map((_, qi) => answers[`${pillarIndex}_${qi}`] || 0);
  if (vals.every(v => v === 0)) return 0;
  const sum = vals.reduce((a, b) => a + b, 0);
  return Math.round((sum / (pillar.questions.length * 5)) * 100);
}

export function calcAllScores(answers) {
  const pillarScores = {};
  PILLARS.forEach((p, i) => { pillarScores[p.id] = calcPillarScore(answers, i); });
  const vals = Object.values(pillarScores);
  const overall = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  return { pillarScores, overall };
}