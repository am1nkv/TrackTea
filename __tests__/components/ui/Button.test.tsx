import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Button } from '../../../components/ui/Button'

describe('Button', () => {
  it('renders the label text', async () => {
    await render(<Button label="Press me" onPress={() => {}} />)
    expect(screen.getByText('Press me')).toBeTruthy()
  })

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn()
    await render(<Button label="Click" onPress={onPress} />)
    fireEvent.press(screen.getByText('Click'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn()
    await render(<Button label="Disabled" onPress={onPress} disabled />)
    fireEvent.press(screen.getByText('Disabled'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('shows ActivityIndicator when loading', async () => {
    await render(<Button label="Loading" onPress={() => {}} loading />)
    expect(screen.queryByText('Loading')).toBeNull()
  })

  it('renders with secondary variant', async () => {
    await render(<Button label="Secondary" onPress={() => {}} variant="secondary" />)
    expect(screen.getByText('Secondary')).toBeTruthy()
  })

  it('renders with ghost variant', async () => {
    await render(<Button label="Ghost" onPress={() => {}} variant="ghost" />)
    expect(screen.getByText('Ghost')).toBeTruthy()
  })

  it('renders with default primary variant', async () => {
    await render(<Button label="Primary" onPress={() => {}} />)
    expect(screen.getByText('Primary')).toBeTruthy()
  })
})
