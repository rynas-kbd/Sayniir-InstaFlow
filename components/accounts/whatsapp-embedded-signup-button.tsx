'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFacebookSDK } from '@/hooks/use-facebook-sdk'

/**
 * WhatsApp Embedded Signup — unlike Instagram/Messenger's server redirect,
 * this is a client-driven popup via the Facebook JS SDK. It yields an
 * authorization `code` (FB.login callback) and, separately, a `waba_id`/
 * `phone_number_id` pair delivered through a WA_EMBEDDED_SIGNUP postMessage
 * event once the user finishes onboarding a number inside the popup. Both
 * pieces are required before the server-side exchange (POST /api/accounts/whatsapp)
 * can complete.
 */
// connect.facebook.net est massivement présent sur les listes de blocage
// (bloqueurs de pub, protection anti-pistage des navigateurs) — c'est le cas
// le plus fréquent en pratique, distinct d'un vrai problème de config.
const SDK_ERROR_MESSAGES: Record<'network-error' | 'timeout', string> = {
  'network-error':
    "Votre navigateur bloque le SDK Facebook (bloqueur de publicités ou protection anti-pistage), requis par Meta pour connecter WhatsApp. Autorisez connect.facebook.net pour ce site, ou essayez un autre navigateur, puis réessayez.",
  timeout:
    "Le SDK Facebook n'a pas répondu à temps — souvent le signe d'un bloqueur de publicités ou d'une protection anti-pistage qui bloque connect.facebook.net. Autorisez ce domaine pour ce site, ou essayez un autre navigateur, puis réessayez.",
}

export function WhatsAppEmbeddedSignupButton({ appId, configId }: { appId: string | null; configId: string | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const signupData = useRef<{ phoneNumberId?: string; wabaId?: string }>({})

  // Utiliser le hook pour gérer le chargement du SDK
  const { status: sdkStatus, reason: sdkErrorReason, retry: retrySdk } = useFacebookSDK(appId)

  // Afficher un message d'erreur explicite et actionnable si le SDK échoue à charger
  useEffect(() => {
    if (sdkStatus !== 'error') return
    if (sdkErrorReason === 'missing-config') {
      toast.error("WhatsApp Embedded Signup n'est pas configuré (variables d'environnement manquantes)", { duration: 6000 })
      return
    }
    toast.error(SDK_ERROR_MESSAGES[sdkErrorReason ?? 'network-error'], { duration: 8000 })
  }, [sdkStatus, sdkErrorReason])

  useEffect(() => {
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
  }, [])

  async function connect() {
    if (!appId || !configId) {
      toast.error("WhatsApp Embedded Signup n'est pas configuré (variables d'environnement manquantes)")
      return
    }
    if (sdkStatus !== 'ready') {
      toast.error('Le SDK Facebook n\'est pas encore prêt — veuillez patienter')
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

    window.FB!.login(
      (response) => {
        void handleLoginResponse(response)
      },
      { config_id: configId, response_type: 'code', override_default_response_type: true }
    )
  }

  // Un échec réseau/timeout est récupérable sans recharger la page (l'utilisateur
  // corrige son navigateur puis clique "Réessayer") — contrairement à une config
  // manquante, qui ne se répare pas côté client.
  const isRecoverableError = sdkStatus === 'error' && sdkErrorReason !== 'missing-config'
  const isMissingConfig = sdkStatus === 'error' && sdkErrorReason === 'missing-config'

  // Déterminer le texte du bouton selon l'état
  function getButtonText() {
    if (loading) return 'Connexion…'
    if (sdkStatus === 'loading') return 'Chargement du SDK…'
    if (isMissingConfig) return 'WhatsApp indisponible'
    if (isRecoverableError) return 'Réessayer'
    return 'Connecter WhatsApp'
  }

  // Le bouton est désactivé si:
  // - Le SDK est en cours de chargement
  // - Une connexion est en cours
  // - Les configs sont manquantes (rien à réessayer côté client)
  // Un échec réseau/timeout reste cliquable — le clic relance le chargement.
  const isDisabled = sdkStatus === 'loading' || loading || isMissingConfig || !appId || !configId

  function handleClick() {
    if (isRecoverableError) {
      retrySdk()
      return
    }
    void connect()
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={isDisabled}>
      <Phone className="size-4" />
      {getButtonText()}
    </Button>
  )
}
