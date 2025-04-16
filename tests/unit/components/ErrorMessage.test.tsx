import React from 'react'
import { render } from '@testing-library/react'
import ErrorMessage from '@/components/ErrorMessage'

describe('ErrorMessage', () => {
  it('renders without crashing', () => {
    // Basic test that just ensures the component renders without errors
    expect(() => render(<ErrorMessage message="Test error message" />)).not.toThrow()
  })
}) 