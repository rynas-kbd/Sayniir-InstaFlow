'use client'

import { useEffect, useState } from 'react'

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
 * Hook React pour gérer le chargement et l'initialisation du SDK Facebook.
 * 
 * Ce hook gère:
 * - Le chargement asynchrone du script SDK Facebook
 * - L'initialisation du SDK avec l'App ID fourni
 * - Les états de chargement (loading, ready, error)
 * - Un timeout de 10 secondes pour détecter les échecs de chargement
 * - Le nettoyage approprié des ressources
 * 
 * @param appId - L'ID de l'application Facebook (obligatoire pour l'initialisation)
 * @returns Le statut actuel du SDK: 'loading', 'ready', ou 'error'
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const sdkStatus = useFacebookSDK(appId)
 *   
 *   return (
 *     <button disabled={sdkStatus !== 'ready'}>
 *       {sdkStatus === 'loading' ? 'Chargement...' : 'Connecter'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useFacebookSDK(appId: string | null): FacebookSDKStatus {
  const [status, setStatus] = useState<FacebookSDKStatus>('loading')

  useEffect(() => {
    // Si pas d'appId, on ne peut pas initialiser le SDK
    if (!appId) {
      setStatus('error')
      return
    }

    let timeoutId: NodeJS.Timeout | null = null
    let isCleanedUp = false

    /**
     * Initialise le SDK Facebook avec l'App ID fourni
     */
    function initSdk() {
      if (isCleanedUp || !appId) return
      
      try {
        window.FB?.init({ 
          appId: appId, 
          version: 'v21.0' 
        })
        setStatus('ready')
        
        // Nettoyer le timeout si l'initialisation réussit
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du SDK Facebook:', error)
        setStatus('error')
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
        // Le script est déjà présent, attendre l'initialisation
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
      script.onerror = () => {
        if (!isCleanedUp) {
          console.error('Échec du chargement du SDK Facebook')
          setStatus('error')
        }
      }
      
      document.body.appendChild(script)
    }

    // Définir un timeout pour détecter les échecs de chargement
    timeoutId = setTimeout(() => {
      if (status === 'loading' && !isCleanedUp) {
        console.error('Timeout: Le SDK Facebook n\'a pas pu être chargé dans le délai imparti')
        setStatus('error')
      }
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
  }, [appId]) // Re-charger si l'appId change

  return status
}
