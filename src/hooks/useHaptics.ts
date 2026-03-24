import { useEffect, useEffectEvent, useRef } from 'react'
import { WebHaptics, type HapticInput } from 'web-haptics'

const FALLBACK_PATTERNS = {
  selection: 8,
  medium: 25,
  light: 15,
} as const

type HapticPresetName = keyof typeof FALLBACK_PATTERNS

type TelegramHapticFeedback = {
  impactOccurred?: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
  notificationOccurred?: (type: 'error' | 'success' | 'warning') => void
  selectionChanged?: () => void
}

type GlobalWithTelegram = typeof globalThis & {
  Telegram?: {
    WebApp?: {
      HapticFeedback?: TelegramHapticFeedback
    }
  }
}

function triggerTelegramHaptics(preset: HapticPresetName) {
  const feedback = (globalThis as GlobalWithTelegram).Telegram?.WebApp?.HapticFeedback
  if (!feedback) return false

  if (preset === 'selection') {
    feedback.selectionChanged?.()
    return true
  }

  if (preset === 'medium') {
    feedback.impactOccurred?.('medium')
    return true
  }

  feedback.impactOccurred?.('light')
  return true
}

function triggerVibrate(preset: HapticPresetName) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return false
  }

  return navigator.vibrate(FALLBACK_PATTERNS[preset])
}

export function useHaptics() {
  const hapticsRef = useRef<WebHaptics | null>(null)

  useEffect(() => {
    hapticsRef.current = new WebHaptics({ showSwitch: false })

    return () => {
      hapticsRef.current?.destroy()
      hapticsRef.current = null
    }
  }, [])

  const trigger = useEffectEvent((preset: HapticPresetName, input: HapticInput) => {
    if (triggerTelegramHaptics(preset)) {
      return
    }

    if (WebHaptics.isSupported && hapticsRef.current) {
      void hapticsRef.current.trigger(input)
      return
    }

    triggerVibrate(preset)
  })

  return {
    pick: () => trigger('selection', 'selection'),
    drop: () => trigger('medium', 'medium'),
    remove: () => trigger('light', 'light'),
    trace: () => trigger('selection', 'selection'),
  }
}
