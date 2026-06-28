import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme'
import { Drink, DRINK_EMOJIS, DRINK_LABELS } from '../../types'
import { formatDateWithWeekday } from '../../lib/utils'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function HistoryScreen() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [loading, setLoading] = useState(false)

  const fetchHistory = async (y: number, m: number) => {
    setLoading(true)
    const start = new Date(y, m, 1).toISOString()
    const end = new Date(y, m + 1, 0, 23, 59, 59).toISOString()

    const { data } = await supabase
      .from('drinks')
      .select('*')
      .gte('consumed_at', start)
      .lte('consumed_at', end)
      .order('consumed_at', { ascending: false })

    setDrinks(data ?? [])
    setLoading(false)
  }

  useFocusEffect(useCallback(() => { fetchHistory(year, month) }, [year, month]))

  const goToPrev = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  const goToNext = () => {
    const nextIsInFuture = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth())
    if (nextIsInFuture) return
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const totalSugar = drinks.reduce((sum, d) => sum + d.sugar_grams, 0)
  const totalSpent = drinks.reduce((sum, d) => sum + d.price, 0)
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>History</Text>

        {/* Month Navigator */}
        <View style={styles.navigator}>
          <Pressable onPress={goToPrev} style={styles.navBtn}>
            <Text style={styles.navArrow}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
          <Pressable onPress={goToNext} style={[styles.navBtn, isCurrentMonth && styles.navBtnDisabled]}>
            <Text style={[styles.navArrow, isCurrentMonth && styles.navArrowDisabled]}>›</Text>
          </Pressable>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{Math.round(totalSugar)}g</Text>
            <Text style={styles.summaryLabel}>Total Sugar</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>${totalSpent.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Spent</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{drinks.length}</Text>
            <Text style={styles.summaryLabel}>Drinks</Text>
          </View>
        </View>

        {/* Drink List */}
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : drinks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No drinks logged in {MONTH_NAMES[month]}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {drinks.map(drink => (
              <View key={drink.id} style={styles.drinkRow}>
                <Text style={styles.drinkEmoji}>{DRINK_EMOJIS[drink.type]}</Text>
                <View style={styles.drinkInfo}>
                  <Text style={styles.drinkName}>{DRINK_LABELS[drink.type]}</Text>
                  <Text style={styles.drinkDate}>{formatDateWithWeekday(drink.consumed_at)}</Text>
                </View>
                <View style={styles.drinkMeta}>
                  <Text style={styles.drinkSugar}>{drink.sugar_grams}g</Text>
                  <Text style={styles.drinkPrice}>${drink.price.toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  navigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  navBtn: { padding: Spacing.sm },
  navBtnDisabled: { opacity: 0.3 },
  navArrow: { fontSize: 28, color: Colors.primary, fontWeight: '300', lineHeight: 32 },
  navArrowDisabled: { color: Colors.textMuted },
  monthLabel: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  summary: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  divider: { width: 1, backgroundColor: Colors.border },
  list: { gap: Spacing.sm },
  loadingText: { textAlign: 'center', color: Colors.textSecondary, fontSize: FontSize.sm },
  empty: { alignItems: 'center', padding: Spacing.xxl, gap: Spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  drinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  drinkEmoji: { fontSize: 28 },
  drinkInfo: { flex: 1 },
  drinkName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  drinkDate: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  drinkMeta: { alignItems: 'flex-end' },
  drinkSugar: { fontSize: FontSize.md, fontWeight: '700', color: Colors.sugar },
  drinkPrice: { fontSize: FontSize.xs, color: Colors.textSecondary },
})
