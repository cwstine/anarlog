export const COROLA_MARK_VIEW_BOX = "0 0 128 128";

export function CorolaMark({ className }: { className?: string }) {
  return (
    <svg
      data-testid="corola-mark"
      viewBox={COROLA_MARK_VIEW_BOX}
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <ellipse
        data-corola-petal
        cx="82"
        cy="34"
        rx="15"
        ry="24"
        transform="rotate(35 82 34)"
      />
      <ellipse
        data-corola-petal
        cx="46"
        cy="34"
        rx="15"
        ry="24"
        transform="rotate(-35 46 34)"
      />
      <ellipse data-corola-petal cx="29" cy="64" rx="24" ry="15" />
      <ellipse
        data-corola-petal
        cx="46"
        cy="94"
        rx="15"
        ry="24"
        transform="rotate(35 46 94)"
      />
      <ellipse
        data-corola-petal
        cx="82"
        cy="94"
        rx="15"
        ry="24"
        transform="rotate(-35 82 94)"
      />
      <circle cx="64" cy="64" r="16" />
    </svg>
  );
}
