// Ícones reais via lucide-react (line icons). Mantém a API <Icon name=... />
// usada em toda a app — só o interior mudou (antes eram paths desenhados à mão).
import { type CSSProperties } from "react";
import {
  Home, CreditCard, Calendar, BookOpen, Gift, User, Star, Coffee, Sandwich,
  Cake, Utensils, Tag, Clock, Users, Plus, Minus, Check, ChevronRight,
  ChevronLeft, Bell, Settings, LogOut, QrCode, Heart, Sparkles, MapPin, Phone,
  ArrowRight, ArrowLeft, Pencil, Leaf, Shield, Trophy, Percent, Box, Trash2,
  Archive, Ticket, Wallet, Lock, Dice5, BarChart3, SlidersHorizontal, Search,
  X, Mail, Camera, CalendarCheck, Share2, Circle, type LucideIcon,
} from "lucide-react";

// Mapeia os nomes usados na app → componente lucide. Fallback: Circle.
const MAP: Record<string, LucideIcon> = {
  home: Home,
  card: CreditCard,
  calendar: Calendar,
  calendarCheck: CalendarCheck,
  menu: BookOpen,
  gift: Gift,
  user: User,
  star: Star,
  coffee: Coffee,
  sandwich: Sandwich,
  cake: Cake,
  plate: Utensils,
  tag: Tag,
  clock: Clock,
  users: Users,
  plus: Plus,
  minus: Minus,
  check: Check,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  bell: Bell,
  settings: Settings,
  logout: LogOut,
  qr: QrCode,
  heart: Heart,
  sparkle: Sparkles,
  mapPin: MapPin,
  phone: Phone,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  edit: Pencil,
  leaf: Leaf,
  shield: Shield,
  trophy: Trophy,
  percent: Percent,
  box: Box,
  trash: Trash2,
  archive: Archive,
  ticket: Ticket,
  wallet: Wallet,
  lock: Lock,
  dice: Dice5,
  chart: BarChart3,
  sliders: SlidersHorizontal,
  search: Search,
  x: X,
  mail: Mail,
  camera: Camera,
  share: Share2,
};

export function Icon({
  name,
  size = 24,
  color = "currentColor",
  stroke = 2,
  fill = "none",
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  stroke?: number;
  fill?: string;
  style?: CSSProperties;
}) {
  const C = MAP[name] ?? Circle;
  return <C size={size} color={color} strokeWidth={stroke} fill={fill} style={{ display: "block", flexShrink: 0, ...style }} />;
}
