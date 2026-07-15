import { Construction } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export function ComingSoon({ label }: { label: string }) {
  return (
    <div className="p-4 md:p-6">
      <EmptyState
        icon={Construction}
        title={label}
        description="Cet écran arrive dans une prochaine étape de la refonte."
      />
    </div>
  )
}
