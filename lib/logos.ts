// Logo configuration for the SIGHT ISIMM website
export const logos = {
  wie: {
    src: "/logos/sight_logo.png",
    alt: "SIGHT ISIMM Logo",
    width: 180,
    height: 75,
    className: "h-16 w-auto",
  },
  ieee: {
    src: "/logos/logo-isimm-sb.png",
    alt: "IEEE ISIMM Student Branch",
    width: 180,
    height: 75,
    className: "h-16 w-auto",
  },
  ieeeMobile: {
    src: "/logos/logo-isimm-sb.png",
    alt: "IEEE ISIMM Student Branch",
    width: 140,
    height: 60,
    className: "h-12 w-auto",
  },
  sightTunisia: {
    src: "/logos/sight-tunisia-section-logo.png",
    alt: "SIGHT Tunisia Section",
    width: 180,
    height: 75,
    className: "h-6 w-auto",
  },
} as const

// Logo component props type
export type LogoProps = {
  type: keyof typeof logos
  className?: string
}

// Helper function to get logo configuration
export const getLogoConfig = (type: keyof typeof logos) => {
  return logos[type]
} 