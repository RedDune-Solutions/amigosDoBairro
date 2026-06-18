// Dados estáticos do design (escalões). Bilingue { pt, en }.
export type Bi = { pt: string; en: string };

export type Tier = {
  id: string;
  min: number;
  icon: string;
  accent: string;
  name: Bi;
  perks: { pt: string[]; en: string[] };
};

export const TIERS: Tier[] = [
  {
    id: "novo",
    min: 0,
    icon: "star",
    accent: "blue",
    name: { pt: "Vizinho Novo", en: "New Neighbour" },
    perks: {
      pt: ["Acumula 1 ponto por cada euro", "Cartão de carimbos digital"],
      en: ["Earn 1 point per euro spent", "Digital stamp card"],
    },
  },
  {
    id: "amigo",
    min: 100,
    icon: "sandwich",
    accent: "green",
    name: { pt: "Amigo do Bairro", en: "Neighbourhood Friend" },
    perks: {
      pt: ["Tudo do escalão anterior", "Raspadinha extra no aniversário", "Ofertas só para membros"],
      en: ["Everything from the previous tier", "Extra scratch card on your birthday", "Member-only offers"],
    },
  },
  {
    id: "dourado",
    min: 200,
    icon: "gift",
    accent: "primary",
    name: { pt: "Vizinho Dourado", en: "Golden Neighbour" },
    perks: {
      pt: ["Tudo do escalão anterior", "Café grátis todos os meses", "Reservas com prioridade"],
      en: ["Everything from the previous tier", "Free coffee every month", "Priority bookings"],
    },
  },
  {
    id: "lenda",
    min: 400,
    icon: "plate",
    accent: "red",
    name: { pt: "Lenda do Bairro", en: "Neighbourhood Legend" },
    perks: {
      pt: ["Tudo do escalão anterior", "Brunch grátis por trimestre", "Convites para eventos da casa"],
      en: ["Everything from the previous tier", "Free brunch every quarter", "Invites to house events"],
    },
  },
];

export function tierIndexFor(points: number): number {
  let idx = 0;
  for (let i = 0; i < TIERS.length; i++) if (points >= TIERS[i].min) idx = i;
  return idx;
}

// Tipos de dados da app (vindos do Supabase)
export type AppData = {
  nome: string;
  firstName: string;
  role: "customer" | "staff" | "admin";
  memberSince: string;
  points: number;
  stamps: number;
  spendToward: number;
  euroPerStamp: number;
  stampGoal: number;
  rewards: RewardRow[];
  history: HistoryRow[];
  pendingScratch: number;
};

export type RewardRow = {
  id: string;
  titulo: string;
  nome_en: string | null;
  descricao: string | null;
  desc_en: string | null;
  custo_pontos: number;
  icon: string | null;
  accent: string | null;
};

export type HistoryRow = {
  id: number;
  label: string;
  date: string;
  pts: number;
  kind: "earn" | "redeem" | "adjust";
};
