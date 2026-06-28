import { StyleSheet, Text, View } from 'react-native'
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme'
import { Drink, DRINK_EMOJIS, DRINK_LABELS } from '../../types'

interface DrinkRowProps {
  drink: Drink
  formatDate: (iso: string) => string
}

export function DrinkRow({ drink, formatDate }: DrinkRowProps) {
  return (
    <View style={styles.drinkRow}>
      <Text style={styles.drinkEmoji}>{DRINK_EMOJIS[drink.type]}</Text>
      <View style={styles.drinkInfo}>
        <Text style={styles.drinkName}>{DRINK_LABELS[drink.type]}</Text>
        <Text style={styles.drinkDate}>{formatDate(drink.consumed_at)}</Text>
      </View>
      <View style={styles.drinkMeta}>
        <Text style={styles.drinkSugar}>{drink.sugar_grams}g</Text>
        <Text style={styles.drinkPrice}>${drink.price.toFixed(2)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
