interface LogoIconProps {
  size?: number;
  mode?: "light" | "dark";
}

export function LogoIcon({ size = 28, mode = "light" }: LogoIconProps) {
  const eyeColor = mode === "dark" ? "#e8e8e8" : "#111111";

  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* top circuit pins */}
      <line x1="8" y1="7" x2="8" y2="2" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="18" y1="7" x2="18" y2="2" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="28" y1="7" x2="28" y2="2" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="2" r="2.5" fill="#E24B4A" />
      <circle cx="18" cy="2" r="2.5" fill="#1D9E75" />
      <circle cx="28" cy="2" r="2.5" fill="#E24B4A" />

      {/* chip body */}
      <rect x="1" y="7" width="34" height="27" rx="6" fill="none" stroke="#1D9E75" strokeWidth="2.5" />

      {/* eye */}
      <ellipse cx="18" cy="20" rx="9" ry="6" fill="none" stroke={eyeColor} strokeWidth="2.5" />
      <circle cx="18" cy="20" r="3.5" fill={eyeColor} />
      <circle cx="18" cy="20" r="1.5" fill="#1D9E75" />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  mode?: "light" | "dark";
}

export default function Logo({ size = 28, mode = "light" }: LogoProps) {
  const wordColor = mode === "dark" ? "#e8e8e8" : "#111111";

  return (
    <div className="flex items-center gap-2">
      <LogoIcon size={size} mode={mode} />
      <div className="flex flex-col leading-none">
        <span className="font-extrabold" style={{ color: wordColor, fontSize: size * 0.43 }}>
          Threat
        </span>
        <span
          className="font-light"
          style={{ color: "#1D9E75", fontSize: size * 0.43, letterSpacing: "1px" }}
        >
          Lens
        </span>
      </div>
    </div>
  );
}
