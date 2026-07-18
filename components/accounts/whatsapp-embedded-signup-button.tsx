'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

declare global {
  interface Window {
    FB?: {
      init: (params: { appId: string; version: string }) => void
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        params: { config_id: string; response_type: string; override_default_response_type: boolean }
      ) => void
    }
    fbAsyncInit?: () => void
  }
}

const SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js'

/**
 * WhatsApp Embedded Signup — unlike Instagram/Messenger's server redirect,
 * this is a client-driven popup via the Facebook JS SDK. It yields an
 * authorization `code` (FB.login callback) and, separately, a `waba_id`/
 * `phone_number_id` pair delivered through a WA_EMBEDDED_SIGNUP postMessage
 * event once the user finishes onboarding a number inside the popup. Both
 * pieces are required before the server-side exchange (POST /api/accounts/whatsapp)
 * can complete.
 */
export function WhatsAppEmbeddedSignupButton({ appId, configId }: { appId: string | null; configId: string | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const signupData = useRef<{ phoneNumberId?: string; wabaId?: string }>({})

  useEffect(() => {
    if (!appId) return

    function initSdk() {
      window.FB?.init({ appId: appId!, version: 'v21.0' })
    }

    if (window.FB) {
      initSdk()
    } else if (!document.getElementById('facebook-jssdk')) {
      window.fbAsyncInit = initSdk
      const script = document.createElement('script')
      script.id = 'facebook-jssdk'
      script.src = SDK_SRC
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== 'https://www.facebook.com') return
      try {
        const data = JSON.parse(event.data)
        if (data.type !== 'WA_EMBEDDED_SIGNUP') return
        if (data.event === 'FINISH') {
          signupData.current = {
            phoneNumberId: data.data?.phone_number_id,
            wabaId: data.data?.waba_id,
          }
        }
      } catch {
        // Non-JSON postMessage from an unrelated Facebook script — ignore.
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [appId])

  async function connect() {
    if (!appId || !configId) {
      toast.error("WhatsApp Embedded Signup n'est pas configuré (variables d'environnement manquantes)")
      return
    }
    if (!window.FB) {
      toast.error('Le SDK Facebook n\'a pas encore chargé — réessayez dans un instant')
      return
    }

    setLoading(true)
    signupData.current = {}

    // The Facebook JS SDK inspects the callback it's given and rejects async
    // functions outright ("Expression is of type asyncfunction, not
    // function"), so the callback passed to FB.login must stay a plain
    // synchronous function — it just fires off the async handler below
    // without awaiting it (the SDK doesn't use the callback's return value).
    async function handleLoginResponse(response: { authResponse?: { code?: string } }) {
      const code = response.authResponse?.code
      if (!code) {
        toast.error('Connexion WhatsApp annulée ou refusée')
        setLoading(false)
        return
      }

      // The WA_EMBEDDED_SIGNUP postMessage can arrive slightly after the
      // FB.login callback fires — give it a short grace window.
      for (let i = 0; i < 20 && !signupData.current.phoneNumberId; i++) {
        await new Promise((r) => setTimeout(r, 250))
      }

      const { phoneNumberId, wabaId } = signupData.current
      if (!phoneNumberId || !wabaId) {
        toast.error("Aucun numéro n'a été configuré dans le popup WhatsApp")
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/accounts/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, phoneNumberId, wabaId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Échec de la connexion')
        toast.success('Compte WhatsApp connecté')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    window.FB.login(
      (response) => {
        void handleLoginResponse(response)
      },
      { config_id: configId, response_type: 'code', override_default_response_type: true }
    )
  }

  return (
    <Button variant="outline" onClick={connect} disabled={loading || !appId || !configId}>
      <Phone className="size-4" />
      {loading ? 'Connexion…' : 'Connecter WhatsApp'}
    </Button>
  )
}
