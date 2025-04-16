import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Searchbar, ActivityIndicator, Snackbar } from 'react-native-paper';
import { api } from '../services/api';
import { theme } from '../theme/theme';

// Temporary user ID - In a real app, this would come from authentication
const USER_ID = '67ebd559c9003543caba959c';

function HomeScreen() {
  const [recentSymptoms, setRecentSymptoms] = useState([]);
  const [medications, setMedications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [allSymptoms, setAllSymptoms] = useState([]);
  const [filteredSymptoms, setFilteredSymptoms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    try {
      if (!searchQuery || !allSymptoms) {
        setFilteredSymptoms([]);
        return;
      }
      
      const searchLower = searchQuery.toLowerCase().trim();
      if (!searchLower) {
        setFilteredSymptoms([]);
        return;
      }

      const filtered = allSymptoms.filter(symptom => {
        if (!symptom || typeof symptom !== 'object') return false;
        const name = symptom.name?.toLowerCase() || '';
        const details = symptom.details?.toLowerCase() || '';
        return name.includes(searchLower) || details.includes(searchLower);
      });
      
      const sortedFiltered = [...filtered].sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      setFilteredSymptoms(sortedFiltered);
    } catch (error) {
      console.error('Error filtering symptoms:', error);
      setFilteredSymptoms([]);
    }
  }, [searchQuery, allSymptoms]);

  const loadData = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Load both symptoms and medications in parallel
      const [symptomsData, medicationsData] = await Promise.all([
        api.getSymptoms(USER_ID, 0, 100),  // Get last 100 symptoms for search
        api.getMedications(USER_ID)
      ]);

      // Ensure symptomsData is an array
      const validSymptoms = Array.isArray(symptomsData) ? symptomsData : [];
      
      setAllSymptoms(validSymptoms);
      // Sort symptoms by timestamp and get the 5 most recent
      const sortedSymptoms = [...validSymptoms].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      setRecentSymptoms(sortedSymptoms.slice(0, 5));
      setMedications(medicationsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Pull down to refresh.');
      setAllSymptoms([]);
      setRecentSymptoms([]);
      setMedications([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadData(true);
  };

  if (isLoading && !isRefreshing && !recentSymptoms.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <Searchbar
        placeholder="Search symptoms by name or details..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={theme.colors.primary}
      />

      {filteredSymptoms.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Search Results</Title>
            {filteredSymptoms.map(symptom => (
              <View key={symptom._id} style={styles.searchResult}>
                <Title style={styles.symptomName}>{symptom.name || 'Unnamed Symptom'}</Title>
                <Paragraph>Severity: {symptom.severity || 'N/A'}/10</Paragraph>
                <Paragraph>Date: {symptom.timestamp ? new Date(symptom.timestamp).toLocaleDateString() : 'N/A'}</Paragraph>
                {symptom.details && (
                  <Paragraph style={styles.details}>Details: {symptom.details}</Paragraph>
                )}
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Title>Welcome to MEDBUD</Title>
          <Paragraph>Your personal health tracking assistant</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Symptoms</Title>
          {recentSymptoms.length > 0 ? (
            recentSymptoms.map(symptom => (
              <View key={symptom._id} style={styles.symptomItem}>
                <Title style={styles.symptomName}>{symptom.name || 'Unnamed Symptom'}</Title>
                <Paragraph>Severity: {symptom.severity || 'N/A'}/10</Paragraph>
                <Paragraph>Date: {symptom.timestamp ? new Date(symptom.timestamp).toLocaleDateString() : 'N/A'}</Paragraph>
                {symptom.details && (
                  <Paragraph style={styles.details}>Details: {symptom.details}</Paragraph>
                )}
              </View>
            ))
          ) : (
            <Paragraph>No symptoms recorded yet</Paragraph>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Your Medications</Title>
          {medications.length > 0 ? (
            medications.map(med => (
              <View key={med._id} style={styles.medicationItem}>
                <Title style={styles.medicationName}>{med.name || 'Unnamed Medication'}</Title>
                <Paragraph>Dosage: {med.dosage || 'N/A'}</Paragraph>
                {med.frequency && <Paragraph>Frequency: {med.frequency}</Paragraph>}
                {med.notes && <Paragraph style={styles.details}>Notes: {med.notes}</Paragraph>}
              </View>
            ))
          ) : (
            <Paragraph>No medications added yet</Paragraph>
          )}
        </Card.Content>
      </Card>

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
  searchBar: {
    marginBottom: 16,
    elevation: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  searchResult: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  symptomItem: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  medicationItem: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  symptomName: {
    fontSize: 16,
    marginBottom: 4,
  },
  medicationName: {
    fontSize: 16,
    marginBottom: 4,
  },
  details: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default HomeScreen; 