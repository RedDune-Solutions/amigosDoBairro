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

// Menu / cardápio (estático — confirmar preços com a Daniela)
export type MenuCat = {
  cat: Bi;
  accent: string;
  icon: string;
  items: { name: Bi; desc: Bi; price: string }[];
};

export const MENU: MenuCat[] = [
  {
    cat: { pt: "Cafés & Bebidas", en: "Coffees & Drinks" }, accent: "primary", icon: "coffee",
    items: [
      { name: { pt: "Café (bica)", en: "Espresso" }, desc: { pt: "Torra clássica da casa", en: "House classic roast" }, price: "0,80" },
      { name: { pt: "Galão", en: "Latte" }, desc: { pt: "Leite cremoso, café suave", en: "Creamy milk, mild coffee" }, price: "1,40" },
      { name: { pt: "Cappuccino", en: "Cappuccino" }, desc: { pt: "Espuma de leite e canela", en: "Milk foam and cinnamon" }, price: "1,80" },
      { name: { pt: "Chá da casa", en: "House tea" }, desc: { pt: "Selecção de infusões", en: "Selection of infusions" }, price: "1,30" },
    ],
  },
  {
    cat: { pt: "Sandes & Tostas", en: "Sandwiches & Toasties" }, accent: "blue", icon: "sandwich",
    items: [
      { name: { pt: "Tosta mista", en: "Ham & cheese toastie" }, desc: { pt: "Fiambre e queijo no pão caseiro", en: "Ham and cheese on homemade bread" }, price: "2,50" },
      { name: { pt: "Sandes de frango", en: "Chicken sandwich" }, desc: { pt: "Frango desfiado e maionese", en: "Pulled chicken and mayo" }, price: "3,20" },
      { name: { pt: "Bifana no pão", en: "Pork cutlet roll" }, desc: { pt: "Lombo temperado à moda do bairro", en: "Seasoned pork, neighbourhood style" }, price: "2,80" },
    ],
  },
  {
    cat: { pt: "Doces & Pastelaria", en: "Sweets & Pastries" }, accent: "red", icon: "cake",
    items: [
      { name: { pt: "Pastel de nata", en: "Custard tart" }, desc: { pt: "Acabado de sair do forno", en: "Fresh out of the oven" }, price: "1,20" },
      { name: { pt: "Bolo do dia", en: "Cake of the day" }, desc: { pt: "Pergunte ao balcão", en: "Ask at the counter" }, price: "2,20" },
      { name: { pt: "Croissant", en: "Croissant" }, desc: { pt: "Simples ou com doce", en: "Plain or with jam" }, price: "1,40" },
    ],
  },
  {
    cat: { pt: "Pratos do Dia", en: "Dishes of the Day" }, accent: "green", icon: "plate",
    items: [
      { name: { pt: "Sopa + Prato", en: "Soup + Main" }, desc: { pt: "Menu de almoço completo", en: "Full lunch menu" }, price: "7,50" },
      { name: { pt: "Salada da horta", en: "Garden salad" }, desc: { pt: "Legumes frescos do mercado", en: "Fresh vegetables from the market" }, price: "5,90" },
    ],
  },
];

export const RES_TIMES = ["09:00", "10:30", "12:00", "13:00", "13:30", "16:00", "17:30", "19:00"];

export type NextReservation = {
  data: string;
  hora: string;
  n_pessoas: number;
  estado: string;
} | null;

// Tipos de dados da app (vindos do Supabase)
export type AppData = {
  nome: string;
  firstName: string;
  email: string;
  telefone: string;
  avatarUrl: string | null;
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
  scratchCards: ScratchCardRow[];
  wallet: WalletItemRow[];
  news: NewsRow[];
  nextReservation: NextReservation;
};

export type ScratchCardRow = { id: string; kind: "comum" | "especial" };

export type WalletItemRow = {
  id: string;
  kind: "comum" | "especial" | "recompensa";
  nome_pt: string;
  nome_en: string | null;
  desc_pt: string | null;
  desc_en: string | null;
  icon: string | null;
  accent: string | null;
  codigo: string;
  status: "por-usar" | "usado";
  created_at: string;
};

export type ScratchPrize = {
  prize_id: string;
  nome_pt: string;
  nome_en: string | null;
  desc_pt: string | null;
  desc_en: string | null;
  icon: string;
  accent: string;
  codigo: string;
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

export type NewsRow = {
  id: string;
  titulo_pt: string;
  titulo_en: string | null;
  desc_pt: string | null;
  desc_en: string | null;
  icon: string;
  accent: string;
  ativo: boolean;
  created_at: string;
};

export type HistoryRow = {
  id: number;
  label: string;
  date: string;
  pts: number;
  kind: "earn" | "redeem" | "adjust";
};
