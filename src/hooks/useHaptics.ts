import { useWebHaptics } from 'web-haptics/react'

export function useHaptics() {
  const { trigger, isSupported } = useWebHaptics({ showSwitch: false })

  return {
    isSupported,
    pick: () => void trigger('selection'),
    drop: () => void trigger('medium'),
    remove: () => void trigger('light'),
    trace: () => void trigger('selection'),
  }
}
