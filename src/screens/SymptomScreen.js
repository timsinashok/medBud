import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, Snackbar, ActivityIndicator } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../services/api';
import { theme } from '../theme/theme';

// Temporary user ID - In a real app, this would come from authentication
const USER_ID = '67ebd559c9003543caba959c';

function SymptomScreen() {
  const [symptoms, setSymptoms] = useState([]);
  const [newSymptom, setNewSymptom] = useState({ name: '', severity: '', notes: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  useEffect(() => {
    loadSymptoms();
  }, []);

  const loadSymptoms = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const currentSkip = refresh ? 0 : skip;
      const symptomsData = await api.getSymptoms(USER_ID, currentSkip, limit);

      if (refresh) setSymptoms(symptomsData);
      else setSymptoms(prev => [...prev, ...symptomsData]);

      setHasMore(symptomsData.length === limit);
      if (!refresh) setSkip(currentSkip + symptomsData.length);
    } catch (error) {
      console.error('Error loading symptoms:', error);
      setError('Failed to load symptoms. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => loadSymptoms(true);

  const loadMore = () => {
    if (!isLoading && hasMore) loadSymptoms();
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
      setSkip(0);
      await loadSymptoms(true);
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
          colors={[theme.colors.primary]}
        />
      }
      onScroll={({ nativeEvent }) => {
        if (isCloseToBottom(nativeEvent)) loadMore();
      }}
      scrollEventThrottle={400}
    >
      <Animated.View entering={FadeInDown.duration(300)} style={styles.card}>
        <Card style={styles.cardContent}>
          <Card.Content>
            <Title style={styles.cardTitle}>Log New Symptom</Title>
            <TextInput
              label="Symptom Name"
              value={newSymptom.name}
              onChangeText={text => setNewSymptom({...newSymptom, name: text})}
              style={styles.input}
              disabled={isLoading}
              accessibilityLabel="Enter symptom name"
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
              accessibilityLabel="Enter symptom severity"
            />
            <TextInput
              label="Details"
              value={newSymptom.notes}
              onChangeText={text => setNewSymptom({...newSymptom, notes: text})}
              multiline
              numberOfLines={3}
              style={[styles.input, styles.notesInput]}
              disabled={isLoading}
              accessibilityLabel="Enter symptom details"
            />
            <Button 
              mode="contained" 
              onPress={addSymptom}
              loading={isLoading}
              disabled={isLoading || !newSymptom.name || !newSymptom.severity}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              accessibilityLabel="Add new symptom"
            >
              Add Symptom
            </Button>
          </Card.Content>
        </Card>
      </Animated.View>

      {symptoms.map((symptom, index) => (
        <Animated.View key={symptom._id} entering={FadeInDown.duration(300).delay(100 + index * 50)} style={styles.card}>
          <Card style={styles.cardContent}>
            <Card.Content>
              <Title style={styles.cardTitle}>{symptom.name}</Title>
              <Paragraph style={styles.details}>Severity: {symptom.severity}/10</Paragraph>
              <Paragraph style={styles.details}>Date: {new Date(symptom.timestamp).toLocaleDateString()}</Paragraph>
              {symptom.details && <Paragraph style={styles.details}>Details: {symptom.details}</Paragraph>}
            </Card.Content>
          </Card>
        </Animated.View>
      ))}

      {isLoading && !isRefreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        action={{
          label: 'Retry',
          onPress: () => loadSymptoms(true),
        }}
        style={styles.snackbar}
      >
        {error}
      </Snackbar>
    </ScrollView>
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
  loadingContainer: {
    padding: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
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

export default SymptomScreen;