/**
 * Theme Provider - Vereinfacht für Stabilität
 */

import React, { ReactNode } from 'react';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <PaperProvider theme={MD3LightTheme}>
      {children}
    </PaperProvider>
  );
};

export default ThemeProvider;
