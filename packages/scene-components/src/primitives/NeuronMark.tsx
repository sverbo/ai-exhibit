/**
 * The talk's mark: an amber neuron (a dot linked to three others) on a dark
 * rounded square. The same drawing as the favicon in apps/presenter-web/index.html:
 * change both together.
 */
export function NeuronMark({ size, className }: { size: number | string; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true" focusable="false" data-mark="neuron">
      <rect width="32" height="32" rx="7" fill="#110f0d" />
      <g stroke="#f2a93b" strokeWidth="2">
        <line x1="15" y1="17" x2="7" y2="9" />
        <line x1="15" y1="17" x2="25" y2="10" />
        <line x1="15" y1="17" x2="21" y2="26" />
      </g>
      <g fill="#f2a93b">
        <circle cx="15" cy="17" r="5" />
        <circle cx="7" cy="9" r="2.6" />
        <circle cx="25" cy="10" r="2.6" />
        <circle cx="21" cy="26" r="2.6" />
      </g>
    </svg>
  );
}
