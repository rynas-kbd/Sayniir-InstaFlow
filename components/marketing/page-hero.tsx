export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <section className="gradient-hero relative overflow-hidden border-b border-border">
      <div className="mx-auto max-w-4xl px-6 py-16 text-center md:py-20">
        <p className="mb-3 text-sm font-medium text-primary">{eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance text-foreground md:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>
      </div>
    </section>
  )
}
