interface OrbitalGlobeProps {
  size?: "sm" | "md" | "lg";
  active?: boolean;
}

export function OrbitalGlobe({ size = "md", active = false }: OrbitalGlobeProps) {
  const dimension = size === "sm" ? 28 : size === "lg" ? 64 : 42;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0 select-none"
      style={{ width: dimension, height: dimension }}
      aria-hidden="true"
    >
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/20 via-violet-500/15 to-blue-500/20 blur-md transition-opacity duration-300 ${
          active ? "opacity-100" : "opacity-60"
        }`}
      />
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className="relative w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="linguaOrbitGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>

        {/* Outer sphere */}
        <circle
          cx="32"
          cy="32"
          r="24"
          stroke="url(#linguaOrbitGrad)"
          strokeWidth="1.75"
          strokeOpacity="0.85"
        />

        {/* Rotating equatorial & meridian ellipses */}
        <g className="origin-center animate-orbit-slow" style={{ transformOrigin: "32px 32px" }}>
          <ellipse
            cx="32"
            cy="32"
            rx="24"
            ry="10"
            stroke="url(#linguaOrbitGrad)"
            strokeWidth="1.25"
            strokeOpacity="0.65"
          />
          <ellipse
            cx="32"
            cy="32"
            rx="10"
            ry="24"
            stroke="url(#linguaOrbitGrad)"
            strokeWidth="1.25"
            strokeOpacity="0.65"
          />
        </g>

        {/* Counter-rotating diagonal orbit */}
        <g className="origin-center animate-orbit-reverse" style={{ transformOrigin: "32px 32px" }}>
          <ellipse
            cx="32"
            cy="32"
            rx="22"
            ry="8"
            transform="rotate(42 32 32)"
            stroke="#3B82F6"
            strokeWidth="1.15"
            strokeOpacity="0.45"
            strokeDasharray="4 4"
          />
        </g>

        {/* Core node */}
        <circle cx="32" cy="32" r="3.5" fill="url(#linguaOrbitGrad)" />
      </svg>
    </div>
  );
}
