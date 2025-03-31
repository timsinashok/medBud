import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { storage, StorageKeys } from '../services/storage';

function ReportScreen() {
  const [symptoms, setSymptoms] = useState([]);
  const [medications, setMedications] = useState([]);
  const [report, setReport] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedSymptoms = await storage.load(StorageKeys.SYMPTOMS) || [];
    const savedMeds = await storage.load(StorageKeys.MEDICATIONS) || [];
    setSymptoms(savedSymptoms);
    setMedications(savedMeds);
  };

  const generateReport = () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const recentSymptoms = symptoms.filter(s => 
      new Date(s.timestamp) > lastWeek
    );

    const averageSeverity = recentSymptoms.length > 0
      ? recentSymptoms.reduce((acc, s) => acc + s.severity, 0) / recentSymptoms.length
      : 0;

    setReport({
      date: new Date(),
      symptomCount: recentSymptoms.length,
      averageSeverity: averageSeverity.toFixed(1),
      medicationCount: medications.length
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Button mode="contained" onPress={generateReport} style={styles.button}>
        Generate Weekly Report
      </Button>

      {report && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Health Report</Title>
            <Paragraph>Generated on: {report.date.toLocaleDateString()}</Paragraph>
            <Paragraph>Symptoms recorded: {report.symptomCount}</Paragraph>
            <Paragraph>Average severity: {report.averageSeverity}/10</Paragraph>
            <Paragraph>Active medications: {report.medicationCount}</Paragraph>
          </Card.Content>
        </Card>
      )}
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
    marginTop: 16,
  },
  button: {
    marginBottom: 16,
  },
});

export default ReportScreen; 