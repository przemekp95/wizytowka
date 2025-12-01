import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import ErrorBoundary, { withErrorBoundary } from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error occurred');
  }
  return <div>Normal component</div>;
};

// Component that throws error in lifecycle
class ThrowErrorInComponentDidMount extends React.Component {
  componentDidMount() {
    throw new Error('Lifecycle error');
  }

  render() {
    return <div>Lifecycle component</div>;
  }
}

describe('ErrorBoundary', () => {
  let localConsoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localConsoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    localConsoleErrorSpy.mockRestore();
  });

  describe('Error catching and recovery', () => {
    it('should render children normally when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal component')).toBeInTheDocument();
    });

    it('should catch errors thrown by child components', () => {
      const spy = vi.fn();

      render(
        <ErrorBoundary onError={spy}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('should catch errors in component lifecycle methods', () => {
      render(
        <ErrorBoundary>
          <ThrowErrorInComponentDidMount />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Occurred')).toBeInTheDocument();
    });

    it('should log errors to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(localConsoleErrorSpy).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });
  });

  describe('Custom fallback UI', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
      expect(screen.queryByText('Error Occurred')).not.toBeInTheDocument();
    });

    it('should render children when custom fallback is provided and no error', () => {
      const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal component')).toBeInTheDocument();
      expect(screen.queryByTestId('custom-fallback')).not.toBeInTheDocument();
    });
  });

  describe('Default fallback UI', () => {
    beforeEach(() => {
      // Mock window.location.reload
      Object.defineProperty(window, 'location', {
        value: { reload: vi.fn() },
        writable: true
      });
    });

    it('should render default error UI when no custom fallback provided', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Occurred')).toBeInTheDocument();
      expect(screen.getByText('We apologize for the inconvenience. Please try refreshing the page.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
    });

    it('should have proper aria-hidden attribute on SVG icon', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorIcon = document.querySelector('svg');
      expect(errorIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should refresh page when refresh button is clicked', () => {
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh page/i });
      fireEvent.click(refreshButton);

      expect(reloadSpy).toHaveBeenCalledTimes(1);

      reloadSpy.mockRestore();
    });
  });

  describe('Custom error handler', () => {
    it('should call custom error handler when provided', () => {
      const onErrorMock = vi.fn();

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onErrorMock).toHaveBeenCalledTimes(1);
      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('should pass error and errorInfo to custom handler', () => {
      const onErrorMock = vi.fn();

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const callArgs = onErrorMock.mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Error);
      expect(callArgs[0].message).toBe('Test error occurred');
      expect(callArgs[1]).toHaveProperty('componentStack');
    });
  });


});

describe('withErrorBoundary HOC', () => {
  it('should wrap component with ErrorBoundary', () => {
    const TestComponent = () => <div>Test Component</div>;

    const WrappedComponent = withErrorBoundary(TestComponent);
    const displayName = WrappedComponent.displayName;

    expect(displayName).toBe('withErrorBoundary(TestComponent)');
  });

  it('should wrap named component with proper displayName', () => {
    const TestComponent = () => <div>Test Component</div>;
    TestComponent.displayName = 'CustomName';

    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(CustomName)');
  });

  it('should pass custom fallback to wrapped component', () => {
    const TestComponent = () => <div>Test Component</div>;
    const customFallback = <div data-testid="custom-fallback">Custom Error</div>;

    const WrappedComponent = withErrorBoundary(TestComponent, customFallback);

    render(<WrappedComponent />);

    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should render wrapped component normally', () => {
    const TestComponent = ({ message }: { message: string }) => <div>{message}</div>;

    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent message="Hello World" />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should handle errors in wrapped component with custom fallback', () => {
    const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Wrapped component error');
      }
      return <div>Normal wrapped component</div>;
    };

    const customFallback = <div data-testid="custom-error">Custom Error UI</div>;
    const WrappedComponent = withErrorBoundary(TestComponent, customFallback);

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByTestId('custom-error')).toBeInTheDocument();
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.queryByText('Error Occurred')).not.toBeInTheDocument();
  });

  it('should call custom error handler for wrapped component', () => {
    const onErrorMock = vi.fn();

    const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Wrapped component error');
      }
      return <div>Normal wrapped component</div>;
    };

    const WrappedComponent = withErrorBoundary(TestComponent, undefined, onErrorMock);

    render(<WrappedComponent shouldThrow={true} />);

    expect(onErrorMock).toHaveBeenCalledTimes(1);
  });
});

describe('ErrorBoundary multiple instances', () => {
  it('should isolate errors between different ErrorBoundary instances', () => {
    const { rerender } = render(
      <div>
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      </div>
    );

    // Should have one error UI and two normal components
    expect(screen.getByText('Error Occurred')).toBeInTheDocument();
    expect(screen.getAllByText('Normal component')).toHaveLength(2);
  });
});

describe('ErrorBoundary accessibility', () => {
  it('should have semantic heading in error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('heading', { name: 'Error Occurred' })).toBeInTheDocument();
  });
});
