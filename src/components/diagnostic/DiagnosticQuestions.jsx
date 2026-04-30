export const DIAGNOSTIC_PILLARS = [
  {
    id: "estrategia_governanca",
    name: "Estratégia & Governança",
    icon: "🎯",
    description: "Alinhamento da inovação à estratégia corporativa e estruturas de governança.",
    questions: [
      {
        id: "eg1",
        text: "Existe uma estratégia de inovação formalizada e alinhada aos objetivos estratégicos da empresa?",
        type: "likert",
        scale: 5,
        labels: ["Não existe", "Informal", "Em construção", "Formalizada", "Integrada e revisada"]
      },
      {
        id: "eg2",
        text: "Há um orçamento dedicado à inovação, definido e aprovado formalmente?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Ad hoc", "Parcial", "Definido", "Planejado e revisado"]
      },
      {
        id: "eg3",
        text: "Existe uma estrutura (comitê, área, C-level) responsável por governar as iniciativas de inovação?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Informal", "Em estruturação", "Estruturada", "Consolidada e influente"]
      },
      {
        id: "eg4",
        text: "A liderança sênior participa ativamente e patrocina iniciativas de inovação?",
        type: "likert",
        scale: 5,
        labels: ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sistematicamente"]
      },
      {
        id: "eg5",
        text: "A empresa possui um roadmap de inovação com metas, marcos e responsáveis definidos?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Incipiente", "Parcial", "Definido", "Atualizado e monitorado"]
      }
    ]
  },
  {
    id: "cultura",
    name: "Cultura",
    icon: "🌱",
    description: "Ambiente, mindset e comportamentos que suportam a inovação.",
    questions: [
      {
        id: "cu1",
        text: "A empresa incentiva a experimentação e tolera o erro como parte do processo de aprendizado?",
        type: "likert",
        scale: 5,
        labels: ["Não tolera", "Pouco tolerante", "Parcialmente", "Incentiva", "É parte da cultura"]
      },
      {
        id: "cu2",
        text: "Há mecanismos para que colaboradores de diferentes áreas proponham e desenvolvam ideias?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Informal", "Alguns canais", "Canais formais", "Ecossistema de ideação"]
      },
      {
        id: "cu3",
        text: "A inovação aberta (com startups, universidades, parceiros) é valorizada pela liderança?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Pouco", "Moderado", "Valorizada", "Estratégica"]
      },
      {
        id: "cu4",
        text: "O ambiente de trabalho favorece colaboração entre áreas para projetos de inovação?",
        type: "likert",
        scale: 5,
        labels: ["Silos fortes", "Colaboração rara", "Ocasional", "Frequente", "Muito colaborativo"]
      },
      {
        id: "cu5",
        text: "Existe reconhecimento (formal ou informal) para times e pessoas que inovam?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Raro", "Às vezes", "Regularmente", "Integrado à cultura"]
      }
    ]
  },
  {
    id: "processos_ferramentas",
    name: "Processos & Ferramentas",
    icon: "⚙️",
    description: "Metodologias, processos e ferramentas que habilitam a inovação.",
    questions: [
      {
        id: "pf1",
        text: "A empresa utiliza metodologias estruturadas (Design Thinking, Lean Startup, Agile) em projetos de inovação?",
        type: "likert",
        scale: 5,
        labels: ["Não usa", "Esporadicamente", "Em alguns projetos", "Na maioria", "Em todos os projetos"]
      },
      {
        id: "pf2",
        text: "Há um processo claro de gestão do funil de inovação (ideação → validação → escala)?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Informal", "Parcialmente", "Definido", "Otimizado"]
      },
      {
        id: "pf3",
        text: "A empresa utiliza ferramentas digitais para gestão de projetos e iniciativas de inovação?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Planilhas", "Ferramentas básicas", "Ferramentas dedicadas", "Plataforma integrada"]
      },
      {
        id: "pf4",
        text: "Existem métricas e KPIs definidos para monitorar o desempenho das iniciativas de inovação?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Informais", "Poucos KPIs", "KPIs definidos", "Dashboard em tempo real"]
      },
      {
        id: "pf5",
        text: "A empresa realiza validações com clientes/usuários antes de escalar soluções?",
        type: "likert",
        scale: 5,
        labels: ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"]
      }
    ]
  },
  {
    id: "pessoas_habilidades",
    name: "Pessoas & Habilidades",
    icon: "👥",
    description: "Capacidade humana, talentos e desenvolvimento para inovar.",
    questions: [
      {
        id: "ph1",
        text: "A empresa investe em capacitação e desenvolvimento de habilidades ligadas à inovação (ex.: design thinking, dados, IA)?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Raramente", "Às vezes", "Regularmente", "Prioritariamente"]
      },
      {
        id: "ph2",
        text: "Há profissionais dedicados à inovação (intraempreendedores, innovation managers, labs)?",
        type: "likert",
        scale: 5,
        labels: ["Não", "1 pessoa part-time", "Equipe pequena", "Equipe dedicada", "Área estruturada"]
      },
      {
        id: "ph3",
        text: "A empresa contrata ou atrai talentos com perfil inovador e empreendedor?",
        type: "likert",
        scale: 5,
        labels: ["Não é critério", "Raramente", "Às vezes", "É critério formal", "Estratégia de talentos"]
      },
      {
        id: "ph4",
        text: "Equipes de inovação têm autonomia e recursos para executar experimentos sem burocracia excessiva?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Muito burocrático", "Parcial", "Razoável autonomia", "Alta autonomia"]
      },
      {
        id: "ph5",
        text: "Existe diversidade (de áreas, perfis, backgrounds) nas equipes de projetos de inovação?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Pouca", "Moderada", "Alta", "É critério estratégico"]
      }
    ]
  },
  {
    id: "investimento",
    name: "Investimento",
    icon: "💰",
    description: "Alocação de recursos financeiros e priorização de iniciativas.",
    questions: [
      {
        id: "inv1",
        text: "O orçamento de inovação representa uma fatia relevante do faturamento ou budget corporativo?",
        type: "likert",
        scale: 5,
        labels: ["<0,1%", "0,1–0,5%", "0,5–1%", "1–3%", ">3%"]
      },
      {
        id: "inv2",
        text: "Há processos de priorização de investimentos em inovação com critérios claros (risco, retorno, estratégia)?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Ad hoc", "Parcialmente", "Critérios definidos", "Portfolio estruturado"]
      },
      {
        id: "inv3",
        text: "A empresa investe em inovação aberta (aceleradoras, CVCs, parcerias com startups)?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Estudando", "Iniciativas pontuais", "Programa estruturado", "Portfólio consolidado"]
      },
      {
        id: "inv4",
        text: "Existe investimento em infraestrutura tecnológica para suportar a inovação (dados, cloud, APIs)?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Básico", "Em andamento", "Estruturado", "Estado da arte"]
      }
    ]
  },
  {
    id: "resultados_futuro",
    name: "Resultados & Futuro",
    icon: "📈",
    description: "Resultados alcançados, aprendizados e prontidão para disrupção.",
    questions: [
      {
        id: "rf1",
        text: "A empresa consegue demonstrar ROI ou impacto mensurável de suas iniciativas de inovação?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Dificilmente", "Em alguns casos", "Na maioria", "Sistematicamente"]
      },
      {
        id: "rf2",
        text: "A empresa tem casos de sucesso (produtos lançados, receita nova, eficiência ganha) gerados por inovação?",
        type: "likert",
        scale: 5,
        labels: ["Nenhum", "1 caso", "Poucos", "Vários", "Portfolio sólido"]
      },
      {
        id: "rf3",
        text: "A empresa monitora tendências de mercado e tecnologia para antecipar disrupções?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Ad hoc", "Às vezes", "Frequentemente", "Sistemático e estruturado"]
      },
      {
        id: "rf4",
        text: "Qual é o nível de prontidão da empresa para colaborar com startups em projetos de inovação?",
        type: "likert",
        scale: 5,
        labels: ["Não preparada", "Baixo", "Médio", "Alto", "Referência em open innovation"]
      },
      {
        id: "rf5",
        text: "A empresa tem clareza sobre os desafios de negócio que deseja resolver via inovação nos próximos 3 anos?",
        type: "likert",
        scale: 5,
        labels: ["Não", "Vago", "Parcialmente", "Bem definido", "Com tese e roadmap"]
      }
    ]
  }
];

export const calculateScores = (responses) => {
  const pillarScores = {};
  let totalSum = 0;
  let totalCount = 0;

  DIAGNOSTIC_PILLARS.forEach(pillar => {
    const pillarResponses = responses.filter(r => r.pillar_id === pillar.id);
    if (pillarResponses.length === 0) {
      pillarScores[pillar.id] = 0;
      return;
    }
    const sum = pillarResponses.reduce((acc, r) => acc + (r.answer_value || 0), 0);
    const maxPossible = pillarResponses.length * 5;
    const score = Math.round((sum / maxPossible) * 100);
    pillarScores[pillar.id] = score;
    totalSum += score;
    totalCount++;
  });

  const overallScore = totalCount > 0 ? Math.round(totalSum / totalCount) : 0;
  return { pillarScores, overallScore };
};