import { useRef, useEffect, useState } from 'react'

interface DauberMarkProps {
  active: boolean
}

// Slightly asymmetric oval — hand-drawn chisel marker feel
const PATH = 'M 54,5 C 82,3 100,13 100,28 C 100,43 82,52 54,51 C 26,52 4,43 4,28 C 4,13 26,3 54,5'

export function DauberMark({ active }: DauberMarkProps) {
  const pathRef = useRef<SVGPathElement>(null)
  const [length, setLength] = useState(260)

  useEffect(() => {
    if (pathRef.current) {
      setLength(pathRef.current.getTotalLength())
    }
  }, [])

  return (
    <svg
      className="dauber"
      viewBox="0 0 104 56"
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id="chisel-ink" x="-15%" y="-30%" width="130%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.025"
            numOctaves="4"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="2.2"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      {/* Shadow stroke for depth */}
      <path
        d={PATH}
        fill="none"
        stroke="#a01010"
        strokeWidth="13"
        strokeLinecap="square"
        strokeOpacity="0.25"
        filter="url(#chisel-ink)"
        strokeDasharray={length}
        strokeDashoffset={active ? 0 : length}
        style={{
          transition: active ? 'stroke-dashoffset 0.42s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      />
      {/* Main chisel stroke */}
      <path
        ref={pathRef}
        d={PATH}
        fill="none"
        stroke="#E52222"
        strokeWidth="9"
        strokeLinecap="square"
        strokeLinejoin="round"
        strokeOpacity="0.92"
        filter="url(#chisel-ink)"
        strokeDasharray={length}
        strokeDashoffset={active ? 0 : length}
        style={{
          transition: active ? 'stroke-dashoffset 0.42s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      />
    </svg>
  )
}
