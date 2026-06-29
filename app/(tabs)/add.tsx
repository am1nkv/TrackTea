import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme'
import { DRINK_EMOJIS, DRINK_LABELS, DrinkType } from '../../types'
import { analyzeDrinkImage, DrinkAnalysisResult, isGeminiConfigured } from '../../lib/gemini'

const DRINK_TYPES: DrinkType[] = ['matcha', 'bubble_tea', 'coffee', 'juice', 'other']
const { height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function AddDrinkScreen() {
  const { user } = useAuth()
  const [type, setType] = useState<DrinkType>('bubble_tea')
  const [sugarGrams, setSugarGrams] = useState('')
  const [price, setPrice] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [animating, setAnimating] = useState(false)

  // AI analysis state
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<DrinkAnalysisResult | null>(null)
  const [analysisDismissed, setAnalysisDismissed] = useState(false)

  const imageY = useRef(new Animated.Value(0)).current
  const imageOpacity = useRef(new Animated.Value(1)).current
  const imageScale = useRef(new Animated.Value(1)).current
  const imageX = useRef(new Animated.Value(0)).current
  const basketPulse = useRef(new Animated.Value(1)).current

  const analyzeImage = async (uri: string) => {
    if (!isGeminiConfigured()) return

    setAnalyzing(true)
    setAnalysisResult(null)
    setAnalysisDismissed(false)

    try {
      const result = await analyzeDrinkImage(uri)
      setAnalysisResult(result)
      setSugarGrams(String(result.sugarGrams))
    } catch (err) {
      console.warn('AI analysis failed:', err)
      // Don't show error to user - AI is optional enhancement
    } finally {
      setAnalyzing(false)
    }
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      })

      if (!result.canceled) {
        const uri = result.assets[0].uri
        setImageUri(uri)
        analyzeImage(uri)
      }
    } catch (err) {
      Alert.alert('Camera error', err instanceof Error ? err.message : 'Could not open camera.')
    }
  }

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      })

      if (!result.canceled) {
        const uri = result.assets[0].uri
        setImageUri(uri)
        analyzeImage(uri)
      }
    } catch (err) {
      Alert.alert('Library error', err instanceof Error ? err.message : 'Could not open photo library.')
    }
  }

  const runDropAnimation = (): Promise<void> => {
    imageY.setValue(0)
    imageOpacity.setValue(1)
    imageScale.setValue(1)
    imageX.setValue(0)

    return new Promise(resolve => {
      setAnimating(true)
      Animated.sequence([
        Animated.parallel([
          Animated.timing(imageY, { toValue: SCREEN_HEIGHT * 0.55, duration: 700, useNativeDriver: true }),
          Animated.timing(imageScale, { toValue: 0.3, duration: 700, useNativeDriver: true }),
          Animated.timing(imageOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
        Animated.spring(basketPulse, { toValue: 1.2, useNativeDriver: true }),
        Animated.spring(basketPulse, { toValue: 1, useNativeDriver: true }),
      ]).start(() => {
        setAnimating(false)
        resolve()
      })
    })
  }

  const handleAdd = async () => {
    if (!user) return
    if (!sugarGrams || !price) {
      Alert.alert('Missing info', 'Please enter sugar amount and price.')
      return
    }
    const sugarNum = Number(sugarGrams)
    const priceNum = Number(price)
    if (isNaN(sugarNum) || isNaN(priceNum) || !isFinite(sugarNum) || !isFinite(priceNum)) {
      Alert.alert('Invalid values', 'Sugar and price must be valid numbers.')
      return
    }
    if (sugarNum < 0 || sugarNum > 500) {
      Alert.alert('Invalid sugar', 'Sugar must be between 0 and 500 grams.')
      return
    }
    if (priceNum < 0 || priceNum > 1000) {
      Alert.alert('Invalid price', 'Price must be between $0 and $1000.')
      return
    }

    setLoading(true)

    try {
      if (imageUri) {
        await runDropAnimation()
      }

      let imageUrl: string | undefined

      if (imageUri) {
        const fileName = `${user.id}/${Date.now()}.jpg`
        const response = await fetch(imageUri)
        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()

        const { error: uploadError } = await supabase.storage
          .from('drink-photos')
          .upload(fileName, arrayBuffer, { contentType: 'image/jpeg' })

        if (uploadError) {
          Alert.alert('Upload failed', uploadError.message)
          setLoading(false)
          return
        }

        const { data } = supabase.storage.from('drink-photos').getPublicUrl(fileName)
        imageUrl = data.publicUrl
      }

      const { error } = await supabase.from('drinks').insert({
        user_id: user.id,
        type,
        sugar_grams: sugarNum,
        price: priceNum,
        image_url: imageUrl,
        is_public: false,
        consumed_at: new Date().toISOString(),
      })

      if (error) {
        Alert.alert('Error', error.message)
      } else {
        setSugarGrams('')
        setPrice('')
        setImageUri(null)
        setAnalysisResult(null)
        setAnalysisDismissed(false)
        Alert.alert('Added!', 'Your drink has been logged.')
      }
    } catch (err) {
      Alert.alert('Unexpected error', err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const confidenceColor = (confidence: DrinkAnalysisResult['confidence']) => {
    switch (confidence) {
      case 'high': return Colors.success
      case 'medium': return Colors.sugar
      case 'low': return Colors.error
    }
  }

  const confidenceLabel = (confidence: DrinkAnalysisResult['confidence']) => {
    switch (confidence) {
      case 'high': return 'High confidence'
      case 'medium': return 'Medium confidence'
      case 'low': return 'Estimate only'
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Log a Drink</Text>

          {/* Drink Type Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
              {DRINK_TYPES.map(t => (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  style={[styles.typeChip, type === t && styles.typeChipActive]}
                >
                  <Text style={styles.typeEmoji}>{DRINK_EMOJIS[t]}</Text>
                  <Text style={[styles.typeLabel, type === t && styles.typeLabelActive]}>
                    {DRINK_LABELS[t]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Photo Section with animation overlay */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Photo {isGeminiConfigured() ? '(AI will estimate sugar)' : '(optional)'}
            </Text>
            <View style={styles.photoArea}>
              {imageUri ? (
                <View style={styles.imageWrapper}>
                  <Animated.Image
                    source={{ uri: imageUri }}
                    style={[
                      styles.preview,
                      {
                        transform: [
                          { translateY: imageY },
                          { translateX: imageX },
                          { scale: imageScale },
                        ],
                        opacity: imageOpacity,
                      },
                    ]}
                  />
                  {!animating && (
                    <Pressable style={styles.removePhoto} onPress={() => {
                      setImageUri(null)
                      setAnalysisResult(null)
                      setAnalysisDismissed(false)
                    }}>
                      <Text style={styles.removePhotoText}>✕</Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <View style={styles.photoButtons}>
                  <Pressable style={styles.photoBtn} onPress={pickImage}>
                    <Text style={styles.photoBtnEmoji}>📷</Text>
                    <Text style={styles.photoBtnText}>Camera</Text>
                  </Pressable>
                  <Pressable style={styles.photoBtn} onPress={pickFromLibrary}>
                    <Text style={styles.photoBtnEmoji}>🖼️</Text>
                    <Text style={styles.photoBtnText}>Library</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          {/* AI Analysis Result */}
          {analyzing && (
            <View style={styles.analysisCard}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.analysisLoadingText}>Analyzing drink...</Text>
            </View>
          )}

          {analysisResult && !analysisDismissed && (
            <View style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <Text style={styles.analysisTitle}>🤖 AI Estimate</Text>
                <Pressable onPress={() => setAnalysisDismissed(true)}>
                  <Text style={styles.analysisDismiss}>✕</Text>
                </Pressable>
              </View>
              <View style={styles.analysisBody}>
                {analysisResult.brand !== 'Unknown' && (
                  <Text style={styles.analysisBrand}>
                    {analysisResult.brand} — {analysisResult.drinkName}
                  </Text>
                )}
                {analysisResult.brand === 'Unknown' && (
                  <Text style={styles.analysisBrand}>{analysisResult.drinkName}</Text>
                )}
                <View style={styles.analysisSugarRow}>
                  <Text style={styles.analysisSugar}>~{analysisResult.sugarGrams}g sugar</Text>
                  <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor(analysisResult.confidence) + '20' }]}>
                    <View style={[styles.confidenceDot, { backgroundColor: confidenceColor(analysisResult.confidence) }]} />
                    <Text style={[styles.confidenceText, { color: confidenceColor(analysisResult.confidence) }]}>
                      {confidenceLabel(analysisResult.confidence)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.analysisReasoning}>{analysisResult.reasoning}</Text>
              </View>
              <Text style={styles.analysisHint}>Sugar field updated. Adjust if needed.</Text>
            </View>
          )}

          {/* Sugar & Price */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Sugar (g)</Text>
              <TextInput
                style={[
                  styles.input,
                  analysisResult && !analysisDismissed && styles.inputHighlighted,
                ]}
                value={sugarGrams}
                onChangeText={setSugarGrams}
                placeholder="e.g. 35"
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Price ($)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="e.g. 6.50"
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          {/* Basket visual */}
          <Animated.View style={[styles.basket, { transform: [{ scale: basketPulse }] }]}>
            <Text style={styles.basketEmoji}>🧺</Text>
            <Text style={styles.basketText}>Drop it in the basket</Text>
          </Animated.View>

          <Button label="Add to Basket" onPress={handleAdd} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  section: { gap: Spacing.sm },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  typeRow: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  typeChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  typeEmoji: { fontSize: 18 },
  typeLabel: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textSecondary },
  typeLabelActive: { color: Colors.primary, fontWeight: '600' },
  photoArea: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: { width: '100%', position: 'relative' },
  preview: { width: '100%', height: 200, resizeMode: 'cover' },
  removePhoto: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radius.full,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  photoButtons: { flexDirection: 'row', gap: Spacing.xl, padding: Spacing.xl },
  photoBtn: { alignItems: 'center', gap: Spacing.xs },
  photoBtnEmoji: { fontSize: 36 },
  photoBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  row: { flexDirection: 'row', gap: Spacing.md },
  halfInput: { flex: 1, gap: Spacing.xs },
  input: {
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  inputHighlighted: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  basket: {
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    gap: Spacing.xs,
  },
  basketEmoji: { fontSize: 48 },
  basketText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '500' },
  // AI Analysis styles
  analysisCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    gap: Spacing.sm,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  analysisDismiss: {
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.xs,
  },
  analysisLoadingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  analysisBody: {
    gap: Spacing.xs,
  },
  analysisBrand: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  analysisSugarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  analysisSugar: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.sugar,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  analysisReasoning: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  analysisHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
})
