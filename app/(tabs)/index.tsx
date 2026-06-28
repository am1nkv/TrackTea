import { useCallback, useState } from 'react'
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Colors, FontSize, MONTHLY_SUGAR_LIMIT, Radius, Spacing } from '../../constants/theme'
import { cardShadow, SharedStyles } from '../../constants/styles'
import { Drink, MonthlyStats, WeeklyData } from '../../types'
import { formatDate } from '../../lib/formatDate'
import { DrinkRow } from '../../components/ui/DrinkRow'
import { EmptyState } from '../../components/ui/EmptyState'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const dashboardDateFormat: Intl.DateTimeFormatOptions = {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
}

export default function DashboardScreen() {
  const { user, signOut } = useAuth()
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [stats, setStats] = useState<MonthlyStats>({ total_sugar: 0, total_spent: 0, drink_count: 0 })
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>(DAYS.map(d => ({ day: d, sugar_grams: 0 })))
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    if (!user) return
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startOfWeek = (() => {
      const d = new Date()
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      return new Date(d.setDate(diff)).toISOString()
    })()

    const { data, error } = await supabase
      .from('drinks')
      .select('*')
      .eq('user_id', user.id)
      .gte('consumed_at', startOfMonth)
      .order('consumed_at', { ascending: false })

    if (error) {
      Alert.alert('Failed to load drinks', error.message)
      return
    }

    if (!data) return

    setDrinks(data)

    const totals = data.reduce(
      (acc, d) => ({
        total_sugar: acc.total_sugar + (d.sugar_grams ?? 0),
        total_spent: acc.total_spent + (d.price ?? 0),
        drink_count: acc.drink_count + 1,
      }),
      { total_sugar: 0, total_spent: 0, drink_count: 0 }
    )
    setStats(totals)

    const weeklyMap: Record<string, number> = {}
    data
      .filter(d => d.consumed_at >= startOfWeek)
      .forEach(d => {
        const day = DAYS[new Date(d.consumed_at).getDay() === 0 ? 6 : new Date(d.consumed_at).getDay() - 1]
        weeklyMap[day] = (weeklyMap[day] ?? 0) + d.sugar_grams
      })

    setWeeklyData(DAYS.map(d => ({ day: d, sugar_grams: weeklyMap[d] ?? 0 })))
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
    <SafeAreaView style={SharedStyles.screenContainer}>
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
        <View style={SharedStyles.card}>
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
        <View style={SharedStyles.card}>
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
            <EmptyState emoji="🧋" message="No drinks logged this month" />
          ) : (
            drinks.slice(0, 5).map(drink => (
              <DrinkRow
                key={drink.id}
                drink={drink}
                formatDate={(iso) => formatDate(iso, dashboardDateFormat)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  greeting: { fontSize: FontSize.sm, color: Colors.textSecondary },
  email: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  signOutBtn: { padding: Spacing.sm },
  signOutText: { fontSize: FontSize.sm, color: Colors.textSecondary },
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
    ...cardShadow,
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
})
