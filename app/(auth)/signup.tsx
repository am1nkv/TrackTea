import { useState } from 'react'
import { Alert } from 'react-native'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { AuthFormLayout } from '../../components/ui/AuthFormLayout'

export default function SignupScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!email || !password || !confirm) {
      Alert.alert('Missing fields', 'Please fill in all fields.')
      return
    }
    if (password !== confirm) {
      Alert.alert('Password mismatch', 'Passwords do not match.')
      return
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      Alert.alert('Signup failed', error.message)
    } else {
      Alert.alert('Check your email', 'We sent you a confirmation link.')
    }
    setLoading(false)
  }

  return (
    <AuthFormLayout
      title="Create Account"
      subtitle="Start tracking your drinks"
      footerText="Already have an account? "
      footerLinkLabel="Sign In"
      footerLinkHref="/(auth)/login"
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
        autoComplete="new-password"
      />
      <Input
        label="Confirm Password"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="••••••••"
        secureTextEntry
      />
      <Button label="Create Account" onPress={handleSignup} loading={loading} />
    </AuthFormLayout>
  )
}
