import { useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Colors, FontSize, MONTHLY_SUGAR_LIMIT, Radius, Spacing } from '../../constants/theme'
import { Drink, DRINK_EMOJIS, DRINK_LABELS, MonthlyStats, WeeklyData } from '../../types'
import { getTimeOfDay, formatDateShort, computeMonthlyStats, computeWeeklyData, getStartOfMonth, getStartOfWeek, getGaugeColor } from '../../lib/utils'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function DashboardScreen() {
  const { user, signOut } = useAuth()
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [stats, setStats] = useState<MonthlyStats>({ total_sugar: 0, total_spent: 0, drink_count: 0 })
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>(DAYS.map(d => ({ day: d, sugar_grams: 0 })))
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    const now = new Date()
    const startOfMonth = getStartOfMonth(now)
    const startOfWeek_ = getStartOfWeek(now)

    const { data } = await supabase
      .from('drinks')
      .select('*')
      .gte('consumed_at', startOfMonth)
      .order('consumed_at', { ascending: false })

    if (!data) return

    setDrinks(data)
    setStats(computeMonthlyStats(data))
    setWeeklyData(computeWeeklyData(data, startOfWeek_))
  }

  useFocusEffect(useCallback(() => { fetchData() }, []))

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const gaugePercent = Math.min(stats.total_sugar / MONTHLY_SUGAR_LIMIT, 1)
  const maxWeekly = Math.max(...weeklyData.map(d => d.sugar_grams), 1)

  const gaugeColor = gaugePercent < 0.5
    ? Colors.success
    : gaugePercent < 0.8
    ? Colors.sugar
    : Colors.error

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
            <Text style={styles.email}>{user?.email?.split('@')[0]}</Text>
          </View>
          <Pressable onPress={signOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>

        {/* Monthly Sugar Gauge */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Monthly Sugar</Text>
          <View style={styles.gaugeRow}>
            <Text style={[styles.gaugeValue, { color: gaugeColor }]}>
              {Math.round(stats.total_sugar)}g
            </Text>
            <Text style={styles.gaugeLimit}>/ {MONTHLY_SUGAR_LIMIT}g</Text>
          </View>
          <View style={styles.gaugeTrack}>
            <View style={[styles.gaugeFill, { width: `${gaugePercent * 100}%`, backgroundColor: gaugeColor }]} />
          </View>
          <Text style={styles.gaugeSubtext}>
            {MONTHLY_SUGAR_LIMIT - stats.total_sugar > 0
              ? `${Math.round(MONTHLY_SUGAR_LIMIT - stats.total_sugar)}g remaining this month`
              : 'Monthly limit reached'}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.drink_count}</Text>
            <Text style={styles.statLabel}>Drinks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${stats.total_spent.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {stats.drink_count > 0 ? Math.round(stats.total_sugar / stats.drink_count) : 0}g
            </Text>
            <Text style={styles.statLabel}>Avg/drink</Text>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Week</Text>
          <View style={styles.chart}>
            {weeklyData.map(({ day, sugar_grams }) => (
              <View key={day} style={styles.barColumn}>
                <Text style={styles.barValue}>{sugar_grams > 0 ? `${Math.round(sugar_grams)}` : ''}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { height: `${(sugar_grams / maxWeekly) * 100}%` },
                      sugar_grams === Math.max(...weeklyData.map(d => d.sugar_grams)) && styles.barPeak,
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Drinks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Drinks</Text>
          {drinks.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🧋</Text>
              <Text style={styles.emptyText}>No drinks logged this month</Text>
            </View>
          ) : (
            drinks.slice(0, 5).map(drink => (
              <View key={drink.id} style={styles.drinkRow}>
                <Text style={styles.drinkEmoji}>{DRINK_EMOJIS[drink.type]}</Text>
                <View style={styles.drinkInfo}>
                  <Text style={styles.drinkName}>{DRINK_LABELS[drink.type]}</Text>
                  <Text style={styles.drinkDate}>{formatDateShort(drink.consumed_at)}</Text>
                </View>
                <View style={styles.drinkMeta}>
                  <Text style={styles.drinkSugar}>{drink.sugar_grams}g</Text>
                  <Text style={styles.drinkPrice}>${drink.price.toFixed(2)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  greeting: { fontSize: FontSize.sm, color: Colors.textSecondary },
  email: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  signOutBtn: { padding: Spacing.sm },
  signOutText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  gaugeRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  gaugeValue: { fontSize: FontSize.xxxl, fontWeight: '700' },
  gaugeLimit: { fontSize: FontSize.lg, color: Colors.textMuted },
  gaugeTrack: { height: 10, backgroundColor: Colors.borderLight, borderRadius: Radius.full, overflow: 'hidden' },
  gaugeFill: { height: '100%', borderRadius: Radius.full },
  gaugeSubtext: { fontSize: FontSize.xs, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  chart: { flexDirection: 'row', height: 120, alignItems: 'flex-end', gap: Spacing.xs },
  barColumn: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: 9, color: Colors.textMuted },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: Colors.primaryLight, borderRadius: 4, minHeight: 4 },
  barPeak: { backgroundColor: Colors.primary },
  barLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500' },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  empty: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary },
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
