'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'

interface Phone3DProps {
  activeIdx: number
  accentColor: string
}

// --- HELPER RENDERING FUNCTIONS FOR REALISTIC APPS (Module Scope) ---
function drawChatBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  bg: string,
  fg: string,
  isRight: boolean
) {
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 36)
  ctx.fill()

  ctx.fillStyle = fg
  ctx.font = '600 34px system-ui, -apple-system, sans-serif'

  const words = text.split(' ')
  let line = ''
  let lineY = y + 65
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > w - 80 && n > 0) {
      ctx.fillText(line, x + 40, lineY)
      line = words[n] + ' '
      lineY += 48
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x + 40, lineY)
}

function drawAppFlowNode(
  ctx: CanvasRenderingContext2D,
  type: string,
  iconEmoji: string,
  label: string,
  summary: string,
  subtitle: string,
  x: number,
  y: number,
  w: number,
  h: number,
  accentColor: string,
  hasTopHandle: boolean,
  hasBottomHandle: boolean,
  insightText?: string,
  isCondition?: boolean
) {
  ctx.fillStyle = '#141418'
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 28)
  ctx.fill()
  ctx.strokeStyle = '#27272a'
  ctx.lineWidth = 3
  ctx.stroke()

  if (insightText) {
    ctx.fillStyle = '#10b98122'
    ctx.beginPath()
    ctx.roundRect(x + w - 340, y - 20, 320, 50, 25)
    ctx.fill()
    ctx.strokeStyle = '#10b98188'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#10b981'
    ctx.font = 'bold 22px system-ui, sans-serif'
    ctx.fillText(insightText, x + w - 320, y + 14)
  }

  if (hasTopHandle) {
    ctx.fillStyle = accentColor
    ctx.beginPath()
    ctx.arc(x + w / 2, y, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#0a0a0c'
    ctx.lineWidth = 4
    ctx.stroke()
  }

  ctx.fillStyle = `${accentColor}22`
  ctx.beginPath()
  ctx.roundRect(x + 24, y + 24, 60, 60, 16)
  ctx.fill()

  ctx.font = '36px system-ui'
  ctx.fillText(iconEmoji, x + 34, y + 68)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif'
  ctx.fillText(label, x + 100, y + 64)

  ctx.fillStyle = '#a1a1aa'
  ctx.font = '500 26px system-ui, sans-serif'
  ctx.fillText(subtitle, x + 24, y + 118)

  ctx.fillStyle = '#1c1c22'
  ctx.beginPath()
  ctx.roundRect(x + 24, y + 134, w - 48, 40, 12)
  ctx.fill()

  ctx.fillStyle = accentColor
  ctx.font = 'bold 22px system-ui, sans-serif'
  ctx.fillText(summary, x + 40, y + 162)

  if (isCondition) {
    const h1X = x + w * 0.25
    ctx.fillStyle = '#10b981'
    ctx.beginPath()
    ctx.arc(h1X, y + h, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#0a0a0c'
    ctx.lineWidth = 4
    ctx.stroke()

    const h2X = x + w * 0.75
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(h2X, y + h, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#0a0a0c'
    ctx.lineWidth = 4
    ctx.stroke()
  } else if (hasBottomHandle) {
    ctx.fillStyle = accentColor
    ctx.beginPath()
    ctx.arc(x + w / 2, y + h, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#0a0a0c'
    ctx.lineWidth = 4
    ctx.stroke()
  }
}

function drawBezierConnector(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
) {
  ctx.strokeStyle = color
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  const midY = (y1 + y2) / 2
  ctx.bezierCurveTo(x1, midY, x2, midY, x2, y2)
  ctx.stroke()
}

function drawWorkflowCard(
  ctx: CanvasRenderingContext2D,
  title: string,
  subtitle: string,
  meta: string,
  x: number,
  y: number,
  color: string
) {
  ctx.fillStyle = '#141418'
  ctx.beginPath()
  ctx.roundRect(x, y, 1040, 220, 32)
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.fillStyle = color
  ctx.font = 'bold 36px system-ui, sans-serif'
  ctx.fillText(title, x + 44, y + 68)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 38px system-ui, sans-serif'
  ctx.fillText(subtitle, x + 44, y + 130)

  ctx.fillStyle = '#a1a1aa'
  ctx.font = '500 28px system-ui, sans-serif'
  ctx.fillText(meta, x + 44, y + 180)
}

function drawConnectorLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
) {
  ctx.strokeStyle = color
  ctx.lineWidth = 6
  ctx.setLineDash([12, 8])
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawMetricBox(
  ctx: CanvasRenderingContext2D,
  label: string,
  val: string,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.fillStyle = '#1c1c22'
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 28)
  ctx.fill()

  ctx.fillStyle = '#a1a1aa'
  ctx.font = '600 26px system-ui, sans-serif'
  ctx.fillText(label, x + 32, y + 55)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'extrabold 44px system-ui, sans-serif'
  ctx.fillText(val, x + 32, y + 120)
}

function drawTimelineItem(
  ctx: CanvasRenderingContext2D,
  title: string,
  desc: string,
  x: number,
  y: number,
  color: string
) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x + 20, y + 24, 10, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 32px system-ui, sans-serif'
  ctx.fillText(title, x + 50, y + 30)

  ctx.fillStyle = '#a1a1aa'
  ctx.font = '28px system-ui, sans-serif'
  ctx.fillText(desc, x + 50, y + 70)
}

function drawTab(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  w: number,
  active: boolean,
  color: string
) {
  ctx.fillStyle = active ? color : '#1c1c22'
  ctx.beginPath()
  ctx.roundRect(x, y, w, 76, 38)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 30px system-ui, sans-serif'
  ctx.fillText(label, x + 36, y + 48)
}

function drawInboxThread(
  ctx: CanvasRenderingContext2D,
  name: string,
  msg: string,
  time: string,
  tag: string,
  x: number,
  y: number,
  tagColor: string,
  active: boolean
) {
  ctx.fillStyle = active ? '#1c1c24' : '#141418'
  ctx.beginPath()
  ctx.roundRect(x, y, 1040, 190, 32)
  ctx.fill()
  ctx.strokeStyle = active ? tagColor : '#27272a'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 38px system-ui, sans-serif'
  ctx.fillText(name, x + 40, y + 65)

  ctx.fillStyle = '#a1a1aa'
  ctx.font = '30px system-ui, sans-serif'
  ctx.fillText(msg, x + 40, y + 120)

  ctx.fillStyle = '#a1a1aa'
  ctx.font = '28px system-ui, sans-serif'
  ctx.fillText(time, x + 840, y + 65)

  ctx.fillStyle = tagColor
  ctx.font = 'bold 28px system-ui, sans-serif'
  ctx.fillText(tag, x + 40, y + 165)
}

function drawContactTableRow(
  ctx: CanvasRenderingContext2D,
  initial: string,
  name: string,
  sub: string,
  tags: string[],
  time: string,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.fillStyle = '#141418'
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 28)
  ctx.fill()
  ctx.strokeStyle = '#27272a'
  ctx.lineWidth = 2
  ctx.stroke()

  // Avatar Circle
  ctx.fillStyle = `${color}22`
  ctx.beginPath()
  ctx.arc(x + 50, y + h / 2, 40, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = color
  ctx.font = 'bold 36px system-ui, sans-serif'
  ctx.fillText(initial, x + 38, y + h / 2 + 12)

  // Name & Sub
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif'
  ctx.fillText(name, x + 110, y + 60)

  ctx.fillStyle = '#a1a1aa'
  ctx.font = '26px system-ui, sans-serif'
  ctx.fillText(sub, x + 110, y + 105)

  // Tag Pills
  tags.forEach((tg, i) => {
    const tx = x + 420 + i * 180
    ctx.fillStyle = `${color}18`
    ctx.beginPath()
    ctx.roundRect(tx, y + 60, 160, 48, 24)
    ctx.fill()
    ctx.strokeStyle = `${color}66`
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = color
    ctx.font = 'bold 22px system-ui, sans-serif'
    ctx.fillText(tg, tx + 16, y + 93)
  })

  // Timestamp
  ctx.fillStyle = '#a1a1aa'
  ctx.font = '26px system-ui, sans-serif'
  ctx.fillText(time, x + w - 240, y + 90)
}

function drawBoutiqueCartCard(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  title: string,
  client: string,
  price: string,
  badgeText: string,
  btnText: string,
  x: number,
  y: number,
  w: number,
  h: number,
  accentColor: string
) {
  ctx.fillStyle = '#141418'
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 32)
  ctx.fill()
  ctx.strokeStyle = `${accentColor}88`
  ctx.lineWidth = 3
  ctx.stroke()

  // Thumbnail
  ctx.fillStyle = '#1c1c24'
  ctx.beginPath()
  ctx.roundRect(x + 30, y + 35, 120, 120, 24)
  ctx.fill()
  ctx.font = '54px system-ui'
  ctx.fillText(emoji, x + 62, y + 115)

  // Title & Client
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 36px system-ui, sans-serif'
  ctx.fillText(title, x + 170, y + 70)

  ctx.fillStyle = '#a1a1aa'
  ctx.font = '28px system-ui, sans-serif'
  ctx.fillText(client, x + 170, y + 115)

  // Badge Status
  ctx.fillStyle = `${accentColor}22`
  ctx.beginPath()
  ctx.roundRect(x + 170, y + 132, 420, 48, 24)
  ctx.fill()
  ctx.fillStyle = accentColor
  ctx.font = 'bold 24px system-ui, sans-serif'
  ctx.fillText(badgeText, x + 190, y + 165)

  // Price (Right)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'extrabold 40px system-ui, sans-serif'
  ctx.fillText(price, x + w - 260, y + 90)

  // Action Button
  ctx.fillStyle = accentColor
  ctx.beginPath()
  ctx.roundRect(x + w - 340, y + 155, 310, 64, 32)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 26px system-ui, sans-serif'
  ctx.fillText(btnText, x + w - 315, y + 197)
}

