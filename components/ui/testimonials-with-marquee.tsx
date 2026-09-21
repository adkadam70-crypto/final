import { cn } from "@/lib/utils"
import { TestimonialCard, TestimonialAuthor } from "@/components/ui/testimonial-card"

interface TestimonialsSectionProps {
  title: string
  description: string
  testimonials: Array<{
    author: TestimonialAuthor
    text: string
  }>
  className?: string
}

export function TestimonialsSection({ title, description, testimonials, className }: TestimonialsSectionProps) {
  return (
    <section className={cn("py-16 sm:py-24", className)}>
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 text-center sm:gap-10">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <h2 className="text-2xl font-bold text-white sm:text-4xl">{title}</h2>
          <p className="max-w-[600px] text-sm text-muted-foreground sm:text-base">{description}</p>
        </div>

        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
          <div className="group flex overflow-hidden p-2 [--gap:1rem] [gap:var(--gap)] flex-row [--duration:36s]">
            <div className="flex shrink-0 justify-around [gap:var(--gap)] animate-[marquee_var(--duration)_linear_infinite] flex-row group-hover:[animation-play-state:paused]">
              {[...Array(2)].map((_, setIndex) =>
                testimonials.map((testimonial, i) => (
                  <TestimonialCard key={`${setIndex}-${i}`} {...testimonial} />
                )),
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-background sm:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-l from-background sm:block" />
        </div>
      </div>
    </section>
  )
}
