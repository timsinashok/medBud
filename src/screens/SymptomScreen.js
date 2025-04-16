import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, Snackbar, ActivityIndicator } from 'react-native-paper';
import { api } from '../services/api';

// Temporary user ID - In a real app, this would come from authentication
const USER_ID = '67ebd559c9003543caba959c';

// Constants for validation
const MAX_SYMPTOM_NAME_WORDS = 100;
const MAX_DETAILS_WORDS = 500;
const MAX_RECENT_SYMPTOMS = 10;

function SymptomScreen() {
  const [symptoms, setSymptoms] = useState([]);
  const [newSymptom, setNewSymptom] = useState({
    name: '',
    severity: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20; // Number of items per page

  useEffect(() => {
    loadSymptoms();
  }, []);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Create Date object from timestamp
    const date = new Date(timestamp);
    
    // Format date and time in Gulf Standard Time (UTC+4)
    const options = {
      timeZone: 'Asia/Dubai', // Dubai uses Gulf Standard Time (UTC+4)
      year: 'numeric',
      month: 'numeric', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    try {
      return new Intl.DateTimeFormat('en-US', options).format(date) + ' GST';
    } catch (error) {
      // Fallback in case timeZone is not supported
      console.error('Error formatting date with timezone:', error);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Local)`;
    }
  };

  const loadSymptoms = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setSkip(0);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const currentSkip = refresh ? 0 : skip;
      const symptomsData = await api.getSymptoms(USER_ID, currentSkip, limit);

      // Sort symptoms by timestamp and limit to most recent 10
      const sortedSymptoms = symptomsData.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      ).slice(0, MAX_RECENT_SYMPTOMS);

      if (refresh) {
        setSymptoms(sortedSymptoms);
      } else {
        setSymptoms(prev => [...prev, ...sortedSymptoms]);
      }

      setHasMore(symptomsData.length === limit);
      if (!refresh) {
        setSkip(currentSkip + symptomsData.length);
      }
    } catch (error) {
      console.error('Error loading symptoms:', error);
      setError('Failed to load symptoms. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const validateSymptom = () => {
    if (!newSymptom.name.trim()) {
      setError('Symptom name is required');
      return false;
    }
    if (!newSymptom.severity) {
      setError('Severity is required');
      return false;
    }
    if (!newSymptom.notes.trim()) {
      setError('Details are required');
      return false;
    }

    const nameWordCount = newSymptom.name.trim().split(/\s+/).length;
    if (nameWordCount > MAX_SYMPTOM_NAME_WORDS) {
      setError(`Symptom name cannot exceed ${MAX_SYMPTOM_NAME_WORDS} words`);
      return false;
    }

    const detailsWordCount = newSymptom.notes.trim().split(/\s+/).length;
    if (detailsWordCount > MAX_DETAILS_WORDS) {
      setError(`Details cannot exceed ${MAX_DETAILS_WORDS} words`);
      return false;
    }

    return true;
  };

  const addSymptom = async () => {
    if (!validateSymptom()) return;

    try {
      setIsLoading(true);
      setError(null);

      const symptomData = {
        name: newSymptom.name.trim(),
        details: newSymptom.notes.trim(),
        severity: parseInt(newSymptom.severity)
      };

      await api.createSymptom(symptomData, USER_ID);
      
      // Refresh the symptoms list from the beginning
      setSkip(0);
      await loadSymptoms(true);
      
      // Clear the form
      setNewSymptom({ name: '', severity: '', notes: '' });
    } catch (error) {
      console.error('Error adding symptom:', error);
      setError('Failed to add symptom. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = () => {
    loadSymptoms(true);
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      loadSymptoms();
    }
  };

  const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
    const paddingToBottom = 20;
    return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
        />
      }
      onScroll={({ nativeEvent }) => {
        if (isCloseToBottom(nativeEvent)) {
          loadMore();
        }
      }}
      scrollEventThrottle={400}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Title>Log New Symptom</Title>
          <TextInput
            label="Symptom Name (Required)"
            value={newSymptom.name}
            onChangeText={text => setNewSymptom({...newSymptom, name: text})}
            style={styles.input}
            disabled={isLoading}
            error={!newSymptom.name.trim()}
          />
          <TextInput
            label="Severity (1-10) (Required)"
            value={newSymptom.severity}
            onChangeText={text => {
              const value = parseInt(text);
              if (!isNaN(value) && value >= 1 && value <= 10) {
                setNewSymptom({...newSymptom, severity: text});
              } else if (text === '') {
                setNewSymptom({...newSymptom, severity: ''});
              }
            }}
            keyboardType="numeric"
            style={styles.input}
            disabled={isLoading}
            error={!newSymptom.severity}
          />
          <TextInput
            label="Details (Required)"
            value={newSymptom.notes}
            onChangeText={text => setNewSymptom({...newSymptom, notes: text})}
            multiline
            style={styles.input}
            disabled={isLoading}
            error={!newSymptom.notes.trim()}
          />
          <Button 
            mode="contained" 
            onPress={addSymptom}
            loading={isLoading}
            disabled={isLoading || !newSymptom.name.trim() || !newSymptom.severity || !newSymptom.notes.trim()}
          >
            Add Symptom
          </Button>
        </Card.Content>
      </Card>

      {symptoms.map(symptom => (
        <Card key={symptom._id} style={styles.card}>
          <Card.Content>
            <Title>{symptom.name}</Title>
            <Paragraph>Severity: {symptom.severity}/10</Paragraph>
            <Paragraph>Date: {formatDateTime(symptom.timestamp)}</Paragraph>
            {symptom.details && <Paragraph>Details: {symptom.details}</Paragraph>}
          </Card.Content>
        </Card>
      ))}

      {isLoading && !isRefreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      )}

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
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
});

export default SymptomScreen;