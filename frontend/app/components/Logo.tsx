interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Blue badge background */}
      <rect width="32" height="32" rx="8" fill="#185FA5" />

      {/* White ID card / document */}
      <rect x="7" y="5.5" width="13" height="16.5" rx="2.5" fill="white" />

      {/* Document lines (content placeholders) */}
      <rect x="10" y="9.5" width="7" height="1.5" rx="0.75" fill="#185FA5" opacity="0.25" />
      <rect x="10" y="12.5" width="5" height="1.5" rx="0.75" fill="#185FA5" opacity="0.25" />
      <rect x="10" y="15.5" width="6" height="1.5" rx="0.75" fill="#185FA5" opacity="0.25" />

      {/* Teal verification seal */}
      <circle cx="21.5" cy="21.5" r="7" fill="#1D9E75" />
      <path
        d="M18.5 21.5l2 2 3.5-4"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface SilesiaIDLogoProps {
  iconSize?: number;
  className?: string;
}

export function SilesiaIDLogo({ iconSize = 30, className }: SilesiaIDLogoProps) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={iconSize} />
      <span className="text-[15px] font-semibold tracking-tight leading-none select-none">
        <span className="text-gray-900">Silesia</span>
        <span className="text-[#185FA5]">ID</span>
      </span>
    </span>
  );
}
