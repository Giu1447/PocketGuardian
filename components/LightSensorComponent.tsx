
import { LightSensor } from 'expo-sensors';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const POCKET_THRESHOLD = 10; // lux
const TIME_IN_POCKET_THRESHOLD = 3000; // 3 seconds
const TIME_OUT_OF_POCKET_THRESHOLD = 2000; // 2 seconds

export default function LightSensorComponent() {
  const [lightLevel, setLightLevel] = useState(0);
  const [isPocketed, setIsPocketed] = useState(false);
  const [permission, setPermission] = useState<boolean | null>(null);

  useEffect(() => {
    let inPocketTimer: NodeJS.Timeout | null = null;
    let outOfPocketTimer: NodeJS.Timeout | null = null;

    const subscription = LightSensor.addListener(data => {
      setLightLevel(data.illuminance);

      if (data.illuminance < POCKET_THRESHOLD) {
        if (outOfPocketTimer) {
          clearTimeout(outOfPocketTimer);
          outOfPocketTimer = null;
        }
        if (!inPocketTimer && !isPocketed) {
          inPocketTimer = setTimeout(() => {
            setIsPocketed(true);
          }, TIME_IN_POCKET_THRESHOLD);
        }
      } else {
        if (inPocketTimer) {
          clearTimeout(inPocketTimer);
          inPocketTimer = null;
        }
        if (!outOfPocketTimer && isPocketed) {
          outOfPocketTimer = setTimeout(() => {
            setIsPocketed(false);
          }, TIME_OUT_OF_POCKET_THRESHOLD);
        }
      }
    });

    return () => {
      subscription.remove();
      if (inPocketTimer) clearTimeout(inPocketTimer);
      if (outOfPocketTimer) clearTimeout(outOfPocketTimer);
    };
  }, [isPocketed]);

  useEffect(() => {
    (async () => {
      const { status } = await LightSensor.requestPermissionsAsync();
      setPermission(status === 'granted');
    })();
  }, []);

  if (permission === null) {
    return <Text>Requesting sensor permission...</Text>;
  }
  if (permission === false) {
    return <Text>Permission for light sensor not granted.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Current Light Level: {lightLevel.toFixed(2)} lux</Text>
      <Text style={styles.status}>
        Is in Pocket? <Text style={styles.bold}>{isPocketed ? 'Yes' : 'No'}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    margin: 10,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
  status: {
    fontSize: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
});
