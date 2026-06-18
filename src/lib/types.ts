export type Role = "customer" | "staff" | "admin";

export type Profile = {
  id: string;
  nome: string | null;
  telefone: string | null;
  role: Role;
  created_at: string;
};

export type Reward = {
  id: string;
  titulo: string;
  descricao: string | null;
  custo_pontos: number;
  imagem: string | null;
  ativo: boolean;
  stock: number | null;
  created_at: string;
};

export type LedgerEntry = {
  id: number;
  user_id: string;
  delta: number;
  reason: string | null;
  source: "earn" | "redeem" | "adjust";
  staff_id: string | null;
  created_at: string;
};

export type Redemption = {
  id: string;
  user_id: string;
  reward_id: string;
  custo_pontos: number;
  estado: "pendente" | "levantado" | "cancelado";
  codigo: string;
  collected_by: string | null;
  created_at: string;
};

export type Reservation = {
  id: string;
  user_id: string;
  data: string;
  hora: string;
  n_pessoas: number;
  estado: "pendente" | "confirmada" | "cancelada";
  notas: string | null;
  created_at: string;
};