function drawCampaignCardApp(
  ctx: CanvasRenderingContext2D,
  title: string,
  audience: string,
  progressText: string,
  statusBadge: string,
  roiText: string,
  x: number,
  y: number,
  w: number,
  h: number,
  accentColor: string,
  pct: number
) {
  ctx.fillStyle = '#141418'
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 32)
  ctx.fill()
  ctx.strokeStyle = '#27272a'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 38px system-ui, -apple-system, sans-serif'
  ctx.fillText(title, x + 40, y + 65)

  ctx.fillStyle = '#a1a1aa'
  ctx.font = '28px system-ui, sans-serif'
  ctx.fillText(audience, x + 40, y + 112)

  // Progress Bar Track
  ctx.fillStyle = '#1c1c22'
  ctx.beginPath()
  ctx.roundRect(x + 40, y + 135, w - 380, 24, 12)
  ctx.fill()

  // Progress Bar Fill
  if (pct > 0) {
    ctx.fillStyle = accentColor
    ctx.beginPath()
    ctx.roundRect(x + 40, y + 135, (w - 380) * pct, 24, 12)
    ctx.fill()
  }

  ctx.fillStyle = '#a1a1aa'
  ctx.font = '500 24px system-ui, sans-serif'
  ctx.fillText(progressText, x + 40, y + 195)

  // Status Badge (Right Top)
  ctx.fillStyle = `${accentColor}22`
  ctx.beginPath()
  ctx.roundRect(x + w - 300, y + 45, 260, 54, 27)
  ctx.fill()
  ctx.fillStyle = accentColor
  ctx.font = 'bold 24px system-ui, sans-serif'
  ctx.fillText(statusBadge, x + w - 280, y + 81)

  // ROI / Revenue Tag
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 30px system-ui, sans-serif'
  ctx.fillText(roiText, x + w - 320, y + 195)
}

