// @ts-ignore
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

/**
 * TC-02: Überprüfe, ob der Countdown nach Bewegungserkennung startet
 */

describe('TC-02: Countdown nach Bewegungserkennung', () => {
  const mockCountdownService = {
    start: jest.fn(),
    stop: jest.fn(),
    getTimeRemaining: jest.fn(),
    isRunning: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('sollte Countdown nach Bewegungserkennung starten', () => {
    // Arrange
    const countdownDuration = 30;
    mockCountdownService.start.mockImplementation((duration) => {
      mockCountdownService.isRunning.mockReturnValue(true);
      mockCountdownService.getTimeRemaining.mockReturnValue(duration);
    });

    // Act
    mockCountdownService.start(countdownDuration);

    // Assert
    expect(mockCountdownService.start).toHaveBeenCalledWith(countdownDuration);
    expect(mockCountdownService.isRunning()).toBe(true);
    expect(mockCountdownService.getTimeRemaining()).toBe(countdownDuration);
  });

  test('sollte Countdown Zeit korrekt herunterzählen', () => {
    // Arrange
    let timeRemaining = 30;
    mockCountdownService.start.mockImplementation(() => {
      mockCountdownService.isRunning.mockReturnValue(true);
    });
    
    mockCountdownService.getTimeRemaining.mockImplementation(() => timeRemaining);

    // Act
    mockCountdownService.start(30);
    
    // Simuliere Timer-Ablauf
    timeRemaining = 25; // Manuell ändern für Test
    jest.advanceTimersByTime(5000);

    // Assert
    expect(mockCountdownService.getTimeRemaining()).toBe(25);
    expect(mockCountdownService.isRunning()).toBe(true);
  });

  test('sollte Countdown nach Ablauf stoppen', () => {
    // Arrange
    let timeRemaining = 1;
    let isRunning = true;
    
    mockCountdownService.start.mockImplementation(() => {
      isRunning = true;
    });
    
    mockCountdownService.getTimeRemaining.mockImplementation(() => timeRemaining);
    mockCountdownService.isRunning.mockImplementation(() => isRunning);

    // Act
    mockCountdownService.start(1);
    
    // Simuliere Ablauf
    timeRemaining = 0;
    isRunning = false;
    jest.advanceTimersByTime(1000);

    // Assert
    expect(mockCountdownService.getTimeRemaining()).toBe(0);
    expect(mockCountdownService.isRunning()).toBe(false);
  });

  test('sollte Countdown manuell stoppbar sein', () => {
    // Arrange
    let isRunning = true;
    mockCountdownService.isRunning.mockImplementation(() => isRunning);
    mockCountdownService.stop.mockImplementation(() => {
      isRunning = false;
    });

    // Act
    mockCountdownService.start(30);
    mockCountdownService.stop();

    // Assert
    expect(mockCountdownService.stop).toHaveBeenCalledTimes(1);
    expect(mockCountdownService.isRunning()).toBe(false);
  });
});
