import { useState } from 'react'
import { Card } from './Card'
import { DAILY_CARDS, type CardData } from '../data/cards'

export interface PickResult {
  card: CardData
  option: 'A' | 'B'
  label: string
}

interface CardStackProps {
  onComplete: (picks: PickResult[]) => void
}

export function CardStack({ onComplete }: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissingId, setDismissingId] = useState<string | null>(null)
  const [picks, setPicks] = useState<PickResult[]>([])

  const visibleCards = DAILY_CARDS.slice(currentIndex, currentIndex + 3)

  function handlePick(cardId: string, option: 'A' | 'B') {
    const card = DAILY_CARDS.find((c) => c.id === cardId)!
    const label = option === 'A' ? card.optionA : card.optionB
    const newPicks = [...picks, { card, option, label }]

    setDismissingId(cardId)
    setTimeout(() => {
      setDismissingId(null)
      setPicks(newPicks)
      if (currentIndex + 1 >= DAILY_CARDS.length) {
        onComplete(newPicks)
      } else {
        setCurrentIndex((i) => i + 1)
      }
    }, 380)
  }

  return (
    <div className="card-stack">
      {visibleCards.map((card, i) => (
        <Card
          key={card.id}
          card={card}
          stackIndex={i}
          isDismissing={dismissingId === card.id}
          onPick={handlePick}
        />
      ))}
    </div>
  )
}
