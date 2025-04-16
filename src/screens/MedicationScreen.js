import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Alert, View } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, IconButton, Snackbar, Portal, Dialog } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../services/api';
import { theme } from '../theme/theme';

// Temporary user ID - In a real app, this would come from authentication
const USER_ID = '67ebd559c9003543caba959c';

function MedicationScreen() {
  const [medications, setMedications] = useState([]);
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '', frequency: '', notes: '' });
  const [editingMedication, setEditingMedication] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const medicationsData = await api.getMedications(USER_ID);
      setMedications(medicationsData);
    } catch (error) {
      console.error('Error loading medications:', error);
      setError('Failed to load medications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addMedication = async () => {
    if (!newMedication.name || !newMedication.dosage) return;

    try {
      setIsLoading(true);
      setError(null);

      const medicationData = {
        user_id: USER_ID,
        name: newMedication.name,
        dosage: newMedication.dosage,
        frequency: newMedication.frequency || '',
        notes: newMedication.notes || ''
      };

      await api.createMedication(medicationData);
      await loadMedications();
      setNewMedication({ name: '', dosage: '', frequency: '', notes: '' });
    } catch (error) {
      console.error('Error adding medication:', error);
      setError('Failed to add medication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (medication) => {
    setEditingMedication({
      _id: medication._id,
      name: medication.name || '',
      dosage: medication.dosage || '',
      frequency: medication.frequency || '',
      notes: medication.notes || ''
    });
    setShowEditDialog(true);
  };

  const updateMedication = async () => {
    if (!editingMedication.name || !editingMedication.dosage) return;

    try {
      setIsLoading(true);
      setError(null);

      const medicationData = {
        name: editingMedication.name,
        dosage: editingMedication.dosage,
        frequency: editingMedication.frequency || '',
        notes: editingMedication.notes || ''
      };

      await api.updateMedication(editingMedication._id, medicationData, USER_ID);
      await loadMedications();
      setShowEditDialog(false);
      setEditingMedication(null);
    } catch (error) {
      console.error('Error updating medication:', error);
      setError('Failed to update medication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMedication = async (medicationId) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              setError(null);
              await api.deleteMedication(medicationId, USER_ID);
              await loadMedications();
            } catch (error) {
              console.error('Error deleting medication:', error);
              setError('Failed to delete medication. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.card}>
          <Card style={styles.cardContent}>
            <Card.Content>
              <Title style={styles.cardTitle}>Add New Medication</Title>
              <TextInput
                label="Medication Name"
                value={newMedication.name}
                onChangeText={text => setNewMedication({...newMedication, name: text})}
                style={styles.input}
                disabled={isLoading}
                accessibilityLabel="Enter medication name"
              />
              <TextInput
                label="Dosage"
                value={newMedication.dosage}
                onChangeText={text => setNewMedication({...newMedication, dosage: text})}
                style={styles.input}
                disabled={isLoading}
                accessibilityLabel="Enter dosage"
              />
              <TextInput
                label="Frequency"
                value={newMedication.frequency}
                onChangeText={text => setNewMedication({...newMedication, frequency: text})}
                style={styles.input}
                disabled={isLoading}
                accessibilityLabel="Enter frequency"
              />
              <TextInput
                label="Notes"
                value={newMedication.notes}
                onChangeText={text => setNewMedication({...newMedication, notes: text})}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.notesInput]}
                disabled={isLoading}
                accessibilityLabel="Enter medication notes"
              />
              <Button 
                mode="contained" 
                onPress={addMedication}
                loading={isLoading}
                disabled={isLoading || !newMedication.name || !newMedication.dosage}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                accessibilityLabel="Add new medication"
              >
                Add Medication
              </Button>
            </Card.Content>
          </Card>
        </Animated.View>

        {medications.map((medication, index) => (
          <Animated.View key={medication._id} entering={FadeInDown.duration(300).delay(100 + index * 50)} style={styles.card}>
            <Card style={styles.cardContent}>
              <Card.Content>
                <Title style={styles.cardTitle}>{medication.name}</Title>
                <Paragraph style={styles.details}>Dosage: {medication.dosage}</Paragraph>
                {medication.frequency && <Paragraph style={styles.details}>Frequency: {medication.frequency}</Paragraph>}
                {medication.notes && <Paragraph style={styles.details}>Notes: {medication.notes}</Paragraph>}
                <View style={styles.cardActions}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    iconColor={theme.colors.primary} // Updated prop
                    onPress={() => startEditing(medication)}
                    accessibilityLabel="Edit medication"
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor={theme.colors.error} // Updated prop
                    onPress={() => deleteMedication(medication._id)}
                    accessibilityLabel="Delete medication"
                  />
                </View>
              </Card.Content>
            </Card>
          </Animated.View>
        ))}
      </ScrollView>

      <Portal>
        <Animated.View entering={FadeInDown.duration(300)} exiting={FadeInDown.duration(300)}>
          <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)} style={styles.dialog}>
            <Dialog.Title style={styles.dialogTitle}>Edit Medication</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Medication Name"
                value={editingMedication?.name || ''}
                onChangeText={text => setEditingMedication({...editingMedication, name: text})}
                style={styles.input}
                disabled={isLoading}
                accessibilityLabel="Edit medication name"
              />
              <TextInput
                label="Dosage"
                value={editingMedication?.dosage || ''}
                onChangeText={text => setEditingMedication({...editingMedication, dosage: text})}
                style={styles.input}
                disabled={isLoading}
                accessibilityLabel="Edit dosage"
              />
              <TextInput
                label="Frequency"
                value={editingMedication?.frequency || ''}
                onChangeText={text => setEditingMedication({...editingMedication, frequency: text})}
                style={styles.input}
                disabled={isLoading}
                accessibilityLabel="Edit frequency"
              />
              <TextInput
                label="Notes"
                value={editingMedication?.notes || ''}
                onChangeText={text => setEditingMedication({...editingMedication, notes: text})}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.notesInput]}
                disabled={isLoading}
                accessibilityLabel="Edit medication notes"
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button 
                onPress={() => setShowEditDialog(false)}
                style={styles.dialogButton}
                labelStyle={styles.dialogButtonLabel}
                accessibilityLabel="Cancel edit"
              >
                Cancel
              </Button>
              <Button 
                onPress={updateMedication}
                loading={isLoading}
                disabled={isLoading || !editingMedication?.name || !editingMedication?.dosage}
                style={[styles.dialogButton, styles.saveButton]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.dialogButtonLabel}
                accessibilityLabel="Save medication changes"
              >
                Save
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Animated.View>
      </Portal>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        action={{
          label: 'Retry',
          onPress: () => loadMedications(),
        }}
        style={styles.snackbar}
      >
        {error}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  cardContent: {
    borderRadius: theme.roundness,
    elevation: 2,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.elevation.level2,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontFamily: theme.typography.title.fontFamily,
    fontWeight: theme.typography.title.fontWeight,
    fontSize: theme.typography.title.fontSize,
    color: theme.colors.text,
  },
  input: {
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
  },
  notesInput: {
    minHeight: 80,
  },
  button: {
    borderRadius: theme.roundness,
    elevation: 2,
    backgroundColor: theme.colors.primary,
  },
  buttonContent: {
    paddingVertical: theme.spacing.xs,
  },
  buttonLabel: {
    fontFamily: theme.typography.medium.fontFamily,
    fontSize: theme.typography.regular.fontSize,
  },
  cardActions: {
    position: 'absolute',
    right: theme.spacing.sm,
    top: theme.spacing.sm,
    flexDirection: 'row',
  },
  dialog: {
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
  },
  dialogTitle: {
    fontFamily: theme.typography.title.fontFamily,
    fontWeight: theme.typography.title.fontWeight,
    fontSize: theme.typography.title.fontSize,
    color: theme.colors.text,
  },
  dialogButton: {
    marginLeft: theme.spacing.sm,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
  },
  dialogButtonLabel: {
    fontFamily: theme.typography.medium.fontFamily,
    fontSize: theme.typography.regular.fontSize,
  },
  details: {
    fontFamily: theme.typography.regular.fontFamily,
    fontSize: theme.typography.regular.fontSize,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  snackbar: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.roundness,
  },
});

export default MedicationScreen;