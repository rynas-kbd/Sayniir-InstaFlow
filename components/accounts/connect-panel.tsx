'use client'

import { useState } from 'react'
import { Camera, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WhatsAppEmbeddedSignupButton } from './whatsapp-embedded-signup-button'

export function ConnectPanel({
  whatsappAppId,
  whatsappConfigId,
}: {
  whatsappAppId: string | null
  whatsappConfigId: string | null
}) {
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null)

  function connectInstagram() {
    setLoadingPlatform('instagram')
    window.location.href = '/api/auth/facebook'
  }

  function connectMessenger() {
    setLoadingPlatform('messenger')
    window.location.href = '/api/auth/messenger'
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={connectInstagram} disabled={loadingPlatform !== null}>
        <Camera className="size-4" />
        {loadingPlatform === 'instagram' ? 'Redirection…' : 'Connecter Instagram'}
      </Button>
      <Button variant="secondary" onClick={connectMessenger} disabled={loadingPlatform !== null}>
        <MessageCircle className="size-4" />
        {loadingPlatform === 'messenger' ? 'Redirection…' : 'Connecter Messenger'}
      </Button>
      <WhatsAppEmbeddedSignupButton appId={whatsappAppId} configId={whatsappConfigId} />
    </div>
  )
}
