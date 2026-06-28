import React from 'react'
import { render, screen, waitFor } from '@testing-library/react-native'
import { Text } from 'react-native'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'

const { createClient } = require('@supabase/supabase-js')
const mockSupabase = createClient()

function TestConsumer() {
  const { session, user, loading } = useAuth()
  return (
    <>
      <Text testID="loading">{String(loading)}</Text>
      <Text testID="session">{session ? 'has-session' : 'no-session'}</Text>
      <Text testID="user">{user ? user.email : 'no-user'}</Text>
    </>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })
  })

  it('provides default values when no session exists', async () => {
    await render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').props.children).toBe('false')
    })
    expect(screen.getByTestId('session').props.children).toBe('no-session')
    expect(screen.getByTestId('user').props.children).toBe('no-user')
  })

  it('provides session and user when a session exists', async () => {
    const mockSession = {
      user: { id: 'u1', email: 'test@example.com' },
      access_token: 'token',
    }
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession } })

    await render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').props.children).toBe('false')
    })
    expect(screen.getByTestId('session').props.children).toBe('has-session')
    expect(screen.getByTestId('user').props.children).toBe('test@example.com')
  })

  it('unsubscribes on unmount', async () => {
    const unsubscribe = jest.fn()
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    })

    await render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await screen.unmount()
    expect(unsubscribe).toHaveBeenCalled()
  })
})

describe('useAuth outside AuthProvider', () => {
  it('returns default values', async () => {
    await render(<TestConsumer />)
    expect(screen.getByTestId('session').props.children).toBe('no-session')
    expect(screen.getByTestId('user').props.children).toBe('no-user')
    expect(screen.getByTestId('loading').props.children).toBe('true')
  })
})
