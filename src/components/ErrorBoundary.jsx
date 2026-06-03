import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical UI Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-4">
            Interruption du <span className="text-[#D4AF37]">Système</span>
          </h1>
          <p className="text-zinc-500 max-w-md mb-8 font-medium">
            Une erreur critique est survenue dans l'interface. Nos ingénieurs ont été alertés.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 px-8 py-4 bg-[#D4AF37] text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-transform"
          >
            <RefreshCw size={18} /> Redémarrer l'interface
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
