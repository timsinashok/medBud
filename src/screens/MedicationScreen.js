import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, IconButton, Snackbar } from 'react-native-paper';
import { api } from '../services/api';

// Temporary user ID - In a real app, this would come from authentication
const USER_ID = '67ebd559c9003543caba959c';

function MedicationScreen() {
  const [medications, setMedications] = useState([]);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setIsLoading(true);
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
        userId: USER_ID,
        name: newMedication.name,
        dosage: newMedication.dosage,
        frequency: newMedication.frequency,
        notes: newMedication.notes,
        timestamp: new Date().toISOString()
      };

      const createdMedication = await api.createMedication(medicationData);
      setMedications([createdMedication, ...medications]);
      setNewMedication({ name: '', dosage: '', frequency: '', notes: '' });
    } catch (error) {
      console.error('Error adding medication:', error);
      setError('Failed to add medication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMedication = async (medicationId) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              setError(null);
              await api.deleteMedication(medicationId);
              setMedications(medications.filter(med => med.id !== medicationId));
            } catch (error) {
              console.error('Error deleting medication:', error);
              setError('Failed to delete medication. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Add New Medication</Title>
          <TextInput
            label="Medication Name"
            value={newMedication.name}
            onChangeText={text => setNewMedication({...newMedication, name: text})}
            style={styles.input}
            disabled={isLoading}
          />
          <TextInput
            label="Dosage"
            value={newMedication.dosage}
            onChangeText={text => setNewMedication({...newMedication, dosage: text})}
            style={styles.input}
            disabled={isLoading}
          />
          <TextInput
            label="Frequency"
            value={newMedication.frequency}
            onChangeText={text => setNewMedication({...newMedication, frequency: text})}
            style={styles.input}
            disabled={isLoading}
          />
          <TextInput
            label="Notes"
            value={newMedication.notes}
            onChangeText={text => setNewMedication({...newMedication, notes: text})}
            multiline
            style={styles.input}
            disabled={isLoading}
          />
          <Button 
            mode="contained" 
            onPress={addMedication}
            loading={isLoading}
            disabled={isLoading || !newMedication.name || !newMedication.dosage}
          >
            Add Medication
          </Button>
        </Card.Content>
      </Card>

      {medications.map(medication => (
        <Card key={medication.id} style={styles.card}>
          <Card.Content>
            <Title>{medication.name}</Title>
            <Paragraph>Dosage: {medication.dosage}</Paragraph>
            <Paragraph>Frequency: {medication.frequency}</Paragraph>
            {medication.notes && <Paragraph>Notes: {medication.notes}</Paragraph>}
            <IconButton
              icon="delete"
              size={20}
              onPress={() => deleteMedication(medication.id)}
              style={styles.deleteButton}
            />
          </Card.Content>
        </Card>
      ))}

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        action={{
          label: 'Dismiss',
          onPress: () => setError(null),
        }}
      >
        {error}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 10,
  },
  deleteButton: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
});

export default MedicationScreen; 