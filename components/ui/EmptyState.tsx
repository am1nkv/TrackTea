import { StyleSheet, Text, View } from 'react-native'
import { Colors, FontSize, Spacing } from '../../constants/theme'

interface EmptyStateProps {
  emoji: string
  message: string
}

export function EmptyState({ emoji, message }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emoji: { fontSize: 48 },
  message: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
})
