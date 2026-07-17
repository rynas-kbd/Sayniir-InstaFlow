'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Camera, MessageCircle, Phone, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog'
import { FormDialogHeader, FormSection } from '@/components/shared/form-section'

export function ConnectPanel() {
  const router = useRouter()
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null)
  const [waOpen, setWaOpen] = useState(false)
  const [waFields, setWaFields] = useState({ accessToken: '', phoneNumberId: '', wabaId: '' })
  const [waError, setWaError] = useState<string | null>(null)

  function connectInstagram() {
    setLoadingPlatform('instagram')
    window.location.href = '/api/auth/facebook'
  }

  function connectMessenger() {
    setLoadingPlatform('messenger')
    window.location.href = '/api/auth/messenger'
  }

  async function submitWhatsApp(e: React.FormEvent) {
    e.preventDefault()
    setLoadingPlatform('whatsapp')
    setWaError(null)
    try {
      const res = await fetch('/api/accounts/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(waFields),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Échec de la connexion')
      setWaOpen(false)
      setWaFields({ accessToken: '', phoneNumberId: '', wabaId: '' })
      toast.success('Compte WhatsApp connecté')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setWaError(message)
      toast.error(message)
    } finally {
      setLoadingPlatform(null)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={connectInstagram} disabled={loadingPlatform !== null}>
          <Camera className="size-4" />
          {loadingPlatform === 'instagram' ? 'Redirection…' : 'Connecter Instagram'}
        </Button>
        <Button variant="secondary" onClick={connectMessenger} disabled={loadingPlatform !== null}>
          <MessageCircle className="size-4" />
          {loadingPlatform === 'messenger' ? 'Redirection…' : 'Connecter Messenger'}
        </Button>
        <Button variant="outline" onClick={() => setWaOpen(true)} disabled={loadingPlatform !== null}>
          <Phone className="size-4" />
          Connecter WhatsApp
        </Button>
      </div>

      <Dialog open={waOpen} onOpenChange={setWaOpen}>
        <DialogContent>
          <DialogHeader>
            <FormDialogHeader
              icon={Phone}
              title="Connecter WhatsApp"
              description="Depuis Meta Business Manager : token System User permanent, phone_number_id et WABA ID."
            />
          </DialogHeader>
          <form onSubmit={submitWhatsApp} className="flex flex-col gap-3">
            <FormSection icon={KeyRound} label="Identifiants API">
              <div className="space-y-1.5">
                <Label htmlFor="wa-token">Token d&apos;accès permanent</Label>
                <Input
                  id="wa-token"
                  autoFocus
                  required
                  value={waFields.accessToken}
                  onChange={(e) => setWaFields({ ...waFields, accessToken: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wa-phone-id">Phone Number ID</Label>
                <Input
                  id="wa-phone-id"
                  required
                  value={waFields.phoneNumberId}
                  onChange={(e) => setWaFields({ ...waFields, phoneNumberId: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wa-waba-id">WABA ID</Label>
                <Input
                  id="wa-waba-id"
                  required
                  value={waFields.wabaId}
                  onChange={(e) => setWaFields({ ...waFields, wabaId: e.target.value })}
                />
              </div>
              {waError && <p className="text-sm text-destructive">{waError}</p>}
            </FormSection>
            <DialogFooter className="mt-1">
              <Button type="button" variant="outline" onClick={() => setWaOpen(false)} disabled={loadingPlatform !== null}>
                Annuler
              </Button>
              <Button type="submit" disabled={loadingPlatform !== null}>
                {loadingPlatform === 'whatsapp' ? 'Connexion…' : 'Connecter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
