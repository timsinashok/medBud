import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, Snackbar, ActivityIndicator } from 'react-native-paper';
import { api } from '../services/api';

// Temporary user ID - In a real app, this would come from authentication
const USER_ID = '67ebd559c9003543caba959c';

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

      if (refresh) {
        setSymptoms(symptomsData);
      } else {
        setSymptoms(prev => [...prev, ...symptomsData]);
      }

      // Update pagination state
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

  const onRefresh = () => {
    loadSymptoms(true);
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      loadSymptoms();
    }
  };

  const addSymptom = async () => {
    if (!newSymptom.name || !newSymptom.severity) return;

    try {
      setIsLoading(true);
      setError(null);

      const symptomData = {
        name: newSymptom.name,
        details: newSymptom.notes || '',
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
            label="Symptom Name"
            value={newSymptom.name}
            onChangeText={text => setNewSymptom({...newSymptom, name: text})}
            style={styles.input}
            disabled={isLoading}
          />
          <TextInput
            label="Severity (1-10)"
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
          />
          <TextInput
            label="Details"
            value={newSymptom.notes}
            onChangeText={text => setNewSymptom({...newSymptom, notes: text})}
            multiline
            style={styles.input}
            disabled={isLoading}
          />
          <Button 
            mode="contained" 
            onPress={addSymptom}
            loading={isLoading}
            disabled={isLoading || !newSymptom.name || !newSymptom.severity}
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
            <Paragraph>Date: {new Date(symptom.timestamp).toLocaleDateString()}</Paragraph>
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