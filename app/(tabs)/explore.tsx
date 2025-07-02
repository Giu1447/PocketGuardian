/**
 * Settings Screen - Einstellungsseite der PocketGuardian App (Expo Router)
 */

import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
    Button,
    Card,
    Divider,
    IconButton,
    SegmentedButtons,
    Switch,
    Text,
    TextInput,
    useTheme
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { emailService, sensorService } from '../../src/services';
import { AppSettings, EmergencyContact, SensorSettings } from '../../src/types';
import { generateId, isValidEmail, isValidPhoneNumber } from '../../src/utils/helpers';

// Dark Mode entfernt - war nicht zuverlässig
const useAppTheme = () => {
  return { isDarkMode: false, toggleTheme: () => {} };
};

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isDarkMode, toggleTheme } = useAppTheme();
  
  // Einstellungen State (würde normalerweise aus AsyncStorage geladen)
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: isDarkMode,
    emergencyContacts: [
      {
        id: '1',
        name: 'Notfallkontakt 1',
        phone: '+49123456789',
        email: 'notfall@example.com'
      }
    ],
    sensorSettings: {
      threshold: 1.0,
      isEnabled: true,
      sensitivity: 'medium'
    },
    autoCapture: true
  });

  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState<string>('');

  useEffect(() => {
    // In einer echten App würden Einstellungen aus AsyncStorage geladen
    console.log('Settings loaded:', settings);
  }, []);

  /**
   * Speichert die Einstellungen
   */
  const saveSettings = async (newSettings: AppSettings) => {
    try {
      // In einer echten App würden Einstellungen in AsyncStorage gespeichert
      setSettings(newSettings);
      
      // Sensor-Einstellungen aktualisieren
      sensorService.updateSettings(newSettings.sensorSettings);
      
      console.log('Settings saved:', newSettings);
    } catch (error) {
      console.error('Fehler beim Speichern der Einstellungen:', error);
      Alert.alert('Fehler', 'Einstellungen konnten nicht gespeichert werden');
    }
  };

  /**
   * Dark Mode entfernt - war nicht zuverlässig
   */

  /**
   * Auto-Capture umschalten
   */
  const toggleAutoCapture = () => {
    const newSettings = {
      ...settings,
      autoCapture: !settings.autoCapture
    };
    saveSettings(newSettings);
  };

  /**
   * Sensor-Einstellungen aktualisieren
   */
  const updateSensorSettings = (newSensorSettings: Partial<SensorSettings>) => {
    const updatedSettings = {
      ...settings,
      sensorSettings: {
        ...settings.sensorSettings,
        ...newSensorSettings
      }
    };
    saveSettings(updatedSettings);
  };

  /**
   * Neuen Notfallkontakt hinzufügen
   */
  const addEmergencyContact = () => {
    if (!newContactName.trim()) {
      Alert.alert('Fehler', 'Name ist erforderlich');
      return;
    }

    if (!newContactPhone.trim() || !isValidPhoneNumber(newContactPhone)) {
      Alert.alert('Fehler', 'Gültige Telefonnummer ist erforderlich');
      return;
    }

    if (newContactEmail.trim() && !isValidEmail(newContactEmail)) {
      Alert.alert('Fehler', 'Gültige E-Mail-Adresse ist erforderlich');
      return;
    }

    const newContact: EmergencyContact = {
      id: generateId(),
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      email: newContactEmail.trim() || undefined
    };

    const newSettings = {
      ...settings,
      emergencyContacts: [...settings.emergencyContacts, newContact]
    };

    saveSettings(newSettings);

    // Eingabefelder zurücksetzen
    setNewContactName('');
    setNewContactPhone('');
    setNewContactEmail('');

    Alert.alert('Erfolg', 'Notfallkontakt hinzugefügt');
  };

  /**
   * Notfallkontakt entfernen
   */
  const removeEmergencyContact = (contactId: string) => {
    Alert.alert(
      'Kontakt entfernen',
      'Möchten Sie diesen Notfallkontakt wirklich entfernen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Entfernen',
          onPress: () => {
            const newSettings = {
              ...settings,
              emergencyContacts: settings.emergencyContacts.filter(c => c.id !== contactId)
            };
            saveSettings(newSettings);
          }
        }
      ]
    );
  };

  /**
   * Test-E-Mail senden
   */
  const sendTestEmail = async (contact: EmergencyContact) => {
    if (!contact.email) {
      Alert.alert('Fehler', 'Keine E-Mail-Adresse für diesen Kontakt hinterlegt');
      return;
    }

    try {
      setTestEmailStatus('Sende Test-E-Mail...');
      
      const success = await emailService.sendTestEmail(contact.email);
      
      if (success) {
        setTestEmailStatus('Test-E-Mail erfolgreich gesendet!');
        Alert.alert('Erfolg', `Test-E-Mail an ${contact.name} gesendet`);
      } else {
        setTestEmailStatus('Fehler beim Senden der Test-E-Mail');
        Alert.alert('Fehler', 'Test-E-Mail konnte nicht gesendet werden');
      }
    } catch (error) {
      console.error('Feher beim Senden der Test-E-Mail:', error);
      setTestEmailStatus('Fehler beim Senden der Test-E-Mail');
      Alert.alert('Fehler', 'Test-E-Mail konnte nicht gesendet werden');
    }

    // Status nach 3 Sekunden zurücksetzen
    setTimeout(() => setTestEmailStatus(''), 3000);
  };

  return (
    <ScrollView style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }
    ]}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            ⚙️ Einstellungen
          </Text>
        </Card.Content>
      </Card>

      {/* App-Einstellungen */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            App-Einstellungen
          </Text>
          
          {/* Dark Mode entfernt - war nicht zuverlässig */}

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text variant="bodyMedium">📸 Auto-Aufnahme</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Automatische Fotoaufnahme bei Bewegung
              </Text>
            </View>
            <Switch
              value={settings.autoCapture}
              onValueChange={toggleAutoCapture}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Sensor-Einstellungen */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            🔧 Sensor-Einstellungen
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text variant="bodyMedium">Sensor aktiviert</Text>
            </View>
            <Switch
              value={settings.sensorSettings.isEnabled}
              onValueChange={(value) => updateSensorSettings({ isEnabled: value })}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text variant="bodyMedium" style={styles.settingLabel}>
                Empfindlichkeit
              </Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Niedrig: weniger empfindlich, weniger Fehlalarme{'\n'}
                Hoch: sehr empfindlich, mehr Erkennungen
              </Text>
            </View>
          </View>
          <SegmentedButtons
            value={settings.sensorSettings.sensitivity}
            onValueChange={(value) => updateSensorSettings({ sensitivity: value as 'low' | 'medium' | 'high' })}
            buttons={[
              { value: 'low', label: 'Niedrig' },
              { value: 'medium', label: 'Mittel' },
              { value: 'high', label: 'Hoch' }
            ]}
            style={styles.segmentedButtons}
          />

          <Divider style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text variant="bodyMedium" style={styles.settingLabel}>
                Schwellenwert: {settings.sensorSettings.threshold.toFixed(1)}
              </Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Höherer Wert = weniger empfindlich (1.0 - 5.0)
              </Text>
            </View>
          </View>
          <Slider
            style={styles.segmentedButtons}
            minimumValue={1.0}
            maximumValue={5.0}
            step={0.1}
            value={settings.sensorSettings.threshold}
            onValueChange={(value) => updateSensorSettings({ threshold: value })}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.outline}
          />
        </Card.Content>
      </Card>

      {/* Notfallkontakte */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            🚨 Notfallkontakte
          </Text>

          {/* Bestehende Kontakte */}
          {settings.emergencyContacts.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <View style={styles.contactItemRow}>
                <View style={styles.contactInfo}>
                  <Text variant="bodyMedium" style={styles.contactName}>
                    {contact.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.contactPhone}>
                    📞 {contact.phone}
                  </Text>
                  {contact.email && (
                    <Text variant="bodySmall" style={styles.contactEmail}>
                      📧 {contact.email}
                    </Text>
                  )}
                </View>
                <View style={styles.contactActions}>
                  {contact.email && (
                    <IconButton
                      icon="email-send"
                      mode="contained-tonal"
                      size={20}
                      onPress={() => sendTestEmail(contact)}
                    />
                  )}
                  <IconButton
                    icon="delete"
                    mode="contained-tonal"
                    size={20}
                    onPress={() => removeEmergencyContact(contact.id)}
                  />
                </View>
              </View>
            </View>
          ))}

          {/* Test-E-Mail Status */}
          {testEmailStatus && (
            <Text variant="bodySmall" style={styles.testEmailStatus}>
              {testEmailStatus}
            </Text>
          )}

          <Divider style={styles.divider} />

          {/* Neuen Kontakt hinzufügen */}
          <Text variant="titleSmall" style={styles.addContactTitle}>
            Neuen Kontakt hinzufügen
          </Text>

          <TextInput
            label="Name"
            value={newContactName}
            onChangeText={setNewContactName}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Telefonnummer"
            value={newContactPhone}
            onChangeText={setNewContactPhone}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
            placeholder="+49123456789"
          />

          <TextInput
            label="E-Mail-Adresse (optional)"
            value={newContactEmail}
            onChangeText={setNewContactEmail}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            placeholder="notfall@example.com"
          />

          <Button
            mode="contained"
            onPress={addEmergencyContact}
            style={styles.addButton}
            icon="plus"
          >
            Kontakt hinzufügen
          </Button>
        </Card.Content>
      </Card>

      {/* Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.infoTitle}>
            ℹ️ Information
          </Text>
          <Text variant="bodySmall" style={styles.infoText}>
            Notfallkontakte werden bei erkannter Bewegung automatisch benachrichtigt.
            {'\n\n'}
            Mit einer E-Mail-Adresse können auch E-Mail-Benachrichtigungen mit Fotos gesendet werden.
            {'\n\n'}
            Verwenden Sie die Test-E-Mail-Funktion, um die Konfiguration zu überprüfen.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  headerCard: {
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    minHeight: 50,
  },
  settingLeft: {
    flex: 1,
    paddingRight: 12,
  },
  settingLabel: {
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  settingDescription: {
    opacity: 0.7,
    marginTop: 2,
    fontSize: 12,
    flexWrap: 'wrap',
  },
  divider: {
    marginVertical: 12,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'column',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  contactItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contactInfo: {
    flex: 1,
    paddingRight: 8,
  },
  contactName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  contactPhone: {
    opacity: 0.8,
    marginTop: 2,
    fontSize: 14,
  },
  contactEmail: {
    opacity: 0.8,
    marginTop: 2,
    fontSize: 14,
  },
  contactActions: {
    flexDirection: 'row',
    flexShrink: 0,
  },
  testEmailStatus: {
    textAlign: 'center',
    marginVertical: 8,
    fontStyle: 'italic',
  },
  addContactTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 8,
  },
  addButton: {
    marginTop: 8,
  },
  infoTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  infoText: {
    lineHeight: 20,
    opacity: 0.8,
  },
});
