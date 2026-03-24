import { useRef, useState } from 'react'
import type { PickResult } from './CardStack'
import { DauberMark } from './DauberMark'
import { useHaptics } from '../hooks/useHaptics'

interface ParlayScreenProps {
  picks: PickResult[]
  onLock: (parlay: PickResult[]) => void
}

interface Point {
  x: number
  y: number
}

interface RectBounds {
  left: number
  top: number
  width: number
  height: number
}

interface ScribbleMark {
  cardId: string
  path: Point[] | null
}

interface ActiveDraw {
  pointerId: number
  sourceCardId: string
  points: Point[]
  touchedCardIds: string[]
}

const MIN_SCRIBBLE_DIST = 30
const CARD_HIT_PADDING = 18
const CARD_PATH_PADDING = 12
const DRAW_HAPTIC_INTERVAL_MS = 110

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function pointsToPath(pts: Point[]): string {
  if (pts.length < 2) return ''
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
}

function getPathDistance(pts: Point[]) {
  return pts.reduce((acc, pt, i) => {
    if (i === 0) return 0
    const prev = pts[i - 1]
    return acc + Math.hypot(pt.x - prev.x, pt.y - prev.y)
  }, 0)
}

function pointHitsBounds(point: Point, bounds: RectBounds, padding = CARD_HIT_PADDING) {
  return (
    point.x >= bounds.left - padding &&
    point.x <= bounds.left + bounds.width + padding &&
    point.y >= bounds.top - padding &&
    point.y <= bounds.top + bounds.height + padding
  )
}

function localizePath(points: Point[], bounds: RectBounds) {
  const maxX = Math.max(CARD_PATH_PADDING, bounds.width - CARD_PATH_PADDING)
  const maxY = Math.max(CARD_PATH_PADDING, bounds.height - CARD_PATH_PADDING)

  return points
    .filter((point) => pointHitsBounds(point, bounds))
    .map((point) => ({
      x: clamp(point.x - bounds.left, CARD_PATH_PADDING, maxX),
      y: clamp(point.y - bounds.top, CARD_PATH_PADDING, maxY),
    }))
}

function PickedOptions({ pick }: { pick: PickResult }) {
  return (
    <div className="v-card__options">
      {(['A', 'B'] as const).map((side) => {
        const label = side === 'A' ? pick.card.optionA : pick.card.optionB
        const active = pick.option === side
        return (
          <span key={side} className={['v-option', active ? 'v-option--picked' : 'v-option--faded'].join(' ')}>
            <span className="v-option__text">{label}</span>
            <DauberMark active={active} />
          </span>
        )
      })}
    </div>
  )
}

function ScribbleOverlay({ path }: { path: Point[] | null }) {
  const d = path ? pointsToPath(path) : ''
  if (!d) return null

  return (
    <svg className="scribble-overlay" aria-hidden="true">
      <defs>
        <filter id="scribble-ink" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <path
        d={d}
        fill="none"
        stroke="#0d5970"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.22"
        filter="url(#scribble-ink)"
      />
      <path
        d={d}
        fill="none"
        stroke="#56D6FF"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.52"
        filter="url(#scribble-ink)"
      />
    </svg>
  )
}

