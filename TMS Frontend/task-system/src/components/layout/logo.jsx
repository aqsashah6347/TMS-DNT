export default function Logo({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="tmsLogoGrad"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fdba74" />
          <stop offset="1" stopColor="#c2410c" />
        </linearGradient>
      </defs>
      <path d="M16 2L28 10V22L16 30L4 22V10L16 2Z" fill="url(#tmsLogoGrad)" />
      <path d="M16 2L28 10L16 16L4 10L16 2Z" fill="#fed7aa" fillOpacity="0.5" />
      <path d="M16 16L28 10V22L16 30V16Z" fill="#7c2d12" fillOpacity="0.4" />
    </svg>
  );
}
