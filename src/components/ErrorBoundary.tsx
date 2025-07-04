/**
 * Error Boundary für PocketGuardian
 * Verhindert App-Abstürze bei unerwarteten Fehlern
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Surface } from 'react-native-paper';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('❌ Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    this.setState({
      hasError: true,
      error,
      errorInfo
    });
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={{ overflow: 'hidden', borderRadius: 8 }}>
            <Surface style={styles.errorContainer}>
              <Text style={styles.title}>🛡️ PocketGuardian</Text>
              <Text style={styles.errorTitle}>⚠️ Unerwarteter Fehler</Text>
              <Text style={styles.errorMessage}>
                Ein Fehler ist aufgetreten, aber die App ist noch funktionsfähig.
              </Text>
              
              {__DEV__ && (
                <View style={styles.debugContainer}>
                  <Text style={styles.debugTitle}>Debug-Info:</Text>
                  <Text style={styles.debugText}>
                    {this.state.error?.toString()}
                  </Text>
                </View>
              )}
              
              <Button
                mode="contained"
                onPress={this.handleRestart}
                style={styles.restartButton}
              >
                App neu starten
              </Button>
            </Surface>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorContainer: {
    padding: 30,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#d32f2f',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  debugContainer: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
  },
  restartButton: {
    marginTop: 20,
    minWidth: 200,
  },
});

export default ErrorBoundary;
