import Image from "next/image"
import { logos, type LogoProps } from "@/lib/logos"

export function Logo({ type, className }: LogoProps) {
  const config = logos[type]
  
  return (
    <Image
      src={config.src}
      alt={config.alt}
      width={config.width}
      height={config.height}
      className={className || config.className}
      priority={type === "wie"} // Prioritize loading the main SIGHT logo
    />
  )
} 