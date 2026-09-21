import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export interface TestimonialAuthor {
  name: string
  handle?: string
}

export interface TestimonialCardProps {
  author: TestimonialAuthor
  text: string
  /** "default" for a standalone/section card, "compact" for a dense strip
   *  (e.g. inside the hero) — sized and clamped for a much smaller box
   *  instead of relying on ad-hoc child-selector overrides per call site. */
  size?: "default" | "compact"
  /** "solid" is the opaque bg-card card. "glass" is a translucent,
   *  backdrop-blurred card — same treatment as the header/CTA pill/Ignition
   *  Terminal elsewhere on this page (bg-white/[0.04] + backdrop-blur-xl),
   *  so it reads as part of the same glass UI instead of a flat panel. */
  variant?: "solid" | "glass"
  className?: string
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function TestimonialCard({ author, text, size = "default", variant = "solid", className }: TestimonialCardProps) {
  const compact = size === "compact"
  const glass = variant === "glass"

  return (
    <div
      className={cn(
        "flex flex-col rounded-3xl text-left transition-colors duration-300",
        glass
          ? "border border-white/15 bg-white/[0.04] backdrop-blur-xl hover:bg-white/[0.07] hover:border-white/25"
          : "border border-border bg-card hover:border-primary/30",
        compact ? "w-[270px] shrink-0 rounded-2xl p-3.5" : "w-[320px] shrink-0 p-5",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className={cn("border", glass ? "border-white/15" : "border-border", compact ? "h-7 w-7 sm:h-8 sm:w-8" : "h-10 w-10")}>
          <AvatarFallback
            className={cn(
              "font-bold text-primary",
              glass ? "bg-white/10" : "bg-accent/60",
              compact ? "text-[10px]" : "text-xs",
            )}
          >
            {initials(author.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start min-w-0">
          <h3 className={cn("font-bold leading-none text-white truncate max-w-full", compact ? "text-xs" : "text-sm")}>
            {author.name}
          </h3>
          {author.handle && (
            <p className={cn("mt-1 text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>{author.handle}</p>
          )}
        </div>
      </div>
      <p
        className={cn(
          glass ? "text-zinc-100" : "text-muted-foreground",
          "leading-relaxed",
          compact ? "mt-2 text-[10px] sm:mt-2.5 sm:text-[11px] line-clamp-4" : "mt-4 text-sm",
        )}
      >
        {text}
      </p>
    </div>
  )
}
