/**
 * Settings Screen - Einstellungen der App
 */

import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
    Button,
    Card,
    Divider,
    IconButton,
    List,
    SegmentedButtons,
    Switch,
    Text,
    TextInput,
    useTheme
} from 'react-native-paper';
import { emailService, sensorService } from '../services';
import { AppSettings, EmergencyContact, SensorSettings } from '../types';
import { generateId, isValidEmail, isValidPhoneNumber } from '../utils/helpers';

interface SettingsScreenProps {
  navigation: any;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const theme = useTheme();
  
  // Einstellungen State (würde normalerweise aus AsyncStorage geladen)
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: false,
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
  const [showAddContact, setShowAddContact] = useState(false);

  useEffect(() => {
    // Lade Einstellungen
    loadSettings();
  }, []);

  /**
   * Lädt Einstellungen (Platzhalter für AsyncStorage)
   */
  const loadSettings = async () => {
    try {
      // Hier würde AsyncStorage.getItem() verwendet
      console.log('Einstellungen geladen');
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
    }
  };

  /**
   * Speichert Einstellungen (Platzhalter für AsyncStorage)
   */
  const saveSettings = async (newSettings: AppSettings) => {
    try {
      setSettings(newSettings);
      // Hier würde AsyncStorage.setItem() verwendet
      console.log('Einstellungen gespeichert:', newSettings);
      
      // Aktualisiere Sensor-Service
      sensorService.updateSettings(newSettings.sensorSettings);
      
    } catch (error) {
      console.error('Fehler beim Speichern der Einstellungen:', error);
      Alert.alert('Fehler', 'Einstellungen konnten nicht gespeichert werden');
    }
  };

  /**
   * Dark Mode umschalten
   */
  const toggleDarkMode = () => {
    const newSettings = {
      ...settings,
      darkMode: !settings.darkMode
    };
    saveSettings(newSettings);
  };

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
   * Sensor-Aktivierung umschalten
   */
  const toggleSensorEnabled = () => {
    const newSensorSettings: SensorSettings = {
      ...settings.sensorSettings,
      isEnabled: !settings.sensorSettings.isEnabled
    };
    
    const newSettings = {
      ...settings,
      sensorSettings: newSensorSettings
    };
    saveSettings(newSettings);
  };

  /**
   * Sensor-Empfindlichkeit ändern
   */
  const changeSensitivity = (sensitivity: 'low' | 'medium' | 'high') => {
    const newSensorSettings: SensorSettings = {
      ...settings.sensorSettings,
      sensitivity
    };
    
    const newSettings = {
      ...settings,
      sensorSettings: newSensorSettings
    };
    saveSettings(newSettings);
  };

