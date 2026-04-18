interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <img
      src="/SilesiaID_Logo-nobg.svg"
      height={size}
      width={Math.round(size * 1023 / 803)}
      alt="SilesiaID"
      aria-hidden="true"
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}

interface SilesiaIDLogoProps {
  iconSize?: number;
  className?: string;
}

export function SilesiaIDLogo({ iconSize = 30, className }: SilesiaIDLogoProps) {
  return (
    <img
      src="/SilesiaID_Logo-nobg.svg"
      height={iconSize}
      width={Math.round(iconSize * 1023 / 803)}
      alt="SilesiaID"
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
