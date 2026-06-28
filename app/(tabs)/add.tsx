import { useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Dimensions,
  Image,
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

  const imageY = useRef(new Animated.Value(0)).current
  const imageOpacity = useRef(new Animated.Value(1)).current
  const imageScale = useRef(new Animated.Value(1)).current
  const imageX = useRef(new Animated.Value(0)).current
  const basketPulse = useRef(new Animated.Value(1)).current

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      })

      if (!result.canceled) {
        setImageUri(result.assets[0].uri)
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
        setImageUri(result.assets[0].uri)
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
    if (!sugarGrams || !price) {
      Alert.alert('Missing info', 'Please enter sugar amount and price.')
      return
    }
    if (isNaN(Number(sugarGrams)) || isNaN(Number(price))) {
      Alert.alert('Invalid values', 'Sugar and price must be numbers.')
      return
    }

    setLoading(true)

    try {
      if (imageUri) {
        await runDropAnimation()
      }

      let imageUrl: string | undefined

      if (imageUri) {
        const fileName = `${user?.id}/${Date.now()}.jpg`
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
        user_id: user?.id,
        type,
        sugar_grams: Number(sugarGrams),
        price: Number(price),
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
        Alert.alert('Added!', 'Your drink has been logged.')
      }
    } catch (err) {
      Alert.alert('Unexpected error', err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
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
            <Text style={styles.label}>Photo (optional)</Text>
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
                    <Pressable style={styles.removePhoto} onPress={() => setImageUri(null)}>
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

          {/* Sugar & Price */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Sugar (g)</Text>
              <TextInput
                style={styles.input}
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
  basket: {
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    gap: Spacing.xs,
  },
  basketEmoji: { fontSize: 48 },
  basketText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '500' },
})
