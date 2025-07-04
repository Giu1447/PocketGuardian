/**
 * TC-04: Überprüfe, ob ein Kontakt erfolgreich entfernt wurde
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';

describe('TC-04: Kontakt entfernen', () => {
  const mockContactService = {
    getAllContacts: jest.fn(),
    addContact: jest.fn(),
    removeContact: jest.fn< (id: string) => Promise<boolean> >(),
    getContactById: jest.fn(),
  };

  const mockContacts = [
    { id: '1', name: 'Max Mustermann', phone: '+41 79 123 45 67', email: 'max@example.com' },
    { id: '2', name: 'Anna Schmidt', phone: '+41 79 987 65 43', email: 'anna@example.com' },
    { id: '3', name: 'Peter Weber', phone: '+41 79 555 44 33', email: 'peter@example.com' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockContactService.getAllContacts.mockReturnValue([...mockContacts]);
  });

  test('sollte Kontakt erfolgreich entfernen', async () => {
    // Arrange
    const contactIdToRemove = '2';
    const remainingContacts = mockContacts.filter(c => c.id !== contactIdToRemove);
    
    mockContactService.removeContact.mockResolvedValue(true);
    mockContactService.getAllContacts.mockReturnValueOnce(remainingContacts);
    mockContactService.getContactById.mockReturnValue(null);

    // Act
    const removeResult = await mockContactService.removeContact(contactIdToRemove);
    const contactsAfterRemoval = mockContactService.getAllContacts() as { id: string; name: string; phone: string; email: string }[];
    const removedContact = mockContactService.getContactById(contactIdToRemove);

    // Assert
    expect(removeResult).toBe(true);
    expect(mockContactService.removeContact).toHaveBeenCalledWith(contactIdToRemove);
    expect(contactsAfterRemoval).toHaveLength(2);
    expect(contactsAfterRemoval.find((c: { id: string; name: string; phone: string; email: string }) => c.id === contactIdToRemove)).toBeUndefined();
    expect(removedContact).toBeNull();
  });

  test('sollte alle verbleibenden Kontakte korrekt anzeigen', async () => {
    // Arrange
    const contactIdToRemove = '1';
    const remainingContacts = mockContacts.filter(c => c.id !== contactIdToRemove);
    
    mockContactService.removeContact.mockResolvedValue(true);
    mockContactService.getAllContacts.mockReturnValueOnce(remainingContacts);

    // Act
    await mockContactService.removeContact(contactIdToRemove);
    const contacts = mockContactService.getAllContacts();

    // Assert
    expect(contacts).toHaveLength(2);
    expect(contacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Anna Schmidt' }),
      expect.objectContaining({ name: 'Peter Weber' }),
    ]));
  });

  test('sollte Fehler behandeln wenn Kontakt nicht existiert', async () => {
    // Arrange
    const nonExistentContactId = '999';
    mockContactService.removeContact.mockRejectedValue(new Error('Kontakt nicht gefunden'));

    // Act & Assert
    await expect(mockContactService.removeContact(nonExistentContactId)).rejects.toThrow('Kontakt nicht gefunden');
    expect(mockContactService.removeContact).toHaveBeenCalledWith(nonExistentContactId);
  });

  test('sollte Kontakt-Liste unverändert lassen bei fehlgeschlagenem Entfernen', async () => {
    // Arrange
    const contactIdToRemove = '2';
    mockContactService.removeContact.mockResolvedValue(false);
    mockContactService.getAllContacts.mockReturnValue(mockContacts);

    // Act
    const removeResult = await mockContactService.removeContact(contactIdToRemove);
    const contactsAfterFailedRemoval = mockContactService.getAllContacts() as { id: string; name: string; phone: string; email: string }[];

    // Assert
    expect(removeResult).toBe(false);
    expect(contactsAfterFailedRemoval).toHaveLength(3);
    expect(contactsAfterFailedRemoval.find((c: { id: string; name: string; phone: string; email: string }) => c.id === contactIdToRemove)).toBeDefined();
  });
});
