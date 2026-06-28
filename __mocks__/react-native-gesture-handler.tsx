import React from 'react'
import { View } from 'react-native'

export const GestureHandlerRootView = ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
  <View {...props}>{children}</View>
)

export default {}
