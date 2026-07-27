'use client'

import { useCallback, useEffect, useState } from 'react'

// Types pour le SDK Facebook
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
const SDK_TIMEOUT_MS = 10000 // 10 secondes

export type FacebookSDKStatus = 'loading' | 'ready' | 'error'

/**
 * Pourquoi le SDK n'est pas prêt — permet à l'UI de distinguer un problème
 * de configuration (rien à faire côté utilisateur) d'un blocage navigateur
 * (bloqueur de pub / protection anti-pistage, très courant sur
 * connect.facebook.net — voir whatsapp-embedded-signup-button.tsx).
 * `null` tant que le statut n'est pas 'error'.
 */
export type FacebookSDKErrorReason = 'missing-config' | 'network-error' | 'timeout' | null

export interface FacebookSDKState {
  status: FacebookSDKStatus
  reason: FacebookSDKErrorReason
  /** Retire le script SDK périmé et retente le chargement, sans recharger la page. */
  retry: () => void
}

/**
 * Hook React pour gérer le chargement et l'initialisation du SDK Facebook.
 *
 * Ce hook gère:
 * - Le chargement asynchrone du script SDK Facebook
 * - L'initialisation du SDK avec l'App ID fourni
 * - Les états de chargement (loading, ready, error) avec la raison de l'échec
 * - Un timeout de 10 secondes pour détecter les échecs de chargement
 * - Un retry manuel qui nettoie le script périmé et relance le chargement
 *
 * @param appId - L'ID de l'application Facebook (obligatoire pour l'initialisation)
 * @returns `{ status, reason, retry }`
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { status, reason, retry } = useFacebookSDK(appId)
 *
 *   return (
 *     <button onClick={status === 'error' && reason !== 'missing-config' ? retry : connect} disabled={status !== 'ready'}>
 *       {status === 'loading' ? 'Chargement...' : 'Connecter'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useFacebookSDK(appId: string | null): FacebookSDKState {
  // 'missing-config' is a pure function of the appId prop — derived below,
  // never written via setState — so there's no attempt to load anything
  // (and no retry) when the server never handed us an App ID at all.
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadErrorReason, setLoadErrorReason] = useState<'network-error' | 'timeout' | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    // Rien à charger sans appId — le cas 'missing-config' est dérivé plus
    // bas à partir du prop, pas géré par ce state machine de chargement.
    if (!appId) return

    let timeoutId: NodeJS.Timeout | null = null
    let isCleanedUp = false

    function fail(nextReason: 'network-error' | 'timeout') {
      if (isCleanedUp) return
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      setLoadStatus('error')
      setLoadErrorReason(nextReason)
    }

    /**
     * Initialise le SDK Facebook avec l'App ID fourni
     */
    function initSdk() {
      if (isCleanedUp || !appId) return

      try {
        if (!window.FB) {
          // fbAsyncInit s'est déclenché mais FB n'a jamais été défini — le
          // script a probablement été neutralisé silencieusement par le
          // navigateur (bloqueur de pub / protection anti-pistage) plutôt
          // que rejeté franchement (auquel cas script.onerror l'aurait déjà
          // signalé plus bas).
          fail('network-error')
          return
        }

        window.FB.init({
          appId: appId,
          version: 'v21.0',
        })
        setLoadStatus('ready')
        setLoadErrorReason(null)

        // Nettoyer le timeout si l'initialisation réussit
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du SDK Facebook:', error)
        fail('network-error')
      }
    }

    /**
     * Charge le script SDK Facebook si nécessaire
     */
    function loadSdk() {
      // Vérifier si le SDK est déjà chargé
      if (window.FB) {
        initSdk()
        return
      }

      // Vérifier si le script est déjà en cours de chargement
      const existingScript = document.getElementById('facebook-jssdk')
      if (existingScript) {
        // Le script est déjà présent, attendre l'initialisation. Si ce
        // script avait déjà silencieusement échoué lors d'un montage
        // précédent, fbAsyncInit ne sera jamais rappelé — le timeout
        // ci-dessous reste le filet de sécurité dans ce cas.
        window.fbAsyncInit = initSdk
        return
      }

      // Charger le script SDK
      window.fbAsyncInit = initSdk

      const script = document.createElement('script')
      script.id = 'facebook-jssdk'
      script.src = SDK_SRC
      script.async = true
      script.defer = true

      // Gérer les erreurs de chargement du script
      script.onerror = () => fail('network-error')

      document.body.appendChild(script)
    }

    // Définir un timeout pour détecter les échecs silencieux (le cas le
    // plus fréquent en production : le navigateur ignore la requête sans
    // déclencher ni succès ni onerror).
    timeoutId = setTimeout(() => {
      console.error('Timeout: Le SDK Facebook n\'a pas pu être chargé dans le délai imparti')
      fail('timeout')
    }, SDK_TIMEOUT_MS)

    // Démarrer le chargement du SDK
    loadSdk()

    // Cleanup: nettoyer le timeout au démontage
    return () => {
      isCleanedUp = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [appId, reloadKey]) // Re-charger si l'appId change ou sur un retry manuel

  const retry = useCallback(() => {
    // Retire le tag <script> périmé pour forcer un vrai nouvel essai réseau
    // plutôt que de rester accroché à une tentative déjà morte.
    document.getElementById('facebook-jssdk')?.remove()
    setLoadStatus('loading')
    setLoadErrorReason(null)
    setReloadKey((key) => key + 1)
  }, [])

  if (!appId) {
    return { status: 'error', reason: 'missing-config', retry }
  }

  return { status: loadStatus, reason: loadErrorReason, retry }
}