function drawAppStatBadge(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  iconEmoji: string,
  x: number,
  y: number,
  w: number,
  h: number,
  accentColor: string
) {
  ctx.fillStyle = '#141418'
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 28)
  ctx.fill()
  ctx.strokeStyle = `${accentColor}40`
  ctx.lineWidth = 2
  ctx.stroke()

  // Icon Corner Box
  ctx.fillStyle = `${accentColor}22`
  ctx.beginPath()
  ctx.roundRect(x + 24, y + 24, 52, 52, 14)
  ctx.fill()
  ctx.font = '30px system-ui'
  ctx.fillText(iconEmoji, x + 34, y + 60)

  // Label
  ctx.fillStyle = '#a1a1aa'
  ctx.font = '500 24px system-ui, sans-serif'
  ctx.fillText(label, x + 90, y + 58)

  // Value
  ctx.fillStyle = '#ffffff'
  ctx.font = 'extrabold 44px system-ui, sans-serif'
  ctx.fillText(value, x + 24, y + 122)
}

export function Phone3DCanvas({ activeIdx, accentColor }: Phone3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const phoneGroupRef = useRef<THREE.Group | null>(null)
  const screenMeshRef = useRef<THREE.Mesh | null>(null)
  const ringRef = useRef<THREE.Mesh | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const canvasTextureRef = useRef<THREE.CanvasTexture | null>(null)
  const screen2dCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Function to render Ultra-Retina HD UI screen texture (Hyper-Realistic Real App Screens)
  const updateScreenTexture = (idx: number, accent: string) => {
    if (!screen2dCanvasRef.current) return
    const cvs = screen2dCanvasRef.current
    const ctx = cvs.getContext('2d')
    if (!ctx) return

    const W = cvs.width // 1200
    const H = cvs.height // 2200

    // OLED Deep Black Canvas Background
    ctx.fillStyle = '#0a0a0c'
    ctx.fillRect(0, 0, W, H)

    // Subtle Atmospheric Ambient Glow on Top
    const themeColor = accent || '#c8573c'
    const topGlow = ctx.createRadialGradient(W / 2, 0, 40, W / 2, 0, 700)
    topGlow.addColorStop(0, `${themeColor}33`)
    topGlow.addColorStop(1, 'transparent')
    ctx.fillStyle = topGlow
    ctx.fillRect(0, 0, W, 800)

    // --- TOP SYSTEM STATUS BAR (iOS 18 Authentic) ---
    ctx.fillStyle = '#ffffff'
    ctx.font = '600 44px system-ui, -apple-system, sans-serif'
    ctx.fillText('9:41', 90, 96)

    // Icons: Signal, WiFi, Battery
    ctx.font = '500 36px system-ui, sans-serif'
    ctx.fillText('5G  📶  🔋 98%', W - 320, 96)

    // Dynamic Island Notch
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.roundRect(W / 2 - 160, 36, 320, 68, 34)
    ctx.fill()
    ctx.strokeStyle = '#27272a'
    ctx.lineWidth = 3
    ctx.stroke()

    // Camera lens dot inside island
    ctx.fillStyle = '#10b981'
    ctx.beginPath()
    ctx.arc(W / 2 + 90, 70, 9, 0, Math.PI * 2)
    ctx.fill()

    // =========================================================================
    // FEATURE 0: REAL INSTAGRAM DM CHAT INTERFACE (TON BOTANIQUE 🌿)
    // =========================================================================
    if (idx === 0) {
      // Instagram Header Bar
      ctx.fillStyle = '#141417'
      ctx.fillRect(0, 130, W, 170)
      ctx.strokeStyle = '#27272a'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, 300)
      ctx.lineTo(W, 300)
      ctx.stroke()

      // Back Arrow
      ctx.fillStyle = '#ffffff'
      ctx.font = '400 52px system-ui, sans-serif'
      ctx.fillText('‹', 50, 235)

      // Verified Avatar Ring & Circle
      ctx.fillStyle = '#27272a'
      ctx.beginPath()
      ctx.arc(150, 215, 46, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = themeColor
      ctx.lineWidth = 5
      ctx.stroke()

      // Avatar Icon/Emoji
      ctx.font = '44px system-ui'
      ctx.fillText('🌿', 126, 230)

      // Green Online Status Indicator
      ctx.fillStyle = '#10b981'
      ctx.beginPath()
      ctx.arc(182, 245, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#141417'
      ctx.lineWidth = 4
      ctx.stroke()

      // Account Handle & Badge
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 40px system-ui, sans-serif'
      ctx.fillText('botanik_paris', 220, 205)

      ctx.fillStyle = '#38bdf8'
      ctx.font = 'bold 30px system-ui'
      ctx.fillText('✓', 475, 205)

      ctx.fillStyle = '#10b981'
      ctx.font = '500 28px system-ui, sans-serif'
      ctx.fillText('● IA En direct · Ton Botanique 🌿', 220, 250)

      // Right Header Action Icons
      ctx.fillStyle = '#a1a1aa'
      ctx.font = '36px system-ui'
      ctx.fillText('📞   📹', W - 180, 225)

      // Centered Date Badge
      ctx.fillStyle = '#a1a1aa'
      ctx.font = '500 26px system-ui, sans-serif'
      ctx.fillText('Aujourd\'hui 14:22', W / 2 - 100, 350)

      // --- CHAT MESSAGES THREAD ---
      // 1. User Message (Right - Gray Bubble)
      drawChatBubble(ctx, 'Bonjour ! Je cherche un sérum apaisant pour peau très sensible 🌿', W - 820, 390, 740, 140, '#27272a', '#ffffff', true)

      // 2. AI Agent Response (Left - Brand Accent Bubble)
      drawChatBubble(ctx, 'Coucou ! 🌿 Oui tout à fait ! Notre Sérum Cica-Botanique 98% bio calme immédiatement les rougeurs ✨', 80, 560, 840, 180, themeColor, '#ffffff', false)

      // 3. User Message (Right)
      drawChatBubble(ctx, 'Génial ! Vous avez un code promo pour ma 1ère commande ?', W - 780, 770, 700, 130, '#27272a', '#ffffff', true)

      // 4. AI Agent Response with Promo Code
      drawChatBubble(ctx, 'Profite de -15% aujourd\'hui avec le code BOTANIK15 ! 🛍️🎁', 80, 930, 840, 150, themeColor, '#ffffff', false)

      // --- ATTACHED PRODUCT CHECKOUT CARD (Inside DM) ---
      const cardY = 1110
      ctx.fillStyle = '#18181c'
      ctx.beginPath()
      ctx.roundRect(80, cardY, 840, 320, 36)
      ctx.fill()
      ctx.strokeStyle = `${themeColor}aa`
      ctx.lineWidth = 4
      ctx.stroke()

      // Product Thumbnail Box
      ctx.fillStyle = '#27272a'
      ctx.beginPath()
      ctx.roundRect(110, cardY + 30, 220, 260, 24)
      ctx.fill()
      ctx.font = '80px system-ui'
      ctx.fillText('🧴', 180, cardY + 180)

      // Product Info
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 38px system-ui, sans-serif'
      ctx.fillText('Sérum Cica-Botanique Bio', 360, cardY + 80)

      ctx.fillStyle = '#10b981'
      ctx.font = 'bold 34px system-ui, sans-serif'
      ctx.fillText('29,90 €  ', 360, cardY + 135)

      ctx.fillStyle = '#a1a1aa'
      ctx.font = '500 28px system-ui, sans-serif'
      ctx.fillText('Code BOTANIK15 (-15%) appliqué', 360, cardY + 185)

      // 1-Click Buy Button
      ctx.fillStyle = themeColor
      ctx.beginPath()
      ctx.roundRect(360, cardY + 215, 520, 70, 35)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 30px system-ui, sans-serif'
      ctx.fillText('Commander en 1-Clic 🛍️ →', 400, cardY + 260)

      // Bottom Message Bar
      const inputY = H - 180
      ctx.fillStyle = '#18181c'
      ctx.beginPath()
      ctx.roundRect(60, inputY, W - 120, 110, 55)
      ctx.fill()
      ctx.strokeStyle = '#3f3f46'
      ctx.lineWidth = 3
      ctx.stroke()

      ctx.fillStyle = '#a1a1aa'
      ctx.font = '32px system-ui, sans-serif'
      ctx.fillText('📷   Écrire un message...', 120, inputY + 68)
      ctx.fillText('🎙️  🖼️  ❤️', W - 320, inputY + 68)
    }
    // =========================================================================
    // FEATURE 1: REAL APP FLOW BUILDER SCREEN (Visual Scenarios)
    // =========================================================================
    else if (idx === 1) {
      // Flow Canvas Grid Dot Background (Real XYFlow / ReactFlow Grid Pattern)
      ctx.fillStyle = '#27272a'
      for (let gx = 40; gx < W; gx += 60) {
        for (let gy = 160; gy < H; gy += 60) {
          ctx.beginPath()
          ctx.arc(gx, gy, 2.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // App Header Bar
      ctx.fillStyle = '#141417'
      ctx.fillRect(0, 130, W, 120)
      ctx.strokeStyle = '#27272a'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, 250)
      ctx.lineTo(W, 250)
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 42px system-ui, -apple-system, sans-serif'
      ctx.fillText('⚡ Flow : Accueil & Conversion DM', 60, 205)

      ctx.fillStyle = '#10b981'
      ctx.font = 'bold 28px system-ui'
      ctx.fillText('● ACTIF', W - 180, 205)

      // --- DRAW REAL APP FLOW NODES WITH HANDLES & BEZIER CONNECTORS ---
      // Node 1: Trigger (Top)
      drawAppFlowNode(
        ctx,
        'trigger',
        '⚡',
        'Déclencheur',
        'Mots-clés : #PROMO, #BIO, #OFFRE',
        'DM Instagram entrant',
        80, 290, 1040, 180,
        '#f59e0b',
        false, true
      )

      // Bezier Wire 1 -> 2
      drawBezierConnector(ctx, W / 2, 470, W / 2, 560, '#f59e0b')

      // Node 2: AI Reply Node
      drawAppFlowNode(
        ctx,
        'ai_reply',
        '✨',
        'Réponse IA (GPT-4o)',
        'Persona Botanique 🌿 · Confiance 99%',
        'Génère réponse personnalisée avec code',
        80, 560, 1040, 190,
        '#10b981',
        true, true,
        '✨ IA Insight: +34% Conversion'
      )

      // Bezier Wire 2 -> 3
      drawBezierConnector(ctx, W / 2, 750, W / 2, 840, '#10b981')

      // Node 3: Condition Node (Branching Split)
      drawAppFlowNode(
        ctx,
        'condition',
        '🔀',
        'Condition',
        'Tag == #CLIENT_VIP ?',
        'Vérifie si le client a déjà commandé',
        80, 840, 1040, 200,
        '#3b82f6',
        true, false,
        undefined,
        true // Is condition node (draws Oui/Non split handles)
      )

      // Split Bezier Wires (Left: Oui / Right: Non)
      drawBezierConnector(ctx, 320, 1040, 320, 1140, '#10b981') // Green for Oui
      drawBezierConnector(ctx, 880, 1040, 880, 1140, '#ef4444') // Red for Non

      // Node 4A (Left): Send Message + Code Promo (Branch Oui)
      drawAppFlowNode(
        ctx,
        'send_message',
        '💬',
        'Message VIP (-20%)',
        'Code VIP20 + Cadeau offert 🎁',
        'Envoi instantané via DM',
        80, 1140, 480, 190,
        '#ec4899',
        true, true
      )

      // Node 4B (Right): Set Tag #NOUVEAU_PROSPECT (Branch Non)
      drawAppFlowNode(
        ctx,
        'set_tag',
        '🏷️',
        'Ajouter un tag',
        'Tag: #NOUVEAU_PROSPECT',
        'Enregistre le prospect dans le CRM',
        640, 1140, 480, 190,
        '#8b5cf6',
        true, true
      )
    }
    // =========================================================================
    // FEATURE 2: REAL APP CONTACTS / CRM TABLE SCREEN (ContactTable.tsx)
    // =========================================================================
    else if (idx === 2) {
      // Header
      ctx.fillStyle = '#141417'
      ctx.fillRect(0, 130, W, 120)
      ctx.strokeStyle = '#27272a'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, 250)
      ctx.lineTo(W, 250)
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 42px system-ui, -apple-system, sans-serif'
      ctx.fillText('👥 Contacts CRM & Audiences', 60, 205)

      ctx.fillStyle = themeColor
      ctx.font = 'bold 28px system-ui'
      ctx.fillText('+ Nouveau Contact', W - 320, 205)

      // Search & Tag Filter Bar
      ctx.fillStyle = '#1c1c22'
      ctx.beginPath()
      ctx.roundRect(60, 280, W - 120, 80, 20)
      ctx.fill()
      ctx.strokeStyle = '#27272a'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#a1a1aa'
      ctx.font = '30px system-ui'
      ctx.fillText('🔍  Rechercher un contact, tag, téléphone...', 90, 332)

      // Table Header Row
      ctx.fillStyle = '#18181c'
      ctx.fillRect(60, 390, W - 120, 70)
      ctx.fillStyle = '#a1a1aa'
      ctx.font = 'bold 24px system-ui, sans-serif'
      ctx.fillText('CLIENT', 90, 435)
      ctx.fillText('TAGS', 480, 435)
      ctx.fillText('DERNIER MESSAGE', W - 320, 435)

      // Contact Row 1 (Maya Lin)
      drawContactTableRow(ctx, 'M', 'Maya Lin', '@maya_lin', ['#VIP', '#CLIENT_BIO'], 'Il y a 3m', '#f59e0b', 60, 470, W - 120, 180)

      // Contact Row 2 (Sarah K.)
      drawContactTableRow(ctx, 'S', 'Sarah Khelifi', '+213 555 12 34 56', ['#RELANCE_PANIER'], 'Il y a 14m', '#3b82f6', 60, 660, W - 120, 180)

      // Contact Row 3 (Amine B.)
      drawContactTableRow(ctx, 'A', 'Amine Belkacem', '@amine_b', ['#PROSPECT', '#BOTANIK15'], 'Il y a 42m', '#10b981', 60, 850, W - 120, 180)

      // Contact Row 4 (Léa Dubois)
      drawContactTableRow(ctx, 'L', 'Léa Dubois', '@lea_dubois', ['#CLIENTE_HABITUÉE'], 'Hier 18:30', '#8b5cf6', 60, 1040, W - 120, 180)
    }
    // =========================================================================
    // FEATURE 3: REAL APP BOUTIQUE & CART RECOVERY (ProductTable.tsx)
    // =========================================================================
    else if (idx === 3) {
      // Header
      ctx.fillStyle = '#141417'
      ctx.fillRect(0, 130, W, 120)
      ctx.strokeStyle = '#27272a'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, 250)
      ctx.lineTo(W, 250)
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 42px system-ui, -apple-system, sans-serif'
      ctx.fillText('🛍️ Boutique & Relance Paniers', 60, 205)

      // Filter Tabs
      drawTab(ctx, 'Tous (28)', 60, 280, 220, false, themeColor)
      drawTab(ctx, '🛒 Paniers Abandonnés (3)', 300, 280, 480, true, '#f59e0b')
      drawTab(ctx, 'En stock (25)', 800, 280, 240, false, themeColor)

      // Abandoned Cart Product 1
      drawBoutiqueCartCard(
        ctx,
        '🧴',
        'Sérum Aloe Vera Bio 50ml',
        'Client: Maya Lin (@maya_lin)',
        '3 500 DA',
        '⚠️ Panier expiré (14m)',
        'Envoyer DM -10% 📩',
        60, 390, W - 120, 250,
        '#f59e0b'
      )

      // Abandoned Cart Product 2
      drawBoutiqueCartCard(
        ctx,
        '🌿',
        'Baume Cica-Botanique 30ml',
        'Client: Sarah K. (+213 555...)',
        '2 800 DA',
        '⚡ Relance IA en cours',
        'Relance Auto Active ⚡',
        60, 660, W - 120, 250,
        '#3b82f6'
      )

      // Abandoned Cart Product 3 (Recovered)
      drawBoutiqueCartCard(
        ctx,
        '🎁',
        'Pack Éclat Botanique Bio',
        'Client: Amine B. (@amine_b)',
        '8 400 DA',
        '✅ Panier Récupéré (+8 400 DA)',
        'Commande Payée 🎉',
        60, 930, W - 120, 250,
        '#10b981'
      )
    }
    // =========================================================================
    // FEATURE 4: REAL APP CAMPAIGN BROADCAST SCREEN (CampaignCard.tsx)
    // =========================================================================
    else if (idx === 4) {
      // Header
      ctx.fillStyle = '#141417'
      ctx.fillRect(0, 130, W, 120)
      ctx.strokeStyle = '#27272a'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, 250)
      ctx.lineTo(W, 250)
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 42px system-ui, -apple-system, sans-serif'
      ctx.fillText('📢 Campagnes & Diffusion DM', 60, 205)

      ctx.fillStyle = themeColor
      ctx.font = 'bold 28px system-ui'
      ctx.fillText('+ Nouvelle Campagne', W - 350, 205)

      // Campaign Card 1 (Active Sending)
      drawCampaignCardApp(
        ctx,
        'Relance Ventes Flash Instagram 🚀',
        'Audience: Prospects Instagram (1,492 contacts)',
        '1,250 / 1,492 messages envoyés',
        '● EN COURS (84%)',
        '+42 800 DA générés',
        60, 280, W - 120, 270,
        themeColor,
        0.84
      )

      // Campaign Card 2 (Completed)
      drawCampaignCardApp(
        ctx,
        'Code Promo BOTANIK15 DM 🎁',
        'Audience: Paniers Abandonnés (380 contacts)',
        '380 / 380 messages envoyés',
        '✅ TERMINÉE (100%)',
        'Taux de conversion 38,4%',
        60, 570, W - 120, 270,
        '#10b981',
        1.0
      )

      // Campaign Card 3 (Scheduled)
      drawCampaignCardApp(
        ctx,
        'Lancement Nouveautés Botaniques 2026 🌿',
        'Audience: Tous les Clients VIP (620 contacts)',
        'Programmé pour aujourd\'hui à 18h00',
        '⏳ PROGRAMMÉE',
        'File d\'attente prête',
        60, 860, W - 120, 270,
        '#3b82f6',
        0.0
      )
    }
    // =========================================================================
    // FEATURE 5: REAL APP ANALYTICS DASHBOARD SCREEN (AnalyticsPage.tsx)
    // =========================================================================
    else {
      // Header
      ctx.fillStyle = '#141417'
      ctx.fillRect(0, 130, W, 120)
      ctx.strokeStyle = '#27272a'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, 250)
      ctx.lineTo(W, 250)
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 42px system-ui, -apple-system, sans-serif'
      ctx.fillText('📊 Statistiques & Analytics', 60, 205)

      ctx.fillStyle = '#a1a1aa'
      ctx.font = 'bold 26px system-ui'
      ctx.fillText('✨ Synthèse 14 jours', W - 320, 205)

      // Stat Badges Grid (4 App Stat Badges)
      drawAppStatBadge(ctx, 'Messages reçus', '14 920', '💬', 60, 280, 520, 150, themeColor)
      drawAppStatBadge(ctx, 'Réponses auto', '12 450', '⚡', 610, 280, 520, 150, '#f59e0b')
      drawAppStatBadge(ctx, 'Taux de réponse', '99,4%', '📈', 60, 450, 520, 150, '#22c55e')
      drawAppStatBadge(ctx, 'Nouveaux contacts', '1 480', '👥', 610, 450, 520, 150, '#8b5cf6')

      // E-Commerce Funnel Stat Grid (With Real App DA Currency)
      drawAppStatBadge(ctx, 'Sessions lancées', '3 840', '🛒', 60, 620, 520, 150, '#0ea5e9')
      drawAppStatBadge(ctx, 'Commandes confirmées', '1 290', '📦', 610, 620, 520, 150, '#22c55e')
      drawAppStatBadge(ctx, 'Chiffre d\'affaires', '428 500 DA', '💰', 60, 790, 520, 150, '#f59e0b')
      drawAppStatBadge(ctx, 'Panier moyen', '4 500 DA', '🧾', 610, 790, 520, 150, '#8b5cf6')

      // Handling Split Card (IA vs Humain Breakdown from AnalyticsPage.tsx)
      const splitY = 960
      ctx.fillStyle = '#141418'
      ctx.beginPath()
      ctx.roundRect(60, splitY, W - 120, 280, 32)
      ctx.fill()
      ctx.strokeStyle = '#27272a'
      ctx.lineWidth = 3
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 34px system-ui, sans-serif'
      ctx.fillText('Répartition du traitement des messages', 100, splitY + 55)

      // Progress Bar Track
      ctx.fillStyle = '#1c1c22'
      ctx.beginPath()
      ctx.roundRect(100, splitY + 80, W - 200, 36, 18)
      ctx.fill()

      // Fill AI (84% - Green/Primary)
      ctx.fillStyle = themeColor
      ctx.beginPath()
      ctx.roundRect(100, splitY + 80, (W - 200) * 0.84, 36, 18)
      ctx.fill()

      // Fill Human (14% - Purple)
      ctx.fillStyle = '#8b5cf6'
      ctx.beginPath()
      ctx.roundRect(100 + (W - 200) * 0.84, splitY + 80, (W - 200) * 0.14, 36, 18)
      ctx.fill()

      // Legend Pills
      ctx.fillStyle = themeColor
      ctx.beginPath()
      ctx.arc(110, splitY + 175, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 28px system-ui, sans-serif'
      ctx.fillText('Réduits par IA (84%)', 135, splitY + 183)

      ctx.fillStyle = '#8b5cf6'
      ctx.beginPath()
      ctx.arc(520, splitY + 175, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.fillText('Traités par Humain (14%)', 545, splitY + 183)

      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(920, splitY + 175, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.fillText('Sans réponse (2%)', 945, splitY + 183)
    }

  }

  // Setup Three.js Scene and 3D Phone Display Screen Plane
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth || 380
    const height = container.clientHeight || 460

    // 1. Create Offscreen 2D Canvas for High-Res Screen Texture (Ultra-Retina 4K HD)
    const cvs = document.createElement('canvas')
    cvs.width = 1200
    cvs.height = 2200
    screen2dCanvasRef.current = cvs

    const canvasTexture = new THREE.CanvasTexture(cvs)
    canvasTexture.colorSpace = THREE.SRGBColorSpace
    canvasTexture.minFilter = THREE.LinearFilter
    canvasTexture.magFilter = THREE.LinearFilter
    canvasTextureRef.current = canvasTexture

    // Initial draw
    updateScreenTexture(activeIdx, accentColor)

    // 2. Three.js Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // 3. Camera — pulled back to z=7.8 for a proportionate hero phone
    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 1000)
    camera.position.set(0.3, 0.1, 7.8)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // 4. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.4
    rendererRef.current = renderer

    container.appendChild(renderer.domElement)

    // 5. Minimalist Apple-Grade Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3)
    scene.add(ambientLight)

    // Soft Diffused Key Studio Light
    const keyLight = new THREE.SpotLight(0xffffff, 4.2)
    keyLight.position.set(4, 12, 8)
    keyLight.angle = Math.PI / 4
    keyLight.penumbra = 0.95 // Buttery smooth soft shadow falloff
    keyLight.castShadow = true
    scene.add(keyLight)

    // Subtle Metallic Rim Light
    const rimLight = new THREE.DirectionalLight(0xffffff, 2.2)
    rimLight.position.set(-6, 6, -4)
    scene.add(rimLight)

    // Upward Light Emanating FROM the Pedestal Base (Illuminates Phone from Below like a Video Game Stage)
    const pedestalUpLight = new THREE.SpotLight(accentColor, 7.5, 14, Math.PI / 3.2, 0.7)
    pedestalUpLight.position.set(0, -2.3, 0.2)
    pedestalUpLight.target.position.set(0, 0.2, 0)
    scene.add(pedestalUpLight)
    scene.add(pedestalUpLight.target)

    // Soft Base Ambient Glow on Pedestal Surface
    const baseGlowLight = new THREE.PointLight(accentColor, 4.5, 12)
    baseGlowLight.position.set(0, -2.2, 0.5)
    scene.add(baseGlowLight)

    // 6. Sleek Compact Video Game Character Spawn Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(1.6, 1.85, 0.15, 64)
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x111114,
      metalness: 0.9,
      roughness: 0.2,
    })
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat)
    pedestal.position.set(0, -2.6, 0)
    pedestal.receiveShadow = true
    scene.add(pedestal)

    // Embedded Inner Glowing Light Ring
    const pedestalRingGeo1 = new THREE.TorusGeometry(1.62, 0.03, 16, 64)
    const pedestalRingMat1 = new THREE.MeshBasicMaterial({ color: new THREE.Color(accentColor) })
    const pedestalRing1 = new THREE.Mesh(pedestalRingGeo1, pedestalRingMat1)
    pedestalRing1.rotation.x = Math.PI / 2
    pedestalRing1.position.set(0, -2.52, 0)
    scene.add(pedestalRing1)
    ringRef.current = pedestalRing1

    // 7. High-Precision 3D Volumetric iPhone Chassis Construction (Guarantees Real 3D Depth, Metallic Edges & Camera Bump)
    const createProcedural3DPhone = () => {
      const phoneGroup = new THREE.Group()

      // 3D Phone Body Dimensions (Slim iPhone Proportions)
      const width = 2.4
      const height = 4.8
      const borderRadius = 0.38
      const depth = 0.14

      // Rounded Rectangle Shape for Extrusion
      const shape = new THREE.Shape()
      const w = width / 2
      const h = height / 2
      const r = borderRadius

      shape.moveTo(-w + r, -h)
      shape.lineTo(w - r, -h)
      shape.quadraticCurveTo(w, -h, w, -h + r)
      shape.lineTo(w, h - r)
      shape.quadraticCurveTo(w, h, w - r, h)
      shape.lineTo(-w + r, h)
      shape.quadraticCurveTo(-w, h, -w, h - r)
      shape.lineTo(-w, -h + r)
      shape.quadraticCurveTo(-w, -h, -w + r, -h)

      const extrudeSettings = {
        depth: depth,
        bevelEnabled: true,
        bevelSegments: 8,
        steps: 2,
        bevelSize: 0.04,
        bevelThickness: 0.04,
      }

      // Titanium Metallic Body Material
      const bodyGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
      bodyGeo.center()

      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1c1c1e,
        metalness: 0.95,
        roughness: 0.18,
      })
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat)
      bodyMesh.castShadow = true
      bodyMesh.receiveShadow = true
      phoneGroup.add(bodyMesh)

      // Metallic Side Frame Accent Ring
      const frameGeo = new THREE.ExtrudeGeometry(shape, {
        depth: depth + 0.02,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: 0.02,
        bevelThickness: 0.02,
      })
      frameGeo.center()
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a3c,
        metalness: 0.98,
        roughness: 0.1,
      })
      const frameMesh = new THREE.Mesh(frameGeo, frameMat)
      phoneGroup.add(frameMesh)

      // Side Buttons (Volume & Power) — positioned relative to slimmer width
      const buttonMat = new THREE.MeshStandardMaterial({ color: 0x48484a, metalness: 0.9, roughness: 0.2 })

      const powerBtn = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.5, 0.12), buttonMat)
      powerBtn.position.set(w + 0.035, 0.38, 0)
      phoneGroup.add(powerBtn)

      const volBtn1 = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.38, 0.12), buttonMat)
      volBtn1.position.set(-w - 0.035, 0.55, 0)
      phoneGroup.add(volBtn1)

      const volBtn2 = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.38, 0.12), buttonMat)
      volBtn2.position.set(-w - 0.035, 0.0, 0)
      phoneGroup.add(volBtn2)

      // Back Camera Bump Module & Lenses
      const bumpMat = new THREE.MeshStandardMaterial({ color: 0x2c2c2e, metalness: 0.9, roughness: 0.2 })
      const cameraBump = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.95, 0.08), bumpMat)
      cameraBump.position.set(-0.44, 1.42, -depth / 2 - 0.04)
      phoneGroup.add(cameraBump)

      const lensMat = new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.9, roughness: 0.05 })
      const lensGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.06, 24)
      lensGeo.rotateX(Math.PI / 2)

      const lens1 = new THREE.Mesh(lensGeo, lensMat)
      lens1.position.set(-0.44, 1.64, -depth / 2 - 0.07)
      phoneGroup.add(lens1)

      const lens2 = new THREE.Mesh(lensGeo, lensMat)
      lens2.position.set(-0.44, 1.18, -depth / 2 - 0.07)
      phoneGroup.add(lens2)

      // Front Display Glass — Rounded corners like a real iPhone display
      const scrW = 2.18
      const scrH = 4.6
      const scrR = 0.26 // corner radius matching chassis
      const screenShape = new THREE.Shape()
      screenShape.moveTo(-scrW / 2 + scrR, -scrH / 2)
      screenShape.lineTo(scrW / 2 - scrR, -scrH / 2)
      screenShape.quadraticCurveTo(scrW / 2, -scrH / 2, scrW / 2, -scrH / 2 + scrR)
      screenShape.lineTo(scrW / 2, scrH / 2 - scrR)
      screenShape.quadraticCurveTo(scrW / 2, scrH / 2, scrW / 2 - scrR, scrH / 2)
      screenShape.lineTo(-scrW / 2 + scrR, scrH / 2)
      screenShape.quadraticCurveTo(-scrW / 2, scrH / 2, -scrW / 2, scrH / 2 - scrR)
      screenShape.lineTo(-scrW / 2, -scrH / 2 + scrR)
      screenShape.quadraticCurveTo(-scrW / 2, -scrH / 2, -scrW / 2 + scrR, -scrH / 2)

      const screenGeo = new THREE.ShapeGeometry(screenShape, 32)

      // Fix UV coords: ShapeGeometry generates raw-position UVs — normalize to 0-1 via bounding box
      screenGeo.computeBoundingBox()
      const bbox = screenGeo.boundingBox!
      const bboxW = bbox.max.x - bbox.min.x
      const bboxH = bbox.max.y - bbox.min.y
      const uvAttr = screenGeo.attributes.uv
      for (let i = 0; i < uvAttr.count; i++) {
        uvAttr.setXY(
          i,
          (uvAttr.getX(i) - bbox.min.x) / bboxW,
          (uvAttr.getY(i) - bbox.min.y) / bboxH
        )
      }
      uvAttr.needsUpdate = true

      const screenMat = new THREE.MeshBasicMaterial({
        map: canvasTexture,
        toneMapped: false,
      })
      const screenMesh = new THREE.Mesh(screenGeo, screenMat)
      screenMesh.position.set(0, 0, depth / 2 + 0.046)
      phoneGroup.add(screenMesh)
      screenMeshRef.current = screenMesh

      return phoneGroup
    }

    // 8. Initialize Volumetric 3D Phone (Permanently Stable & Beautiful 3D Chassis)
    const proceduralPhone = createProcedural3DPhone()
    proceduralPhone.position.y = 0.2
    scene.add(proceduralPhone)
    phoneGroupRef.current = proceduralPhone

    // Real-Time 3D Mouse Parallax Tracking
    const mousePos = { currentX: 0, currentY: 0, targetX: 0, targetY: 0 }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      mousePos.targetX = Math.max(-1, Math.min(1, x))
      mousePos.targetY = Math.max(-1, Math.min(1, y))
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Animation Loop with Real-Time 3D Mouse Parallax Tilt
    let animationFrameId: number
    let clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()

      // Smooth mouse lerp interpolation
      mousePos.currentX += (mousePos.targetX - mousePos.currentX) * 0.06
      mousePos.currentY += (mousePos.targetY - mousePos.currentY) * 0.06

      if (phoneGroupRef.current) {
        // Floating motion + Interactive 3D Mouse Parallax Tilt
        phoneGroupRef.current.position.y = 0.2 + Math.sin(elapsedTime * 1.8) * 0.12

        const targetRotY = Math.sin(elapsedTime * 0.7) * 0.45 + mousePos.currentX * 0.45
        const targetRotX = 0.12 + Math.sin(elapsedTime * 1.2) * 0.05 - mousePos.currentY * 0.3

        phoneGroupRef.current.rotation.y += (targetRotY - phoneGroupRef.current.rotation.y) * 0.08
        phoneGroupRef.current.rotation.x += (targetRotX - phoneGroupRef.current.rotation.x) * 0.08
      }

      if (ringRef.current) {
        ringRef.current.rotation.z = -elapsedTime * 0.5
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }
    animate()

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      if (rendererRef.current?.domElement) {
        container.removeChild(rendererRef.current.domElement)
      }
      rendererRef.current?.dispose()
    }
  }, [])

  // Update Screen Content whenever activeIdx or accentColor changes
  useEffect(() => {
    updateScreenTexture(activeIdx, accentColor)
  }, [activeIdx, accentColor])

  return (
    <div ref={containerRef} className="w-full h-[600px] sm:h-[750px] flex items-center justify-center relative select-none overflow-hidden">
      {/* Outer diffused ambient halo — large, blurred, very soft */}
      <div
        className="absolute pointer-events-none transition-all duration-700"
        style={{
          inset: '-20%',
          background: `radial-gradient(ellipse 55% 45% at 50% 58%, ${accentColor} 0%, transparent 70%)`,
          opacity: 0.18,
          filter: 'blur(40px)',
        }}
      />
      {/* Inner tighter bloom — concentrated glow around phone center */}
      <div
        className="absolute pointer-events-none transition-all duration-700"
        style={{
          inset: '10%',
          background: `radial-gradient(ellipse 50% 35% at 50% 60%, ${accentColor} 0%, transparent 65%)`,
          opacity: 0.12,
          filter: 'blur(20px)',
        }}
      />
    </div>
  )
}
