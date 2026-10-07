/**
 * Line icons drawn on a 24x24 grid, stroked with currentColor. Decorative only:
 * every icon is shown next to a text label.
 */

export type IconName =
  | "goal"
  | "plan"
  | "act"
  | "observe"
  | "hidden"
  | "replan"
  | "result"
  | "search"
  | "browser"
  | "code"
  | "terminal"
  | "file"
  | "file-edit"
  | "calculator"
  | "calendar"
  | "mail"
  | "money"
  | "server"
  | "chart"
  | "lock"
  | "person"
  | "chat"
  | "robot"
  | "check"
  | "cross"
  | "pause"
  | "play"
  | "step"
  | "back"
  | "globe";

const PATHS: Record<IconName, string> = {
  goal: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10 M12 11a1 1 0 1 0 0 2a1 1 0 1 0 0-2",
  plan: "M8 6h12 M8 12h12 M8 18h12 M3.5 6h.01 M3.5 12h.01 M3.5 18h.01",
  act: "M13 2L4 14h7l-1 8l9-12h-7z",
  observe: "M2 12s3.5-7 10-7s10 7 10 7s-3.5 7-10 7s-10-7-10-7z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6",
  hidden: "M3 3l18 18 M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2 M6.6 6.6C3.9 8.3 2 12 2 12s3.5 7 10 7c1.9 0 3.5-.5 4.9-1.3 M9.9 9.9a3 3 0 0 0 4.2 4.2",
  replan: "M3 12a9 9 0 0 1 15.5-6.2 M21 3v6h-6 M21 12a9 9 0 0 1-15.5 6.2 M3 21v-6h6",
  result: "M4 12l5 5L20 6",
  search: "M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13 M15.5 15.5L21 21",
  browser: "M3 5h18v14H3z M3 9h18 M6 7h.01 M8.5 7h.01",
  code: "M8 7l-5 5l5 5 M16 7l5 5l-5 5 M14 4l-4 16",
  terminal: "M3 5h18v14H3z M7 10l3 2.5L7 15 M12 15h5",
  file: "M6 3h8l4 4v14H6z M14 3v4h4 M9 12h6 M9 16h6",
  "file-edit": "M6 3h8l4 4v6 M14 3v4h4 M6 3v18h6 M14.5 20.5l6-6l-2-2l-6 6l-.5 2.5z",
  calculator: "M5 3h14v18H5z M8 6h8v3H8z M8 13h.01 M12 13h.01 M16 13h.01 M8 17h.01 M12 17h.01 M16 17h.01",
  calendar: "M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4",
  mail: "M3 5h18v14H3z M3 6l9 7l9-7",
  money: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M15 9c-.5-1.2-1.7-2-3-2c-1.7 0-3 1-3 2.3c0 3 6 1.7 6 4.7c0 1.3-1.3 2.3-3 2.3c-1.4 0-2.6-.8-3-2 M12 5.5v13",
  server: "M4 4h16v6H4z M4 14h16v6H4z M7.5 7h.01 M7.5 17h.01",
  chart: "M4 20V4 M4 20h16 M8 16v-5 M12 16V8 M16 16v-3",
  lock: "M6 11h12v10H6z M8.5 11V7.5a3.5 3.5 0 0 1 7 0V11",
  person: "M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8 M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5",
  chat: "M4 5h16v11H9l-5 4z",
  robot: "M6 8h12v11H6z M12 4v4 M9.5 12.5h.01 M14.5 12.5h.01 M9.5 16h5 M3 12v3 M21 12v3",
  check: "M4 12l5 5L20 6",
  cross: "M6 6l12 12 M18 6L6 18",
  pause: "M8 5v14 M16 5v14",
  play: "M7 4l13 8l-13 8z",
  step: "M5 4l10 8l-10 8z M19 4v16",
  back: "M19 4L9 12l10 8z M5 4v16",
  globe: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M3 12h18 M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9 M12 3c-2.5 2.5-3.8 5.5-3.8 9s1.3 6.5 3.8 9",
};

export function Icon({
  name,
  size = 32,
  strokeWidth = 1.8,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
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
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Same icon as an SVG group, for use inside a larger SVG. Centered on (x, y). */
export function IconG({
  name,
  x,
  y,
  size = 32,
  strokeWidth = 1.8,
  className,
}: {
  name: IconName;
  x: number;
  y: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
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
      <path d={PATHS[name]} />
    </g>
  );
}
