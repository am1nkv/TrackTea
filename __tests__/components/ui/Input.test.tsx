import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Input } from '../../../components/ui/Input'

describe('Input', () => {
  it('renders without label or error', async () => {
    await render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeTruthy()
  })

  it('renders the label when provided', async () => {
    await render(<Input label="Email" placeholder="Enter email" />)
    expect(screen.getByText('Email')).toBeTruthy()
  })

  it('renders the error message when provided', async () => {
    await render(<Input error="Required field" placeholder="Enter" />)
    expect(screen.getByText('Required field')).toBeTruthy()
  })

  it('does not render error when not provided', async () => {
    await render(<Input placeholder="Enter" />)
    expect(screen.queryByText('Required field')).toBeNull()
  })

  it('does not render label when not provided', async () => {
    await render(<Input placeholder="Enter" />)
    expect(screen.queryByText('Email')).toBeNull()
  })

  it('calls onChangeText when text changes', async () => {
    const onChangeText = jest.fn()
    await render(<Input placeholder="Type here" onChangeText={onChangeText} />)
    fireEvent.changeText(screen.getByPlaceholderText('Type here'), 'hello')
    expect(onChangeText).toHaveBeenCalledWith('hello')
  })

  it('renders with both label and error', async () => {
    await render(<Input label="Password" error="Too short" placeholder="Enter password" />)
    expect(screen.getByText('Password')).toBeTruthy()
    expect(screen.getByText('Too short')).toBeTruthy()
  })

  it('passes through additional TextInput props', async () => {
    await render(<Input placeholder="Email" keyboardType="email-address" autoCapitalize="none" />)
    const input = screen.getByPlaceholderText('Email')
    expect(input.props.keyboardType).toBe('email-address')
    expect(input.props.autoCapitalize).toBe('none')
  })
})
