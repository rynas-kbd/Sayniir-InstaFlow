import { Construction } from 'lucide-react'

export function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted">
        <Construction className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Cet écran arrive dans une prochaine étape de la refonte.
      </p>
    </div>
  )
}
