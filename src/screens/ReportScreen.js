import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Dimensions, Linking } from 'react-native';
import { Button, Card, Title, Paragraph, Portal, Modal, ActivityIndicator } from 'react-native-paper';
import { api } from '../services/api';

// Temporary user ID - In a real app, this would come from authentication
const USER_ID = '67ebd559c9003543caba959c';

function ReportScreen() {
  const [symptoms, setSymptoms] = useState([]);
  const [medications, setMedications] = useState([]);
  const [report, setReport] = useState(null);
  const [pdfReport, setPdfReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [symptomsData, medicationsData] = await Promise.all([
        api.getSymptoms(USER_ID),
        api.getMedications(USER_ID)
      ]);
      setSymptoms(symptomsData);
      setMedications(medicationsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please try again.');
    }
  };

  const generateReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const reportData = await api.generateReport(USER_ID);
      setReport({
        date: new Date(),
        ...reportData
      });
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePdfReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const pdfData = await api.generatePdfReport(USER_ID);
      setPdfReport({
        url: pdfData.url,
        generatedAt: new Date()
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const viewPdf = async () => {
    if (pdfReport?.url) {
      try {
        await Linking.openURL(pdfReport.url);
      } catch (error) {
        console.error('Error opening PDF:', error);
        setError('Failed to open PDF. Please try again.');
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      {error && (
        <Card style={[styles.card, styles.errorCard]}>
          <Card.Content>
            <Paragraph style={styles.errorText}>{error}</Paragraph>
          </Card.Content>
        </Card>
      )}

      <Button 
        mode="contained" 
        onPress={generateReport} 
        style={styles.button}
        loading={isLoading && !pdfReport}
        disabled={isLoading}
      >
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

      <Button 
        mode="contained" 
        onPress={generatePdfReport} 
        style={styles.button}
        loading={isLoading && !report}
        disabled={isLoading}
      >
        Generate PDF Report
      </Button>

      {pdfReport && (
        <Card style={styles.card} onPress={viewPdf}>
          <Card.Content>
            <Title>PDF Health Report</Title>
            <Paragraph>Generated on: {pdfReport.generatedAt.toLocaleDateString()}</Paragraph>
            <Paragraph>Click to view the full PDF report</Paragraph>
          </Card.Content>
        </Card>
      )}

      <Portal>
        <Modal
          visible={showPdfModal}
          onDismiss={() => setShowPdfModal(false)}
          contentContainerStyle={styles.modal}
        >
          <ActivityIndicator size="large" />
        </Modal>
      </Portal>
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
  errorCard: {
    backgroundColor: '#ffebee',
  },
  errorText: {
    color: '#c62828',
  },
  button: {
    marginBottom: 16,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
});

export default ReportScreen; 