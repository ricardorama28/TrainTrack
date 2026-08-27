interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * TrainTrack brand mark: four ascending bars — a rising chart that doubles as a
 * "TT" monogram (progression + analytics). Single-ink via `currentColor`, so it
 * inherits the brand lime when placed in a `text-primary-500` context.
 */
export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="1.5" y="20" width="5.5" height="8" rx="2" fill="currentColor" opacity="0.55" />
      <rect x="9.4" y="14" width="5.5" height="14" rx="2" fill="currentColor" opacity="0.72" />
      <rect x="17.3" y="8" width="5.5" height="20" rx="2" fill="currentColor" opacity="0.86" />
      <rect x="25.2" y="2" width="5.5" height="26" rx="2" fill="currentColor" />
    </svg>
  );
}

interface LogoWordmarkProps {
  size?: number;
  className?: string;
}

/** The mark plus the "TrainTrack" wordmark set in the display font. */
export function LogoWordmark({ size = 28, className = '' }: LogoWordmarkProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Logo size={size} className="text-primary-500" />
      <span className="font-semibold tracking-tight text-content" style={{ fontSize: size * 0.82 }}>
        Train<span className="text-primary-500">Track</span>
      </span>
    </div>
  );
}
