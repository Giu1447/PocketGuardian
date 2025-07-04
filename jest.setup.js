// Einfache Mock-Konfiguration ohne externe Dependencies

// Mock für React Native Module
global.Alert = {
  alert: jest.fn(),
};

global.Platform = {
  OS: 'ios',
};

global.Dimensions = {
  get: jest.fn(() => ({ width: 375, height: 667 })),
};

global.AppState = {
  currentState: 'active',
  addEventListener: jest.fn(),
};

// Mock für Expo Module
jest.mock('expo-router', () => ({
  Stack: ({ children }) => children,
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
}));

// Console warnings unterdrücken
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
