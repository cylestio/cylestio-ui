import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar from '../../../app/components/Sidebar';

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}));

describe('Sidebar Component', () => {
  it('renders without crashing', () => {
    // Basic test that just ensures the component renders without errors
    expect(() => render(<Sidebar />)).not.toThrow();
  });
});
