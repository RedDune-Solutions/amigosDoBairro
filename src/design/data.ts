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

// Níveis (badges) por pontos GANHOS ao longo do tempo (lifetime, nunca descem).
// Subida exponencial agressiva: 0 · 100 · 300 · 800 · 2000 · 5000.
export const TIERS: Tier[] = [
  {
    id: "novo",
    min: 0,
    icon: "star",
    accent: "blue",
    name: { pt: "Vizinho Novo", en: "New Neighbour" },
    perks: {
      pt: ["Acumula 10 pontos por cada euro", "Cartão de carimbos digital"],
      en: ["Earn 10 points per euro spent", "Digital stamp card"],
    },
  },
  {
    id: "cliente",
    min: 100,
    icon: "coffee",
    accent: "green",
    name: { pt: "Cliente da Casa", en: "House Regular" },
    perks: {
      pt: ["Tudo do nível anterior", "Ofertas só para membros"],
      en: ["Everything from the previous tier", "Member-only offers"],
    },
  },
  {
    id: "amigo",
    min: 300,
    icon: "sandwich",
    accent: "primary",
    name: { pt: "Amigo do Bairro", en: "Neighbourhood Friend" },
    perks: {
      pt: ["Tudo do nível anterior", "Raspadinha extra no aniversário"],
      en: ["Everything from the previous tier", "Extra scratch card on your birthday"],
    },
  },
  {
    id: "habitue",
    min: 800,
    icon: "cake",
    accent: "red",
    name: { pt: "Habitué do Café", en: "Café Regular" },
    perks: {
      pt: ["Tudo do nível anterior", "Reservas com prioridade"],
      en: ["Everything from the previous tier", "Priority bookings"],
    },
  },
  {
    id: "dourado",
    min: 2000,
    icon: "gift",
    accent: "primary",
    name: { pt: "Amigo do Peito", en: "Close Friend" },
    perks: {
      pt: ["Tudo do nível anterior", "Café grátis todos os meses"],
      en: ["Everything from the previous tier", "Free coffee every month"],
    },
  },
  {
    id: "lenda",
    min: 5000,
    icon: "trophy",
    accent: "red",
    name: { pt: "Lenda do Bairro", en: "Neighbourhood Legend" },
    perks: {
      pt: ["Tudo do nível anterior", "Brunch grátis por trimestre", "Convites para eventos da casa"],
      en: ["Everything from the previous tier", "Free brunch every quarter", "Invites to house events"],
    },
  },
];

// Recebe os pontos GANHOS (lifetime), não o saldo atual.
export function tierIndexFor(earned: number): number {
  let idx = 0;
  for (let i = 0; i < TIERS.length; i++) if (earned >= TIERS[i].min) idx = i;
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

// Menu vindo da BD (editável no admin). Mesma forma do MENU estático para a UI.
export type MenuItemRow = {
  id: string;
  name_pt: string;
  name_en: string | null;
  desc_pt: string | null;
  desc_en: string | null;
  price: string;
  image_url: string | null;
};
export type MenuCatRow = {
  id: string;
  label_pt: string;
  label_en: string | null;
  icon: string;
  accent: string;
  items: MenuItemRow[];
};

// Opções de comida preferida (dropdown no registo, editável pela admin).
export type FoodCategory = {
  id: string;
  slug: string;
  label_pt: string;
  label_en: string | null;
  ordem: number;
  ativo: boolean;
};

// Agregado para o gráfico de preferências (admin).
export type FoodPrefStat = { slug: string; label: string; count: number };

export const RES_TIMES = ["09:00", "10:30", "12:00", "13:00", "13:30", "16:00", "17:30", "19:00"];

// Horário real do café por dia da semana (0=Dom … 6=Sáb).
// Seg–Sex 06:30–17:00 · Sáb e Dom 07:00–15:00 (dados confirmados com a Daniela).
export const CAFE_HOURS: Record<number, { open: string; close: string }> = {
  0: { open: "07:00", close: "15:00" }, // Domingo
  1: { open: "06:30", close: "17:00" },
  2: { open: "06:30", close: "17:00" },
  3: { open: "06:30", close: "17:00" },
  4: { open: "06:30", close: "17:00" },
  5: { open: "06:30", close: "17:00" },
  6: { open: "07:00", close: "15:00" }, // Sábado
};

const toMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const fromMin = (min: number): string =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/**
 * Horas de reserva possíveis num dado dia, dentro do horário do café.
 * Range: começa 30 min DEPOIS de abrir e vai até 30 min ANTES de fechar.
 * Slots de 30 min. Para hoje, remove horas já passadas (60 min de antecedência).
 */
export function reservationSlots(date: Date, now: Date): string[] {
  const hours = CAFE_HOURS[date.getDay()];
  if (!hours) return [];
  const start = toMin(hours.open) + 30;
  const lastStart = toMin(hours.close) - 30;
  const sameDay = date.toDateString() === now.toDateString();
  const minAllowed = sameDay ? now.getHours() * 60 + now.getMinutes() + 60 : -1;
  const out: string[] = [];
  for (let m = start; m <= lastStart; m += 30) {
    if (m >= minAllowed) out.push(fromMin(m));
  }
  return out;
}

export type Reservation = {
  id: string;
  data: string;
  hora: string;
  n_pessoas: number;
  estado: string;
};
export type NextReservation = Reservation | null;

// Tipos de dados da app (vindos do Supabase)
export type AppData = {
  nome: string;
  firstName: string;
  email: string;
  telefone: string;
  avatarUrl: string | null;
  role: "customer" | "staff" | "admin";
  memberSince: string;
  foodPref: string | null;
  points: number;
  earned: number;
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
  notifications: NotifRow[];
  unread: number;
  expiring: { pts: number; dias: number } | null;
  reservations: Reservation[];
};

export type ClienteRow = {
  id: string;
  nome: string | null;
  telefone: string | null;
  food_pref: string | null;
  created_at: string;
  banned: boolean;
};

export type NotifRow = {
  id: string;
  kind: "pontos" | "premio" | "reserva" | "novidade" | "aviso";
  title_pt: string;
  title_en: string | null;
  body_pt: string | null;
  body_en: string | null;
  icon: string | null;
  accent: string | null;
  read_at: string | null;
  created_at: string;
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
