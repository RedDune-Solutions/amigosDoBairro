// Dados estáticos do design (escalões). Bilingue { pt, en }.
export type Bi = { pt: string; en: string };

export type Tier = {
  id: string;
  min: number;
  icon: string;
  accent: string;
  name: Bi;
};

// Níveis (badges) por pontos GANHOS ao longo do tempo (lifetime, nunca descem).
// Escala 1€=10pts; topo aos 10000 pts = 1000€ gastos. Curva: 0 · 1000 · 2500 · 4500 · 7000 · 10000.
export const TIERS: Tier[] = [
  { id: "novo", min: 0, icon: "star", accent: "blue", name: { pt: "Vizinho Novo", en: "New Neighbour" } },
  { id: "cliente", min: 1000, icon: "coffee", accent: "green", name: { pt: "Cliente da Casa", en: "House Regular" } },
  { id: "amigo", min: 2500, icon: "sandwich", accent: "primary", name: { pt: "Amigo do Bairro", en: "Neighbourhood Friend" } },
  { id: "habitue", min: 4500, icon: "cake", accent: "red", name: { pt: "Habitué do Café", en: "Café Regular" } },
  { id: "dourado", min: 7000, icon: "gift", accent: "primary", name: { pt: "Amigo do Peito", en: "Close Friend" } },
  { id: "lenda", min: 10000, icon: "trophy", accent: "red", name: { pt: "Lenda do Bairro", en: "Neighbourhood Legend" } },
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
  items: { name: Bi; desc: Bi }[];
};

export const MENU: MenuCat[] = [
  {
    cat: { pt: "Cafés & Bebidas", en: "Coffees & Drinks" }, accent: "primary", icon: "coffee",
    items: [
      { name: { pt: "Café (bica)", en: "Espresso" }, desc: { pt: "Torra clássica da casa", en: "House classic roast" } },
      { name: { pt: "Galão", en: "Latte" }, desc: { pt: "Leite cremoso, café suave", en: "Creamy milk, mild coffee" } },
      { name: { pt: "Cappuccino", en: "Cappuccino" }, desc: { pt: "Espuma de leite e canela", en: "Milk foam and cinnamon" } },
      { name: { pt: "Chá da casa", en: "House tea" }, desc: { pt: "Selecção de infusões", en: "Selection of infusions" } },
    ],
  },
  {
    cat: { pt: "Sandes & Tostas", en: "Sandwiches & Toasties" }, accent: "blue", icon: "sandwich",
    items: [
      { name: { pt: "Tosta mista", en: "Ham & cheese toastie" }, desc: { pt: "Fiambre e queijo no pão caseiro", en: "Ham and cheese on homemade bread" } },
      { name: { pt: "Sandes de frango", en: "Chicken sandwich" }, desc: { pt: "Frango desfiado e maionese", en: "Pulled chicken and mayo" } },
      { name: { pt: "Bifana no pão", en: "Pork cutlet roll" }, desc: { pt: "Lombo temperado à moda do bairro", en: "Seasoned pork, neighbourhood style" } },
    ],
  },
  {
    cat: { pt: "Doces & Pastelaria", en: "Sweets & Pastries" }, accent: "red", icon: "cake",
    items: [
      { name: { pt: "Pastel de nata", en: "Custard tart" }, desc: { pt: "Acabado de sair do forno", en: "Fresh out of the oven" } },
      { name: { pt: "Bolo do dia", en: "Cake of the day" }, desc: { pt: "Pergunte ao balcão", en: "Ask at the counter" } },
      { name: { pt: "Croissant", en: "Croissant" }, desc: { pt: "Simples ou com doce", en: "Plain or with jam" } },
    ],
  },
  {
    cat: { pt: "Pratos do Dia", en: "Dishes of the Day" }, accent: "green", icon: "plate",
    items: [
      { name: { pt: "Sopa + Prato", en: "Soup + Main" }, desc: { pt: "Menu de almoço completo", en: "Full lunch menu" } },
      { name: { pt: "Salada da horta", en: "Garden salad" }, desc: { pt: "Legumes frescos do mercado", en: "Fresh vegetables from the market" } },
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

// Foto da landing page (editável pela admin). 'espaco' = carrossel de ambiente
// (sem legenda); 'comida' = "Da nossa casa" (label_pt/label_en como legenda).
export type LandingPhoto = {
  id: string;
  section: "espaco" | "comida";
  image_url: string;
  label_pt: string | null;
  label_en: string | null;
  ordem: number;
};
export type LandingPhotos = { espaco: LandingPhoto[]; comida: LandingPhoto[] };

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

/** Antecedência mínima para reservar (em minutos). 12h: se um cliente reserva
 *  às 21h para as 7h30 da manhã, a equipa pode não ver a tempo. O servidor
 *  (createReservation) valida o mesmo — isto é só para a UI não oferecer o que
 *  seria recusado. */
export const RESERVA_MIN_LEAD_MIN = 12 * 60;

/**
 * Horas de reserva possíveis num dado dia, dentro do horário do café.
 * Range: começa 15 min DEPOIS de abrir e vai até 15 min ANTES de fechar.
 * Slots de 30 min. Remove qualquer slot que esteja a menos de `minLeadMin`
 * minutos de `now` (instante absoluto, não só minutos-do-dia) — cobre o caso
 * de reservar de noite para o dia seguinte de manhã cedo.
 */
export function reservationSlots(date: Date, now: Date, minLeadMin = 0): string[] {
  const hours = CAFE_HOURS[date.getDay()];
  if (!hours) return [];
  const start = toMin(hours.open) + 15;
  const lastStart = toMin(hours.close) - 15;
  const minInstant = now.getTime() + minLeadMin * 60_000;
  const out: string[] = [];
  for (let m = start; m <= lastStart; m += 30) {
    const slot = new Date(date);
    slot.setHours(0, 0, 0, 0);
    slot.setMinutes(m);
    if (slot.getTime() >= minInstant) out.push(fromMin(m));
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
  reservasBloqueadas: boolean;
  emailNotifs: boolean;
};

export type ClienteRow = {
  id: string;
  nome: string | null;
  telefone: string | null;
  food_pref: string | null;
  created_at: string;
  banned: boolean;
  reservas_bloqueadas: boolean;
  saldo: number; // pontos gastáveis (lotes ativos, não expirados)
  ganhos: number; // pontos ganhos lifetime → escalão
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
