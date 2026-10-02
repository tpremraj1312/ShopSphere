import React from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#EAEDED] text-[#0F1111] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#D5D9D9] rounded-[4px] p-8 shadow-sm text-center">
            <div className="w-14 h-14 bg-[#FFF0F0] border border-[#B12704]/20 rounded-full flex items-center justify-center mx-auto mb-4 text-[#B12704]">
              <AlertTriangle size={28} strokeWidth={2} />
            </div>
            <h1 className="text-[22px] font-semibold text-[#0F1111] mb-2">
              Something went wrong
            </h1>
            <p className="text-[#565959] text-[13px] mb-6 leading-relaxed">
              An unexpected error occurred. You can try refreshing the page or return to the store homepage.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 bg-white hover:bg-[#F7FAFA] text-[#0F1111] text-[13px] font-medium rounded-[3px] transition-colors border border-[#D5D9D9]"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2 bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] text-[13px] font-semibold rounded-[3px] transition-colors border border-[#FCD200]"
              >
                Return to Store
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
