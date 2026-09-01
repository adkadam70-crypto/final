import Image from 'next/image'

export function AppLogo({ className = 'h-9 w-auto' }: { className?: string }) {
  return <Image src="/app-logo.png" alt="" width={377} height={328} className={`${className} object-contain`} priority unoptimized />
}
