import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const serializeError = (error: any) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  return error;
};

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
  errorInfo: any;
}

export class ErrorBoundary extends React.Component<
  { 
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: any; retry: () => void }>;
    onError?: (error: any, errorInfo: any) => void;
  },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({ errorInfo });
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      // Default fallback UI
      const serializedError = serializeError(this.state.error);
      
      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Something went wrong
            </h2>
            
            <p className="text-red-600 mb-4">
              {serializedError.message || 'An unexpected error occurred'}
            </p>
            
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-red-700 hover:text-red-800">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded border overflow-auto text-red-900">
                  {JSON.stringify(serializedError, null, 2)}
                </pre>
                {this.state.errorInfo && (
                  <pre className="mt-2 text-xs bg-red-100 p-2 rounded border overflow-auto text-red-900">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Audio-specific error boundary component
export const AudioErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const handleAudioError = (error: any, errorInfo: any) => {
    // Log audio-specific errors
    console.error('Audio system error:', {
      error: serializeError(error),
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      audioContextSupport: {
        AudioContext: typeof AudioContext !== 'undefined',
        webkitAudioContext: typeof (window as any).webkitAudioContext !== 'undefined'
      }
    });
  };

  const AudioErrorFallback: React.FC<{ error: any; retry: () => void }> = ({ error, retry }) => {
    const isAudioContextError = error?.message?.includes('AudioContext') || 
                                error?.message?.includes('Web Audio API');
    
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
        <div className="flex items-center mb-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
          <h3 className="text-yellow-800 font-medium">
            {isAudioContextError ? 'Audio Not Available' : 'Audio System Error'}
          </h3>
        </div>
        
        <p className="text-yellow-700 mb-3">
          {isAudioContextError 
            ? 'Audio features require user interaction to enable. Click "Enable Audio" to activate sound.'
            : 'The audio system encountered an error. This may be due to browser restrictions or unsupported features.'
          }
        </p>
        
        <div className="flex space-x-2">
          <button
            onClick={retry}
            className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
          >
            {isAudioContextError ? 'Enable Audio' : 'Retry Audio'}
          </button>
          
          {!isAudioContextError && (
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
            >
              Reload Page
            </button>
          )}
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-yellow-700 hover:text-yellow-800">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded border overflow-auto text-yellow-900">
              {JSON.stringify(serializeError(error), null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  };

  return (
    <ErrorBoundary fallback={AudioErrorFallback} onError={handleAudioError}>
      {children}
    </ErrorBoundary>
  );
};