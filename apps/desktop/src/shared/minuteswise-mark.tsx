export const MINUTESWISE_MARK_VIEW_BOX = "0 0 128 128";

export function MinutesWiseMark({ className }: { className?: string }) {
  return (
    <svg
      data-testid="minuteswise-mark"
      viewBox={MINUTESWISE_MARK_VIEW_BOX}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        data-minuteswise-monogram
        d="M18 84V45L47 73L64 58L81 79L110 50V84"
        stroke="currentColor"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        data-minuteswise-dial
        cx="64"
        cy="61"
        r="12"
        stroke="currentColor"
        strokeWidth="8"
      />
      <path
        data-minuteswise-minute-hand
        d="M64 50L80 28"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx="64" cy="61" r="4" fill="currentColor" />
    </svg>
  );
}