export function ParlayScreen({ picks, onLock }: ParlayScreenProps) {
  const [marks, setMarks] = useState<ScribbleMark[]>([])
  const [drawingState, setDrawingState] = useState<{
    touchedCardIds: string[]
    cardPaths: Record<string, Point[]>
  } | null>(null)

  const activeDrawRef = useRef<ActiveDraw | null>(null)
  const lastDrawHapticAtRef = useRef(0)
  const stackRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const haptics = useHaptics()

  const markedCount = marks.length
  const markedIds = new Set(marks.map((mark) => mark.cardId))

  function setCardRef(cardId: string, node: HTMLDivElement | null) {
    cardRefs.current[cardId] = node
  }

  function getStackPoint(clientX: number, clientY: number): Point | null {
    const stack = stackRef.current
    if (!stack) return null
    const rect = stack.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  function getCardBounds() {
    const stack = stackRef.current
    if (!stack) return {} as Record<string, RectBounds>
    const stackRect = stack.getBoundingClientRect()

    return picks.reduce<Record<string, RectBounds>>((acc, pick) => {
      const node = cardRefs.current[pick.card.id]
      if (!node) return acc
      const rect = node.getBoundingClientRect()
      acc[pick.card.id] = {
        left: rect.left - stackRect.left,
        top: rect.top - stackRect.top,
        width: rect.width,
        height: rect.height,
      }
      return acc
    }, {})
  }

  function buildCardPaths(points: Point[], touchedCardIds: string[]) {
    const boundsByCard = getCardBounds()

    return touchedCardIds.reduce<Record<string, Point[]>>((acc, cardId) => {
      const bounds = boundsByCard[cardId]
      if (!bounds) return acc

      const path = localizePath(points, bounds)
      if (path.length >= 2) {
        acc[cardId] = path
      }
      return acc
    }, {})
  }

  function addTouchedCard(active: ActiveDraw, cardId: string) {
    if (active.touchedCardIds.includes(cardId)) return
    if (markedIds.has(cardId)) {
      active.touchedCardIds = [...active.touchedCardIds, cardId]
      haptics.trace()
      return
    }

    const remainingSlots = Math.max(0, 3 - marks.length)
    const newCardsInStroke = active.touchedCardIds.filter((id) => !markedIds.has(id)).length
    if (newCardsInStroke >= remainingSlots) return

    active.touchedCardIds = [...active.touchedCardIds, cardId]
    haptics.trace()
  }

  function syncDrawingState(active: ActiveDraw) {
    setDrawingState({
      touchedCardIds: active.touchedCardIds,
      cardPaths: buildCardPaths(active.points, active.touchedCardIds),
    })
  }

  function handlePointerDown(e: React.PointerEvent, pick: PickResult) {
    const point = getStackPoint(e.clientX, e.clientY)
    if (!point) return

    const cardEl = e.currentTarget as HTMLDivElement
    activeDrawRef.current = {
      pointerId: e.pointerId,
      sourceCardId: pick.card.id,
      points: [point],
      touchedCardIds: [pick.card.id],
    }
    lastDrawHapticAtRef.current = Date.now()

    syncDrawingState(activeDrawRef.current)
    try {
      cardEl.setPointerCapture(e.pointerId)
    } catch {
      // Ignore unsupported pointer capture environments.
    }
    e.preventDefault()
    e.stopPropagation()
  }

  function handlePointerMove(e: React.PointerEvent) {
    const active = activeDrawRef.current
    if (!active || active.pointerId !== e.pointerId) return

    const point = getStackPoint(e.clientX, e.clientY)
    if (!point) return
    active.points.push(point)

    const now = Date.now()
    if (now - lastDrawHapticAtRef.current >= DRAW_HAPTIC_INTERVAL_MS) {
      haptics.trace()
      lastDrawHapticAtRef.current = now
    }

    const boundsByCard = getCardBounds()
    for (const pick of picks) {
      const bounds = boundsByCard[pick.card.id]
      if (bounds && pointHitsBounds(point, bounds)) {
        addTouchedCard(active, pick.card.id)
      }
    }

    syncDrawingState(active)
    e.preventDefault()
    e.stopPropagation()
  }

  function clearActiveDraw() {
    activeDrawRef.current = null
    lastDrawHapticAtRef.current = 0
    setDrawingState(null)
  }

  function toggleCardMark(cardId: string) {
    const isMarked = markedIds.has(cardId)
    if (isMarked) {
      setMarks((prev) => prev.filter((mark) => mark.cardId !== cardId))
      haptics.remove()
      return
    }

    if (marks.length >= 3) return

    setMarks((prev) => [...prev, { cardId, path: null }])
    haptics.drop()
  }

  function handlePointerUp(e: React.PointerEvent) {
    const active = activeDrawRef.current
    if (!active || active.pointerId !== e.pointerId) return

    const cardEl = e.currentTarget as HTMLDivElement
    try {
      cardEl.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore unsupported pointer capture environments.
    }

    const totalDist = getPathDistance(active.points)
    const nextPaths = buildCardPaths(active.points, active.touchedCardIds)
    clearActiveDraw()

    if (totalDist < MIN_SCRIBBLE_DIST) {
      toggleCardMark(active.sourceCardId)
      return
    }

    let addedCards = 0
    let refreshedCards = 0

    setMarks((prev) => {
      const next = [...prev]

      for (const cardId of active.touchedCardIds) {
        const path = nextPaths[cardId]
        if (!path || path.length < 2) continue

        const existingIndex = next.findIndex((mark) => mark.cardId === cardId)
        if (existingIndex >= 0) {
          next[existingIndex] = { cardId, path }
          refreshedCards += 1
          continue
        }

        if (next.length >= 3) continue
        next.push({ cardId, path })
        addedCards += 1
      }

      return next
    })

    if (addedCards > 0) {
      haptics.drop()
    } else if (refreshedCards > 0) {
      haptics.pick()
    }

    e.preventDefault()
    e.stopPropagation()
  }

  function handlePointerCancel() {
    clearActiveDraw()
  }

  return (
    <div className="parlay-screen">
      <div className="parlay-pool-area">
        <div ref={stackRef} className="scribble-stack">
          {picks.map((pick, index) => {
            const isMarked = markedIds.has(pick.card.id)
            const isLocked = !isMarked && markedCount >= 3
            const livePath = drawingState?.cardPaths[pick.card.id] ?? null
            const savedPath = marks.find((mark) => mark.cardId === pick.card.id)?.path ?? null
            const overlayPath = livePath ?? savedPath
            const isTargeted = drawingState?.touchedCardIds.includes(pick.card.id) ?? false
            const markedOrder = marks.findIndex((mark) => mark.cardId === pick.card.id)
            const baseZIndex = index === 1 ? 2 : 1
            const zIndex = isTargeted ? 50 : isMarked ? 30 + markedOrder : baseZIndex

            return (
              <div
                key={pick.card.id}
                ref={(node) => setCardRef(pick.card.id, node)}
                style={{ zIndex }}
                className={[
                  'v-card',
                  'v-card--scribble',
                  isMarked && 'v-card--marked',
                  isLocked && 'v-card--locked',
                  isTargeted && 'v-card--targeted',
                ].filter(Boolean).join(' ')}
                onPointerDown={(e) => handlePointerDown(e, pick)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
              >
                <span className="v-card__number">{pick.card.number}</span>
                {isMarked && (
                  <span className="v-card__sticker">
                    Parlay
                  </span>
                )}
                <div className="v-card__avatar" style={{ background: pick.card.avatarColor }}>
                  {pick.card.avatarImage ? (
                    <img className="v-card__avatar-image" src={pick.card.avatarImage} alt="" aria-hidden="true" />
                  ) : (
                    pick.card.avatarInitial
                  )}
                </div>
                <span className="v-card__headline">{pick.card.headline}</span>
                <PickedOptions pick={pick} />
                <ScribbleOverlay path={overlayPath} />
              </div>
            )
          })}
        </div>
      </div>

      <div className="parlay-rules parlay-rules--footer">
        <span className="parlay-rules__row">
          <span className="parlay-rules__tag">parlay</span>
          Parlay cards grant x3 points if all 3 hit
        </span>
        <span className="parlay-rules__row">
          <span className="parlay-rules__tag">base</span>
          Other cards grant base points if correct
        </span>
      </div>

      <button
        className={['lock-btn', markedCount === 3 ? 'lock-btn--ready' : ''].filter(Boolean).join(' ')}
        disabled={markedCount < 3}
        onClick={() => onLock(picks.filter((pick) => markedIds.has(pick.card.id)))}
      >
        {markedCount < 3 && `Mark 3 for parlay · ${markedCount}/3`}
        {markedCount === 3 && 'Lock parlay · 3/3'}
      </button>
    </div>
  )
}
