import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught render error in App:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="site-container p-6">
          <div className="bg-white rounded-lg shadow p-6 text-red-700">
            <h2 className="text-xl font-semibold mb-2">Terjadi kesalahan saat merender aplikasi</h2>
            <pre className="whitespace-pre-wrap text-sm bg-red-50 p-3 rounded">{String(this.state.error)}</pre>
            <p className="mt-3 text-sm text-gray-600">Lihat console browser untuk detail stack trace.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
