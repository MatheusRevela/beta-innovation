export const colors = {
  bg: '#ECEEEA',
  surface: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#4B4F4B',
  border: '#A7ADA7',
  magenta: '#E10867',
  magentaHover: '#c40659',
  magentaLight: '#fce7ef',
  greenCta: '#2C4425',
  blueSoft: '#B4D1D7',
  purpleDark: '#1E0B2E',
  purpleMid: '#3B145A',
  purpleBright: '#6B2FA0',
};

export const MATURITY_LEVELS = [
  { label: 'Iniciante', color: '#E5E7EB', textColor: '#374151', min: 0, max: 20 },
  { label: 'Inicial', color: '#FDE68A', textColor: '#92400E', min: 21, max: 40 },
  { label: 'Intermediário', color: '#B4D1D7', textColor: '#1e3a4c', min: 41, max: 60 },
  { label: 'Avançado', color: '#6B2FA0', textColor: '#fff', min: 61, max: 80 },
  { label: 'Líder', color: '#E10867', textColor: '#fff', min: 81, max: 100 },
];

export const CRM_TYPES = [
  { value: 'PoC', label: 'Prova de Conceito (PoC)', icon: '🔬' },
  { value: 'PDI', label: 'P&D e Inovação (PDI)', icon: '⚗️' },
  { value: 'Investimento', label: 'Investimento / CVC', icon: '💰' },
  { value: 'Parceria', label: 'Parceria Comercial', icon: '🤝' },
  { value: 'Acompanhamento', label: 'Acompanhamento', icon: '📡' },
  { value: 'Custom', label: 'Criar novo tipo…', icon: '✏️' },
];

export const PIPELINE_STAGES = [
  'Shortlist',
  'Avaliação',
  'Conexão',
  'PoC',
  'Escala/Investimento',
  'Encerrado',
];

export const STAGE_COLORS = {
  'Shortlist': '#B4D1D7',
  'Avaliação': '#FDE68A',
  'Conexão': '#6B2FA0',
  'PoC': '#E10867',
  'Escala/Investimento': '#2C4425',
  'Encerrado': '#A7ADA7',
};

export const getMaturidadeLevel = (score) => {
  if (score <= 20) return MATURITY_LEVELS[0];
  if (score <= 40) return MATURITY_LEVELS[1];
  if (score <= 60) return MATURITY_LEVELS[2];
  if (score <= 80) return MATURITY_LEVELS[3];
  return MATURITY_LEVELS[4];
};