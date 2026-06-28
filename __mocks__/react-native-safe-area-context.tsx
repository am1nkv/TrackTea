import React from 'react'
import { View } from 'react-native'

export const SafeAreaView = ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
  <View {...props}>{children}</View>
)

export const SafeAreaProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>

export const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 })
