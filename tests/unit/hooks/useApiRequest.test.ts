import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiRequest } from '@/hooks/useApiRequest';

// Mock API error type
const mockApiError = {
  status: 'error',
  message: 'An error occurred',
  detail: {
    errors: [
      { field: 'username', message: 'Username is invalid', type: 'validation' }
    ]
  }
};

describe('useApiRequest', () => {
  // Test for successful API request
  it('should handle successful API requests', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockApiCall = jest.fn().mockResolvedValue(mockData);
    const onSuccess = jest.fn();

    const { result } = renderHook(() => 
      useApiRequest(mockApiCall, { immediate: false, onSuccess })
    );

    // Initial state
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();

    // Execute the request
    await act(async () => {
      await result.current.execute();
    });

    // Check the state after successful request
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(onSuccess).toHaveBeenCalledWith(mockData);
    expect(mockApiCall).toHaveBeenCalledTimes(1);
  });

  // Test for failed API request
  it('should handle API request errors', async () => {
    const mockApiCall = jest.fn().mockRejectedValue(mockApiError);
    const onError = jest.fn();

    const { result } = renderHook(() => 
      useApiRequest(mockApiCall, { immediate: false, onError })
    );

    // Execute the request that will fail
    await act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Error is expected
      }
    });

    // Check the state after failed request
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockApiError);
    expect(onError).toHaveBeenCalledWith(mockApiError);
  });

  // Test for immediate execution
  it('should execute immediately when immediate=true', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockApiCall = jest.fn().mockResolvedValue(mockData);

    renderHook(() => useApiRequest(mockApiCall, { immediate: true }));

    // Wait for the mock API call to be executed
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledTimes(1);
    });
  });

  // Test the reset functionality
  it('should reset state correctly', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockApiCall = jest.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => 
      useApiRequest(mockApiCall, { immediate: false })
    );

    // Execute the request to set some data
    await act(async () => {
      await result.current.execute();
    });

    // Verify data is set
    expect(result.current.data).toEqual(mockData);

    // Reset the state
    act(() => {
      result.current.reset();
    });

    // Verify state is reset
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // Test for dependencies array
  it('should re-execute when dependencies change', async () => {
    const mockData1 = { id: 1, name: 'Test 1' };
    const mockData2 = { id: 2, name: 'Test 2' };
    
    const mockApiCall = jest.fn()
      .mockResolvedValueOnce(mockData1)
      .mockResolvedValueOnce(mockData2);
    
    // Create a dependency value that we'll change
    let dependency = 'initial';
    
    const { result, rerender } = renderHook(() => 
      useApiRequest(mockApiCall, { dependencies: [dependency] })
    );
    
    // Wait for initial execution
    await waitFor(() => {
      expect(result.current.data).toEqual(mockData1);
    });
    
    // Change the dependency
    dependency = 'changed';
    
    // Rerender with new dependency value
    rerender();
    
    // The hook should execute again due to dependency change
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledTimes(2);
      expect(result.current.data).toEqual(mockData2);
    });
  });
}); 