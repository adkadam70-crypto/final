import Image from 'next/image'

export function AppLogo({ className = 'w-9 h-9' }: { className?: string }) {
  return <Image src="/app-logo.png" alt="" width={180} height={180} className={`${className} object-contain`} priority unoptimized />
}
