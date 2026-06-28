import { useState } from 'react'
import { Alert } from 'react-native'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { AuthFormLayout } from '../../components/ui/AuthFormLayout'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) Alert.alert('Login failed', error.message)
    setLoading(false)
  }

  return (
    <AuthFormLayout
      title="TrackTea"
      subtitle="Track your sweet drinks"
      footerText="Don't have an account? "
      footerLinkLabel="Sign Up"
      footerLinkHref="/(auth)/signup"
    >
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
        autoComplete="password"
      />
      <Button label="Sign In" onPress={handleLogin} loading={loading} />
    </AuthFormLayout>
  )
}
