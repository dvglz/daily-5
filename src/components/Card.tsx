import { useState } from 'react'
import type { CardData } from '../data/cards'
import { DauberMark } from './DauberMark'
import { useHaptics } from '../hooks/useHaptics'

interface CardProps {
  card: CardData
  stackIndex: number
  isDismissing: boolean
  onPick: (cardId: string, option: 'A' | 'B') => void
}

function OptionLabel({ label, picked, faded, onPick }: {
  label: string; picked: boolean; faded: boolean; onPick: () => void
}) {
  return (
    <button
      className={['option-label', picked && 'option-label--picked', faded && 'option-label--faded'].filter(Boolean).join(' ')}
      onClick={onPick}
      disabled={picked || faded}
    >
      <span className="option-label__text">{label}</span>
      <DauberMark active={picked} />
    </button>
  )
}

export function Card({ card, stackIndex, isDismissing, onPick }: CardProps) {
  const [picked, setPicked] = useState<'A' | 'B' | null>(null)
  const haptics = useHaptics()
  const isActive = stackIndex === 0
  const marketTag = card.marketType === 'player-prop' ? 'player prop' : card.marketType

  function handlePick(option: 'A' | 'B') {
    if (picked || !isActive) return
    setPicked(option)
    haptics.pick()
    setTimeout(() => onPick(card.id, option), 600)
  }

  return (
    <div
      className={['card-row', isActive ? 'card-row--active' : 'card-row--stacked', isDismissing && 'card-row--dismiss'].filter(Boolean).join(' ')}
      style={{ '--stack-index': stackIndex, zIndex: 10 - stackIndex } as React.CSSProperties}
    >
      <div className="card-row__avatar" style={{ background: card.avatarColor }}>
        {card.avatarImage ? (
          <img className="card-row__avatar-image" src={card.avatarImage} alt="" aria-hidden="true" />
        ) : (
          card.avatarInitial
        )}
      </div>
      <div className="card-row__body">
        <span className="card-row__market">{marketTag}</span>
        <p className="card-row__headline">{card.headline}</p>
        <div className="card-row__options">
          <OptionLabel label={card.optionA} picked={picked === 'A'} faded={picked === 'B'} onPick={() => handlePick('A')} />
          <OptionLabel label={card.optionB} picked={picked === 'B'} faded={picked === 'A'} onPick={() => handlePick('B')} />
        </div>
      </div>
      <span className="card-row__number">{card.number}</span>
    </div>
  )
}
