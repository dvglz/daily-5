import { useState } from 'react'
import { CardStack, type PickResult } from './components/CardStack'
import { ParlayScreen } from './components/ParlayScreen'

type Phase = 'picking' | 'parlay' | 'locked'

export function App() {
  const [phase, setPhase] = useState<Phase>('picking')
  const [picks, setPicks] = useState<PickResult[]>([])

  function handleComplete(results: PickResult[]) {
    setPicks(results)
    setPhase('parlay')
  }

  function handleLock(_parlay: PickResult[]) {
    setPhase('locked')
  }

  return (
    <div className={['app', phase === 'parlay' && 'app--parlay'].filter(Boolean).join(' ')}>
      <header className={['app__header', phase === 'parlay' && 'app__header--compact'].filter(Boolean).join(' ')}>
        <span className="app__title">DAILY 5</span>
        <span className="app__sub">
          {phase === 'picking' && "Tonight's Card"}
          {phase === 'parlay' && 'Mark 3 For Parlay'}
          {phase === 'locked' && "You're Locked In"}
        </span>
      </header>

      <main className="app__main">
        {phase === 'picking' && <CardStack onComplete={handleComplete} />}
        {phase === 'parlay' && <ParlayScreen picks={picks} onLock={handleLock} />}
        {phase === 'locked' && (
          <div className="locked-state">
            <p className="locked-state__label">Locked.</p>
            <p className="locked-state__sub">Check back when games start.</p>
          </div>
        )}
      </main>
    </div>
  )
}
