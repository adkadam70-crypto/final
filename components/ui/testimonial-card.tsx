import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export interface TestimonialAuthor {
  name: string
  handle?: string
}

export interface TestimonialCardProps {
  author: TestimonialAuthor
  text: string
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

export function TestimonialCard({ author, text, className }: TestimonialCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-3xl border border-border bg-card",
        "p-5 text-left",
        "w-[320px] shrink-0",
        "transition-colors duration-300 hover:border-primary/30",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border border-border">
          <AvatarFallback className="bg-accent/60 text-xs font-bold text-primary">
            {initials(author.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start">
          <h3 className="text-sm font-bold leading-none text-white">{author.name}</h3>
          {author.handle && <p className="mt-1 text-xs text-muted-foreground">{author.handle}</p>}
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  )
}
