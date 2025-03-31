import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph } from 'react-native-paper';
import { storage, StorageKeys } from '../services/storage';

function SymptomScreen() {
  const [symptoms, setSymptoms] = useState([]);
  const [newSymptom, setNewSymptom] = useState({
    name: '',
    severity: '',
    notes: ''
  });

  useEffect(() => {
    loadSymptoms();
  }, []);

  const loadSymptoms = async () => {
    const saved = await storage.load(StorageKeys.SYMPTOMS) || [];
    setSymptoms(saved);
  };

  const addSymptom = async () => {
    if (!newSymptom.name || !newSymptom.severity) return;

    const symptom = {
      id: Date.now().toString(),
      ...newSymptom,
      timestamp: new Date(),
      severity: parseInt(newSymptom.severity)
    };

    const updatedSymptoms = [symptom, ...symptoms];
    await storage.save(StorageKeys.SYMPTOMS, updatedSymptoms);
    setSymptoms(updatedSymptoms);
    setNewSymptom({ name: '', severity: '', notes: '' });
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Log New Symptom</Title>
          <TextInput
            label="Symptom Name"
            value={newSymptom.name}
            onChangeText={text => setNewSymptom({...newSymptom, name: text})}
            style={styles.input}
          />
          <TextInput
            label="Severity (1-10)"
            value={newSymptom.severity}
            onChangeText={text => setNewSymptom({...newSymptom, severity: text})}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            label="Notes"
            value={newSymptom.notes}
            onChangeText={text => setNewSymptom({...newSymptom, notes: text})}
            multiline
            style={styles.input}
          />
          <Button mode="contained" onPress={addSymptom}>
            Add Symptom
          </Button>
        </Card.Content>
      </Card>

      {symptoms.map(symptom => (
        <Card key={symptom.id} style={styles.card}>
          <Card.Content>
            <Title>{symptom.name}</Title>
            <Paragraph>Severity: {symptom.severity}/10</Paragraph>
            <Paragraph>Date: {new Date(symptom.timestamp).toLocaleDateString()}</Paragraph>
            {symptom.notes && <Paragraph>Notes: {symptom.notes}</Paragraph>}
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

export default SymptomScreen; 