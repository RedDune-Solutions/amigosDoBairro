// Ícones line (stroke) — portado do design (app-data.jsx).
import type { CSSProperties } from "react";

export const ICON_PATHS: Record<string, string> = {
  home: "M3 11.5 12 4l9 7.5M5 10v10h14V10",
  card: "M3 7h18v10H3zM3 11h18",
  calendar: "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4",
  menu: "M4 6h16M4 12h16M4 18h16",
  gift: "M4 11h16v9H4zM4 11V8h16v3M12 8v12M12 8S10.5 4 8.5 4 6 7 8 8h4zM12 8s1.5-4 3.5-4S18 7 16 8",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c0-3.3 3-6 7-6s7 2.7 7 6",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z",
  coffee: "M5 9h12v4a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5zM17 10h2.5a2 2 0 0 1 0 4H17M7 3c0 1-1 1.5-1 2.5M11 3c0 1-1 1.5-1 2.5",
  sandwich: "M4 8h16l-2-3H6zM3 8h18v3H3zM4 11c1 2 3 2 4 0s3-2 4 0 3 2 4 0 3-2 4 0v2H4z",
  cake: "M4 21h16v-7H4zM4 14c1.5 0 1.5-2 3-2s1.5 2 3 2 1.5-2 3-2 1.5 2 3 2M12 9V5M12 5l1.5-1.5M12 5l-1.5-1.5",
  plate: "M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0",
  tag: "M3 12l9-9 9 9-9 9zM9 9h.01",
  clock: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 7v5l3 2",
  users: "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21c0-3.3 3-6 7-6s7 2.7 7 6M16 4a4 4 0 0 1 0 8M18 15c2.5.5 4 2.3 4 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  check: "M5 12.5 10 17l9-10",
  chevronRight: "M9 5l7 7-7 7",
  chevronLeft: "M15 5l-7 7 7 7",
  bell: "M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 21a2 2 0 0 0 4 0",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.3-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  logout: "M15 4h4v16h-4M11 16l4-4-4-4M15 12H3",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z",
  heart: "M12 20s-7-4.6-7-9.5A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7 3.5C19 15.4 12 20 12 20z",
  sparkle: "M12 3v6M12 15v6M3 12h6M15 12h6M6.5 6.5l3 3M14.5 14.5l3 3M17.5 6.5l-3 3M9.5 14.5l-3 3",
  mapPin: "M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11ZM12 10m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
  phone: "M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  arrowLeft: "M19 12H5M11 6l-6 6 6 6",
  edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  leaf: "M5 19c0-8 6-13 14-13 0 8-5 14-14 13zM5 19c3-5 6-7 9-8",
  shield: "M12 3l7 3v6c0 4.4-3 7.4-7 9-4-1.6-7-4.6-7-9V6z",
  trophy: "M6 4h12v3a6 6 0 0 1-12 0zM6 5H3a3 3 0 0 0 3 4M18 5h3a3 3 0 0 0-3 4M10 13h4l-.5 4h-3zM8 21h8",
  percent: "M6 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M18 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M6 18 18 6",
  box: "M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6",
  archive: "M3 4h18v4H3zM5 8v12h14V8M9 12h6",
  ticket: "M3 9a2 2 0 0 0 0 6v2a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-2a2 2 0 0 1 0-6V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1zM14 6v12",
  wallet: "M3 8h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 8V7a2 2 0 0 1 2-2h12M17 13h.5",
  lock: "M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3",
  dice: "M5 5h14v14H5zM9 9h.01M15 15h.01M12 12h.01M15 9h.01M9 15h.01",
  chart: "M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3",
  sliders: "M4 8h10M18 8h2M4 16h2M10 16h10M14 6v4M6 14v4",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  x: "M6 6l12 12M18 6L6 18",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  camera: "M3 8h3l2-2.5h8L18 8h3v12H3zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  calendarCheck: "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4M9.5 15.5l2 2 3.5-4",
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
  const d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      {d
        .split("M")
        .filter(Boolean)
        .map((seg, i) => (
          <path key={i} d={"M" + seg} />
        ))}
    </svg>
  );
}
