import { DRINK_LABELS, DRINK_EMOJIS, DrinkType } from '../../types'

const ALL_DRINK_TYPES: DrinkType[] = ['matcha', 'bubble_tea', 'coffee', 'juice', 'other']

describe('DRINK_LABELS', () => {
  it('has a label for every drink type', () => {
    for (const type of ALL_DRINK_TYPES) {
      expect(DRINK_LABELS[type]).toBeDefined()
      expect(typeof DRINK_LABELS[type]).toBe('string')
      expect(DRINK_LABELS[type].length).toBeGreaterThan(0)
    }
  })

  it('returns expected label values', () => {
    expect(DRINK_LABELS.matcha).toBe('Matcha')
    expect(DRINK_LABELS.bubble_tea).toBe('Bubble Tea')
    expect(DRINK_LABELS.coffee).toBe('Coffee')
    expect(DRINK_LABELS.juice).toBe('Juice')
    expect(DRINK_LABELS.other).toBe('Other')
  })

  it('has exactly the expected number of entries', () => {
    expect(Object.keys(DRINK_LABELS)).toHaveLength(ALL_DRINK_TYPES.length)
  })
})

describe('DRINK_EMOJIS', () => {
  it('has an emoji for every drink type', () => {
    for (const type of ALL_DRINK_TYPES) {
      expect(DRINK_EMOJIS[type]).toBeDefined()
      expect(typeof DRINK_EMOJIS[type]).toBe('string')
      expect(DRINK_EMOJIS[type].length).toBeGreaterThan(0)
    }
  })

  it('returns expected emoji values', () => {
    expect(DRINK_EMOJIS.matcha).toBe('\u{1F375}')
    expect(DRINK_EMOJIS.bubble_tea).toBe('\u{1F9CB}')
    expect(DRINK_EMOJIS.coffee).toBe('\u2615')
    expect(DRINK_EMOJIS.juice).toBe('\u{1F9C3}')
    expect(DRINK_EMOJIS.other).toBe('\u{1F964}')
  })

  it('has exactly the expected number of entries', () => {
    expect(Object.keys(DRINK_EMOJIS)).toHaveLength(ALL_DRINK_TYPES.length)
  })
})

describe('DRINK_LABELS and DRINK_EMOJIS consistency', () => {
  it('have the same keys', () => {
    expect(Object.keys(DRINK_LABELS).sort()).toEqual(Object.keys(DRINK_EMOJIS).sort())
  })
})