  /**
   * Notfallkontakt hinzufügen
   */
  const addEmergencyContact = () => {
    if (!newContactName.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Namen ein');
      return;
    }

    if (!isValidPhoneNumber(newContactPhone)) {
      Alert.alert('Fehler', 'Bitte geben Sie eine gültige Telefonnummer ein');
      return;
    }

    if (newContactEmail && !isValidEmail(newContactEmail)) {
      Alert.alert('Fehler', 'Bitte geben Sie eine gültige E-Mail-Adresse ein');
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

    // Felder zurücksetzen
    setNewContactName('');
    setNewContactPhone('');
    setNewContactEmail('');
    setShowAddContact(false);

    Alert.alert('Erfolg', 'Notfallkontakt wurde hinzugefügt');
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
          style: 'destructive',
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
   * Test-E-Mail an einen Kontakt senden
   */
  const sendTestEmail = async (contact: EmergencyContact) => {
    if (!contact.email) {
      Alert.alert('Fehler', 'Dieser Kontakt hat keine E-Mail-Adresse');
      return;
    }

    try {
      const success = await emailService.sendTestEmail(contact.email);
      if (success) {
        Alert.alert(
          'Test-E-Mail gesendet',
          `Eine Test-E-Mail wurde an ${contact.email} gesendet.`
        );
      } else {
        Alert.alert(
          'Fehler',
          'Die Test-E-Mail konnte nicht gesendet werden.'
        );
      }
    } catch (error) {
      console.error('Fehler beim Senden der Test-E-Mail:', error);
      Alert.alert(
        'Fehler',
        'Ein Fehler ist beim Senden der Test-E-Mail aufgetreten.'
      );
    }
  };

  /**
   * Alle Einstellungen zurücksetzen
   */
  const resetSettings = () => {
    Alert.alert(
      'Einstellungen zurücksetzen',
      'Möchten Sie alle Einstellungen auf die Standardwerte zurücksetzen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Zurücksetzen',
          style: 'destructive',
          onPress: () => {
            const defaultSettings: AppSettings = {
              darkMode: false,
              emergencyContacts: [],
              sensorSettings: {
                threshold: 1.0,
                isEnabled: true,
                sensitivity: 'medium'
              },
              autoCapture: true
            };
            saveSettings(defaultSettings);
            Alert.alert('Erfolg', 'Einstellungen wurden zurückgesetzt');
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* App-Einstellungen */}
      <Card style={styles.card}>
        <Card.Title title="📱 App-Einstellungen" />
        <Card.Content>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">Dark Mode</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Dunkles Design verwenden
              </Text>
            </View>
            <Switch value={settings.darkMode} onValueChange={toggleDarkMode} />
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">Auto-Capture</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Automatisch Fotos bei Bewegung aufnehmen
              </Text>
            </View>
            <Switch value={settings.autoCapture} onValueChange={toggleAutoCapture} />
          </View>
        </Card.Content>
      </Card>

      {/* Sensor-Einstellungen */}
      <Card style={styles.card}>
        <Card.Title title="📡 Sensor-Einstellungen" />
        <Card.Content>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">Bewegungserkennung</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Sensor für Bewegungserkennung aktivieren
              </Text>
            </View>
            <Switch 
              value={settings.sensorSettings.isEnabled} 
              onValueChange={toggleSensorEnabled} 
            />
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.settingGroup}>
            <Text variant="bodyLarge" style={styles.settingLabel}>
              Empfindlichkeit
            </Text>
            <Text variant="bodySmall" style={styles.settingDescription}>
              Bestimmt, wie empfindlich die Bewegungserkennung reagiert
            </Text>
            <SegmentedButtons
              value={settings.sensorSettings.sensitivity}
              onValueChange={changeSensitivity}
              buttons={[
                { value: 'low', label: 'Niedrig' },
                { value: 'medium', label: 'Mittel' },
                { value: 'high', label: 'Hoch' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Notfallkontakte */}
      <Card style={styles.card}>
        <Card.Title 
          title="🚨 Notfallkontakte" 
          right={(props) => (
            <IconButton
              {...props}
              icon="plus"
              onPress={() => setShowAddContact(!showAddContact)}
            />
          )}
        />
        <Card.Content>
          {settings.emergencyContacts.length === 0 ? (
            <Text variant="bodyMedium" style={styles.emptyText}>
              Keine Notfallkontakte konfiguriert
            </Text>
          ) : (
            settings.emergencyContacts.map((contact) => (
              <View key={contact.id}>
                <List.Item
                  title={contact.name}
                  description={`📞 ${contact.phone}${contact.email ? ` • 📧 ${contact.email}` : ''}`}
                  left={(props) => <List.Icon {...props} icon="account" />}
                  right={(props) => (
                    <View style={styles.contactActions}>
                      {contact.email && (
                        <IconButton
                          {...props}
                          icon="email-outline"
                          onPress={() => sendTestEmail(contact)}
                        />
                      )}
                      <IconButton
                        {...props}
                        icon="delete"
                        onPress={() => removeEmergencyContact(contact.id)}
                      />
                    </View>
                  )}
                />
              </View>
            ))
          )}
          
          {showAddContact && (
            <View style={styles.addContactForm}>
              <Divider style={styles.divider} />
              <Text variant="titleSmall" style={styles.formTitle}>
                Neuen Kontakt hinzufügen
              </Text>
              
              <TextInput
                label="Name *"
                value={newContactName}
                onChangeText={setNewContactName}
                style={styles.input}
                mode="outlined"
              />
              
              <TextInput
                label="Telefonnummer *"
                value={newContactPhone}
                onChangeText={setNewContactPhone}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
                placeholder="+49123456789"
              />
              
              <TextInput
                label="E-Mail (Optional)"
                value={newContactEmail}
                onChangeText={setNewContactEmail}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                placeholder="email@example.com"
              />
              
              <View style={styles.formButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setShowAddContact(false)}
                  style={styles.formButton}
                >
                  Abbrechen
                </Button>
                <Button
                  mode="contained"
                  onPress={addEmergencyContact}
                  style={styles.formButton}
                >
                  Hinzufügen
                </Button>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Aktionen */}
      <Card style={styles.card}>
        <Card.Title title="⚙️ Aktionen" />
        <Card.Content>
          <Button
            mode="outlined"
            onPress={resetSettings}
            style={styles.actionButton}
            icon="restore"
          >
            Einstellungen zurücksetzen
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingDescription: {
    opacity: 0.7,
    marginTop: 2,
  },
  settingGroup: {
    paddingVertical: 8,
  },
  settingLabel: {
    marginBottom: 4,
  },
  segmentedButtons: {
    marginTop: 12,
  },
  divider: {
    marginVertical: 12,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    padding: 20,
  },
  addContactForm: {
    marginTop: 8,
  },
  formTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  formButton: {
    marginLeft: 8,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginBottom: 8,
  },
  bottomSpacer: {
    height: 80,
  },
});
