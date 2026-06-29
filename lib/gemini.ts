import * as FileSystem from 'expo-file-system'

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? ''
const GEMINI_MODEL = 'gemini-1.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export type AnalysisConfidence = 'high' | 'medium' | 'low'

export interface DrinkAnalysisResult {
  brand: string
  drinkName: string
  sugarGrams: number
  confidence: AnalysisConfidence
  reasoning: string
}

const ANALYSIS_PROMPT = `You are a drink nutrition expert. Analyze this image of a drink (likely bubble tea, matcha, coffee, or juice) and estimate its sugar content.

Return a JSON object with these fields:
- "brand": the brand/chain name if recognizable, or "Unknown" if not
- "drinkName": the specific drink name if identifiable, or a general description
- "sugarGrams": estimated sugar content in grams (integer). Base this on:
  - Known nutritional data for the brand/drink if recognized
  - Typical sugar content for similar drink types if not recognized
  - Standard serving size (medium/regular unless clearly different)
- "confidence": "high" if you recognize the exact brand and drink, "medium" if you can identify the type but not exact drink, "low" if unsure
- "reasoning": a brief 1-sentence explanation of how you estimated the sugar

Return ONLY the JSON object, no markdown formatting or extra text.`

export function isGeminiConfigured(): boolean {
  return GEMINI_API_KEY.length > 0
}

export async function analyzeDrinkImage(imageUri: string): Promise<DrinkAnalysisResult> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'Gemini API key not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your environment.'
    )
  }

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  })

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: ANALYSIS_PROMPT },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 512,
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`)
  }

  const data = await response.json()

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error('No response from Gemini API')
  }

  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

  try {
    const result = JSON.parse(cleaned) as DrinkAnalysisResult
    // Validate and clamp sugar value
    if (typeof result.sugarGrams !== 'number' || isNaN(result.sugarGrams)) {
      result.sugarGrams = 30 // fallback to typical boba sugar
      result.confidence = 'low'
    }
    result.sugarGrams = Math.max(0, Math.min(200, Math.round(result.sugarGrams)))
    return result
  } catch {
    throw new Error('Failed to parse AI response. Please try again.')
  }
}
