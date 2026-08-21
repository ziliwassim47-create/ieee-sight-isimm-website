import Image from "next/image"
import { logos, type LogoProps } from "@/lib/logos"

export function Logo({ type, className }: LogoProps) {
  const config = logos[type]
  const imageClassName = className || config.className

  if (type === "wie") {
    return (
      <span className="inline-flex shrink-0 items-center">
        <Image
          src={config.src}
          alt={config.alt}
          width={config.width}
          height={config.height}
          className={`${imageClassName} dark:hidden`}
          priority
        />
        <Image
          src="/logos/sight logo blanc.png"
          alt={config.alt}
          width={337}
          height={338}
          className={`${imageClassName} hidden dark:block`}
          priority
        />
      </span>
    )
  }

  return (
    <Image
      src={config.src}
      alt={config.alt}
      width={config.width}
      height={config.height}
      className={imageClassName}
    />
  )
} 
