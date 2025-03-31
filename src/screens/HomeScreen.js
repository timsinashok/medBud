import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { storage, StorageKeys } from '../services/storage';

function HomeScreen() {
  const [recentSymptoms, setRecentSymptoms] = useState([]);
  const [medications, setMedications] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const symptoms = await storage.load(StorageKeys.SYMPTOMS) || [];
    const meds = await storage.load(StorageKeys.MEDICATIONS) || [];
    setRecentSymptoms(symptoms.slice(0, 5));
    setMedications(meds);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Welcome to MEDBUD</Title>
          <Paragraph>Your personal health tracking assistant</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Symptoms</Title>
          {recentSymptoms.map(symptom => (
            <Paragraph key={symptom.id}>
              {symptom.name} - Severity: {symptom.severity}
            </Paragraph>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Your Medications</Title>
          {medications.map(med => (
            <Paragraph key={med.id}>
              {med.name} - {med.dosage}
            </Paragraph>
          ))}
        </Card.Content>
      </Card>
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
});

export default HomeScreen; 