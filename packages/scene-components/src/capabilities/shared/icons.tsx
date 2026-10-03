/**
 * Icons for the capabilities area: the agents icon set, plus the few shapes it
 * lacks (weather, hotel, map pin, card, phone, cart, helpers splitting and
 * merging, film, sound). Same 24x24 grid and stroke style, so both sets mix.
 */
import { Icon as AgentIcon, IconG as AgentIconG, type IconName } from "../../agents/shared/icons.tsx";

export type ExtraIconName =
  | "weather"
  | "hotel"
  | "pin"
  | "card"
  | "phone"
  | "cart"
  | "folder"
  | "split"
  | "merge"
  | "film"
  | "sound"
  | "mute"
  | "hand";

export type CapIconName = IconName | ExtraIconName;

const EXTRA: Record<ExtraIconName, string> = {
  weather:
    "M8 3v1.5 M3.5 8H2 M4.8 4.8l1 1 M11.2 4.8l-1 1 M5.6 10.3A3 3 0 1 1 10.9 7.4 M8 19h10a3.5 3.5 0 0 0 .4-7a5 5 0 0 0-9.6-.8A3.9 3.9 0 0 0 8 19z",
  hotel: "M3 19V6 M3 15h18v4 M21 15v-3a3 3 0 0 0-3-3h-7v6 M7 9.5a1.8 1.8 0 1 0 0 3.6a1.8 1.8 0 1 0 0-3.6",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z M12 7a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5",
  card: "M3 6h18v12H3z M3 10h18 M7 15h4",
  phone: "M7 2h10v20H7z M11 18.5h2",
  cart: "M3 4h2.5l2.2 10.5h10.8L21 7H6.3 M9.5 19a1 1 0 1 0 0 2a1 1 0 1 0 0-2 M17 19a1 1 0 1 0 0 2a1 1 0 1 0 0-2",
  folder: "M3 6.5V19h18V8.5h-9L10 5H3z",
  split: "M4 12h5 M9 12c3 0 3-6 6-6h5 M9 12h11 M9 12c3 0 3 6 6 6h5 M17 3.5l3 2.5l-3 2.5 M17 9.5l3 2.5l-3 2.5 M17 15.5l3 2.5l-3 2.5",
  merge: "M4 6h5c3 0 3 6 6 6 M4 12h11 M4 18h5c3 0 3-6 6-6h5 M17 9.5l3 2.5l-3 2.5",
  film: "M3 5h18v14H3z M7 5v14 M17 5v14 M3 9h4 M3 15h4 M17 9h4 M17 15h4",
  sound: "M4 9h4l5-4v14l-5-4H4z M16.5 8.5a5 5 0 0 1 0 7 M19 6a8.5 8.5 0 0 1 0 12",
  mute: "M4 9h4l5-4v14l-5-4H4z M16 9.5l5 5 M21 9.5l-5 5",
  hand: "M8 13V5.5a1.5 1.5 0 0 1 3 0V12 M11 11V4.5a1.5 1.5 0 0 1 3 0V12 M14 11.5V6a1.5 1.5 0 0 1 3 0v7.5c0 4-2.5 7-6.5 7c-3 0-4.5-1.5-6-4L3 13.5c-.8-1.3.9-2.6 2-1.5L8 15",
};

function isExtra(name: CapIconName): name is ExtraIconName {
  return name in EXTRA;
}

export function CapIcon({
  name,
  size = 32,
  strokeWidth = 1.8,
  className,
}: {
  name: CapIconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  if (!isExtra(name)) return <AgentIcon name={name} size={size} strokeWidth={strokeWidth} className={className} />;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={EXTRA[name]} />
    </svg>
  );
}

/** Same icon as an SVG group centered on (x, y), for use inside a larger SVG. */
export function CapIconG({
  name,
  x,
  y,
  size = 32,
  strokeWidth = 1.8,
  className,
}: {
  name: CapIconName;
  x: number;
  y: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  if (!isExtra(name)) return <AgentIconG name={name} x={x} y={y} size={size} strokeWidth={strokeWidth} className={className} />;
  const s = size / 24;
  return (
    <g
      transform={`translate(${x - size / 2}, ${y - size / 2}) scale(${s})`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={EXTRA[name]} />
    </g>
  );
}
