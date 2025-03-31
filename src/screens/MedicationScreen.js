import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph } from 'react-native-paper';
import { storage, StorageKeys } from '../services/storage';

function MedicationScreen() {
  const [medications, setMedications] = useState([]);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    notes: ''
  });

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    const saved = await storage.load(StorageKeys.MEDICATIONS) || [];
    setMedications(saved);
  };

  const addMedication = async () => {
    if (!newMedication.name || !newMedication.dosage) return;

    const medication = {
      id: Date.now().toString(),
      ...newMedication,
      timestamp: new Date()
    };

    const updatedMedications = [medication, ...medications];
    await storage.save(StorageKeys.MEDICATIONS, updatedMedications);
    setMedications(updatedMedications);
    setNewMedication({ name: '', dosage: '', frequency: '', notes: '' });
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
          />
          <TextInput
            label="Dosage"
            value={newMedication.dosage}
            onChangeText={text => setNewMedication({...newMedication, dosage: text})}
            style={styles.input}
          />
          <TextInput
            label="Frequency"
            value={newMedication.frequency}
            onChangeText={text => setNewMedication({...newMedication, frequency: text})}
            style={styles.input}
          />
          <TextInput
            label="Notes"
            value={newMedication.notes}
            onChangeText={text => setNewMedication({...newMedication, notes: text})}
            multiline
            style={styles.input}
          />
          <Button mode="contained" onPress={addMedication}>
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
          </Card.Content>
        </Card>
      ))}
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
});

export default MedicationScreen; 