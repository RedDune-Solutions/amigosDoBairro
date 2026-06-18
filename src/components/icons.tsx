import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function Coffee(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
      <path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 3v2M11.5 3v2" />
    </svg>
  );
}

export function Stamp(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 4.5a3 3 0 0 1 6 0c0 1.6-1.5 2.4-1.5 4h-3C10.5 6.9 9 6.1 9 4.5Z" />
      <path d="M6 15h12v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2Z" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function Target(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

export function Card(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M7 14h3" />
    </svg>
  );
}

export function Star(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4.5l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L5.8 9.7l5-.7L12 4.5Z" />
    </svg>
  );
}

export function Gift(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="9" width="16" height="11" rx="1.5" />
      <path d="M4 13h16M12 9v11" />
      <path d="M12 9c-1.5-3-5-3-5-1s2 1 5 1Zm0 0c1.5-3 5-3 5-1s-2 1-5 1Z" />
    </svg>
  );
}

export function Sparkle(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4c.5 3 1.8 4.3 4.8 4.8C13.8 9.3 12.5 10.6 12 13.6 11.5 10.6 10.2 9.3 7.2 8.8 10.2 8.3 11.5 7 12 4Z" />
      <path d="M18.5 14.5c.3 1.4.8 1.9 2.2 2.2-1.4.3-1.9.8-2.2 2.2-.3-1.4-.8-1.9-2.2-2.2 1.4-.3 1.9-.8 2.2-2.2Z" />
    </svg>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function QrCode(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 14h3v3M20 14v6M17 20h3M14 20h0" />
    </svg>
  );
}

export function Calendar(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M4 9h16M8 3v4M16 3v4" />
    </svg>
  );
}
