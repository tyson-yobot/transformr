// =============================================================================
// TRANSFORMR -- ErrorBoundary
// Class-based error boundary for app-level and section-level error containment.
// Usage:
//   App-level:     <ErrorBoundary> ... </ErrorBoundary>
//   Section-level: <ErrorBoundary sectionName="AI Insight"> ... </ErrorBoundary>
//   Custom UI:     <ErrorBoundary fallback={<MyFallback />}> ... </ErrorBoundary>
// =============================================================================

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
  /** Custom fallback UI — overrides both section and full-screen defaults. */
  fallback?: ReactNode;
  /** When provided, renders a compact inline error instead of full-screen. */
  sectionName?: string;
  /** Optional callback for crash reporting (wire to Sentry in a future session). */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error.message, info.componentStack);
    this.props.onError?.(error, info);
  }

  private reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    if (this.props.sectionName) {
      return (
        <View style={s.section}>
          <Text style={s.sectionText}>{this.props.sectionName} failed to load</Text>
          <TouchableOpacity onPress={this.reset} accessibilityRole="button" accessibilityLabel="Retry">
            <Text style={s.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={s.full}>
        <Text style={s.title}>Something went wrong</Text>
        <Text style={s.sub}>
          {__DEV__ ? this.state.error?.message : 'Please restart the app'}
        </Text>
        <TouchableOpacity style={s.btn} onPress={this.reset} accessibilityRole="button" accessibilityLabel="Try Again">
          <Text style={s.btnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const s = StyleSheet.create({
  section: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.20)',
  },
  sectionText: { color: '#EF4444', fontSize: 13 },
  retry:       { color: '#A855F7', fontSize: 13, fontWeight: '600' },
  full: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C0A15',
    padding: 32,
    gap: 16,
  },
  title:   { color: '#F0F0FC', fontSize: 20, fontWeight: '700' },
  sub:     { color: '#9B8FC0', fontSize: 14, textAlign: 'center' },
  btn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#A855F7',
    borderRadius: 12,
  },
  btnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
});
