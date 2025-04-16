import React from 'react';
import { render } from '@testing-library/react';
import SecurityFilterBar from '../../../../../app/security/components/SecurityFilterBar';

describe('SecurityFilterBar', () => {
  it('renders without crashing', () => {
    // Basic test that just ensures the component renders without errors
    expect(() => 
      render(
        <SecurityFilterBar 
          filters={{
            severity: '',
            category: '',
            alert_level: '',
            llm_vendor: '',
            search: '',
            time_range: '7d',
          }}
          onFilterChange={() => {}}
        />
      )
    ).not.toThrow();
  });
}); 