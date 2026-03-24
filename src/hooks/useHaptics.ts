import { useEffect, useEffectEvent, useRef } from 'react'
import { WebHaptics, type HapticInput } from 'web-haptics'

const FALLBACK_PATTERNS = {
  selection: 8,
  medium: 25,
  light: 15,
} as const

export function useHaptics() {
  const hapticsRef = useRef<WebHaptics | null>(null)

  useEffect(() => {
    hapticsRef.current = new WebHaptics({ showSwitch: false })

    return () => {
      hapticsRef.current?.destroy()
      hapticsRef.current = null
    }
  }, [])

  const trigger = useEffectEvent((preset: keyof typeof FALLBACK_PATTERNS, input: HapticInput) => {
    if (hapticsRef.current) {
      void hapticsRef.current.trigger(input)
      return
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(FALLBACK_PATTERNS[preset])
    }
  })

  return {
    pick: () => trigger('selection', 'selection'),
    drop: () => trigger('medium', 'medium'),
    remove: () => trigger('light', 'light'),
    trace: () => trigger('selection', 'selection'),
  }
}
