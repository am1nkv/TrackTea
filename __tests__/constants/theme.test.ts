import { Colors, Spacing, Radius, FontSize, MONTHLY_SUGAR_LIMIT } from '../../constants/theme'

describe('Colors', () => {
  it('exports all required color tokens', () => {
    expect(Colors.primary).toBe('#6B9E6F')
    expect(Colors.primaryLight).toBe('#E8F5E9')
    expect(Colors.primaryDark).toBe('#4A7A4E')
    expect(Colors.background).toBe('#FAFAFA')
    expect(Colors.surface).toBe('#FFFFFF')
    expect(Colors.text).toBe('#1A1A1A')
    expect(Colors.textSecondary).toBe('#6B7280')
    expect(Colors.textMuted).toBe('#9CA3AF')
    expect(Colors.border).toBe('#E5E7EB')
    expect(Colors.borderLight).toBe('#F3F4F6')
    expect(Colors.sugar).toBe('#F59E0B')
    expect(Colors.sugarLight).toBe('#FEF3C7')
    expect(Colors.error).toBe('#EF4444')
    expect(Colors.errorLight).toBe('#FEE2E2')
    expect(Colors.success).toBe('#10B981')
    expect(Colors.successLight).toBe('#D1FAE5')
    expect(Colors.white).toBe('#FFFFFF')
    expect(Colors.black).toBe('#000000')
  })

  it('all color values are valid hex codes', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/
    for (const [, value] of Object.entries(Colors)) {
      expect(value).toMatch(hexPattern)
    }
  })
})

describe('Spacing', () => {
  it('exports spacing values in ascending order', () => {
    expect(Spacing.xs).toBe(4)
    expect(Spacing.sm).toBe(8)
    expect(Spacing.md).toBe(16)
    expect(Spacing.lg).toBe(24)
    expect(Spacing.xl).toBe(32)
    expect(Spacing.xxl).toBe(48)
  })

  it('values increase progressively', () => {
    expect(Spacing.xs).toBeLessThan(Spacing.sm)
    expect(Spacing.sm).toBeLessThan(Spacing.md)
    expect(Spacing.md).toBeLessThan(Spacing.lg)
    expect(Spacing.lg).toBeLessThan(Spacing.xl)
    expect(Spacing.xl).toBeLessThan(Spacing.xxl)
  })
})

describe('Radius', () => {
  it('exports radius values', () => {
    expect(Radius.sm).toBe(8)
    expect(Radius.md).toBe(12)
    expect(Radius.lg).toBe(16)
    expect(Radius.xl).toBe(24)
    expect(Radius.full).toBe(9999)
  })
})

describe('FontSize', () => {
  it('exports font size values in ascending order', () => {
    expect(FontSize.xs).toBe(11)
    expect(FontSize.sm).toBe(13)
    expect(FontSize.md).toBe(15)
    expect(FontSize.lg).toBe(17)
    expect(FontSize.xl).toBe(20)
    expect(FontSize.xxl).toBe(24)
    expect(FontSize.xxxl).toBe(32)
  })

  it('values increase progressively', () => {
    const sizes = [FontSize.xs, FontSize.sm, FontSize.md, FontSize.lg, FontSize.xl, FontSize.xxl, FontSize.xxxl]
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeGreaterThan(sizes[i - 1])
    }
  })
})

describe('MONTHLY_SUGAR_LIMIT', () => {
  it('is set to 500', () => {
    expect(MONTHLY_SUGAR_LIMIT).toBe(500)
  })

  it('is a positive number', () => {
    expect(MONTHLY_SUGAR_LIMIT).toBeGreaterThan(0)
  })
})
