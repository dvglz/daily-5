export type MarketType = 'player-prop' | 'moneyline' | 'spread' | 'total'

export interface CardData {
  id: string
  number: string
  marketType: MarketType
  marketLabel: string
  headline: string
  subline: string
  optionA: string
  optionB: string
  avatarInitial: string
  avatarColor: string
  avatarImage?: string
}

export const DAILY_CARDS: CardData[] = [
  {
    id: '1',
    number: '01',
    marketType: 'player-prop',
    marketLabel: 'prop',
    headline: 'LeBron 27.5 PTS @ MIA',
    subline: 'Points over/under',
    optionA: 'Over',
    optionB: 'Under',
    avatarInitial: 'LJ',
    avatarColor: '#5c2d91',
    avatarImage: '/lebron.png',
  },
  {
    id: '2',
    number: '02',
    marketType: 'moneyline',
    marketLabel: 'money',
    headline: 'Minnesota home win over Celtics',
    subline: 'Moneyline',
    optionA: 'Win',
    optionB: 'Lose',
    avatarInitial: 'MIN',
    avatarColor: '#236192',
    avatarImage: '/min.png',
  },
  {
    id: '3',
    number: '03',
    marketType: 'total',
    marketLabel: 'total',
    headline: 'Nuggets vs Lakers over 224.5',
    subline: 'Game total',
    optionA: 'Yes',
    optionB: 'No',
    avatarInitial: 'DEN',
    avatarColor: '#0E2240',
    avatarImage: '/total.png',
  },
  {
    id: '4',
    number: '04',
    marketType: 'spread',
    marketLabel: 'spread',
    headline: 'Warriors cover -4.5 vs Suns',
    subline: 'Point spread',
    optionA: 'Cover',
    optionB: 'No',
    avatarInitial: 'GSW',
    avatarColor: '#1D428A',
    avatarImage: '/gsw.png',
  },
  {
    id: '5',
    number: '05',
    marketType: 'player-prop',
    marketLabel: 'prop',
    headline: 'Jokić 9.5 AST vs Lakers',
    subline: 'Assists over/under',
    optionA: 'Over',
    optionB: 'Under',
    avatarInitial: 'NJ',
    avatarColor: '#0E2240',
    avatarImage: '/jokic.png',
  },
]
