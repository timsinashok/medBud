import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Text, Pressable } from 'react-native';
import { 
  TextInput, Button, Card, Title, Paragraph, Snackbar, 
  ActivityIndicator, Portal, Dialog, Divider, FAB,
  Chip, Surface, ProgressBar
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { theme } from '../theme/theme';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

// Temporary user ID - In a real app, this would come from authentication
const USER_ID = '67ebd559c9003543caba959c';

// Constants for validation
const MAX_SYMPTOM_NAME_WORDS = 100;
const MAX_DETAILS_WORDS = 500;
const MAX_RECENT_SYMPTOMS = 10;

function SymptomScreen() {
  const insets = useSafeAreaInsets();

  const [symptoms, setSymptoms] = useState([]);
  const [newSymptom, setNewSymptom] = useState({
    name: '',
    severity: '',
    notes: ''
  });
  const [inputErrors, setInputErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const limit = 20; // Number of items per page

  useEffect(() => {
    loadSymptoms();
  }, []);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };

    try {
      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (error) {
      console.error('Error formatting date with timezone:', error);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  const loadSymptoms = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const currentSkip = refresh ? 0 : skip;
      const symptomsData = await api.getSymptoms(USER_ID, currentSkip, limit);

      const sortedSymptoms = symptomsData
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, MAX_RECENT_SYMPTOMS);

      if (refresh) {
        setSymptoms(sortedSymptoms);
      } else {
        setSymptoms(prev => [...prev, ...sortedSymptoms]);
      }

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

  const validateSymptom = () => {
    let isValid = true;
    const errors = {};

    if (!newSymptom.name.trim()) {
      errors.name = 'Symptom name is required';
      isValid = false;
    }

    if (!newSymptom.severity) {
      errors.severity = 'Severity is required';
      isValid = false;
    }

    if (!newSymptom.notes.trim()) {
      errors.notes = 'Details are required';
      isValid = false;
    }

    const nameWordCount = newSymptom.name.trim().split(/\s+/).length;
    if (nameWordCount > MAX_SYMPTOM_NAME_WORDS) {
      errors.name = `Symptom name cannot exceed ${MAX_SYMPTOM_NAME_WORDS} words`;
      isValid = false;
    }

    const detailsWordCount = newSymptom.notes.trim().split(/\s+/).length;
    if (detailsWordCount > MAX_DETAILS_WORDS) {
      errors.notes = `Details cannot exceed ${MAX_DETAILS_WORDS} words`;
      isValid = false;
    }

    setInputErrors(errors);
    return isValid;
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

      setSkip(0);
      await loadSymptoms(true);

      setNewSymptom({ name: '', severity: '', notes: '' });
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error adding symptom:', error);
      setError('Failed to add symptom. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadSymptoms(true);
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadSymptoms();
    }
  }, [isLoading, hasMore]);

  const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
    const paddingToBottom = 20;
    return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
  };

  const getSeverityColor = (severity) => {
    if (!severity) return theme.colors.disabled;
    const numSeverity = parseInt(severity, 10);
    if (isNaN(numSeverity)) return theme.colors.disabled;
    
    if (numSeverity <= 3) return theme.severityColors.low;
    if (numSeverity <= 6) return theme.severityColors.medium;
    return theme.severityColors.high;
  };

  if (isLoading && !isRefreshing && !symptoms.length) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading your symptoms...</Text>
      </View>
    );
  }

  const renderSeveritySelector = () => {
    return (
      <View style={styles.severityContainer}>
        <Text style={styles.severityLabel}>Severity (1-10)</Text>
        <View style={styles.severityScale}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <Pressable
              key={value}
              style={[
                styles.severityButton,
                parseInt(newSymptom.severity) === value && styles.selectedSeverity,
                parseInt(newSymptom.severity) === value && { backgroundColor: getSeverityColor(value) }
              ]}
              onPress={() => {
                setNewSymptom({ ...newSymptom, severity: value.toString() });
                if (inputErrors.severity) {
                  const newErrors = {...inputErrors};
                  delete newErrors.severity;
                  setInputErrors(newErrors);
                }
              }}
            >
              <Text 
                style={[
                  styles.severityButtonText,
                  parseInt(newSymptom.severity) === value && styles.selectedSeverityText
                ]}
              >
                {value}
              </Text>
            </Pressable>
          ))}
        </View>
        {inputErrors.severity && <Text style={styles.errorText}>{inputErrors.severity}</Text>}
      </View>
    );
  };

  return (
    <View style={[styles.container, {paddingBottom: insets.bottom}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        onScroll={({ nativeEvent }) => {
          if (isCloseToBottom(nativeEvent)) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {symptoms.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="medical-outline" size={64} color={theme.colors.disabled} />
            <Text style={styles.emptyStateText}>
              You haven't logged any symptoms yet
            </Text>
            <Button 
              mode="contained" 
              onPress={() => setShowAddDialog(true)}
              style={styles.emptyStateButton}
              icon="plus"
            >
              Log Your First Symptom
            </Button>
          </View>
        ) : (
          <>
            <Surface style={styles.headerCard}>
              <Text style={styles.headerTitle}>Symptom History</Text>
              <Text style={styles.headerSubtitle}>
                Keep track of your health by logging and monitoring your symptoms
              </Text>
            </Surface>

            {symptoms.map((symptom, index) => (
              <Animated.View 
                key={symptom._id} 
                entering={FadeInDown.duration(300).delay(index * 100)}
              >
                <Card style={styles.symptomCard}>
                  <Card.Content>
                    <View style={styles.symptomHeader}>
                      <Title style={styles.symptomName}>{symptom.name}</Title>
                      <Chip 
                        style={[
                          styles.severityChip, 
                          { backgroundColor: getSeverityColor(symptom.severity) }
                        ]}
                      >
                        <Text style={styles.severityChipText}>
                          {symptom.severity || 'N/A'}/10
                        </Text>
                      </Chip>
                    </View>
                    
                    <View style={styles.timeContainer}>
                      <Ionicons name="time-outline" size={16} color={theme.colors.disabled} />
                      <Text style={styles.timeText}>
                        {formatDateTime(symptom.timestamp)}
                      </Text>
                    </View>

                    <Divider style={styles.divider} />
                    
                    {symptom.severity && (
                      <View style={styles.severityBarContainer}>
                        <ProgressBar 
                          progress={symptom.severity / 10} 
                          color={getSeverityColor(symptom.severity)}
                          style={styles.severityBar}
                        />
                        <View style={styles.severityLabels}>
                          <Text style={styles.severityMinLabel}>Mild</Text>
                          <Text style={styles.severityMaxLabel}>Severe</Text>
                        </View>
                      </View>
                    )}
                    
                    {symptom.details && (
                      <View style={styles.detailsContainer}>
                        <Text style={styles.detailsTitle}>Notes:</Text>
                        <Text style={styles.detailsText}>{symptom.details}</Text>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              </Animated.View>
            ))}

            {isLoading && !isRefreshing && (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadMoreText}>Loading more...</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => setShowAddDialog(true)}
        color="#fff"
      />

      <Portal>
        <Dialog 
          visible={showAddDialog} 
          onDismiss={() => {
            setShowAddDialog(false);
            setInputErrors({});
          }}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Log New Symptom</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <View style={styles.dialogContent}>
                <TextInput
                  label="Symptom Name"
                  value={newSymptom.name}
                  onChangeText={text => {
                    setNewSymptom({...newSymptom, name: text});
                    if (inputErrors.name) {
                      const newErrors = {...inputErrors};
                      delete newErrors.name;
                      setInputErrors(newErrors);
                    }
                  }}
                  style={styles.input}
                  error={!!inputErrors.name}
                  disabled={isLoading}
                  mode="outlined"
                  placeholder="e.g. Headache, Fever, Cough"
                />
                {inputErrors.name && <Text style={styles.errorText}>{inputErrors.name}</Text>}

                {renderSeveritySelector()}

                <TextInput
                  label="Symptom Details"
                  value={newSymptom.notes}
                  onChangeText={text => {
                    setNewSymptom({...newSymptom, notes: text});
                    if (inputErrors.notes) {
                      const newErrors = {...inputErrors};
                      delete newErrors.notes;
                      setInputErrors(newErrors);
                    }
                  }}
                  style={styles.input}
                  error={!!inputErrors.notes}
                  multiline
                  numberOfLines={4}
                  disabled={isLoading}
                  mode="outlined"
                  placeholder="Describe your symptoms in detail"
                />
                {inputErrors.notes && <Text style={styles.errorText}>{inputErrors.notes}</Text>}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button 
              onPress={() => {
                setShowAddDialog(false);
                setInputErrors({});
              }}
              textColor={theme.colors.text}
            >
              Cancel
            </Button>
            <Button 
              onPress={addSymptom}
              loading={isLoading}
              disabled={isLoading}
              mode="contained"
            >
              Save Symptom
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.md,
  },
  headerCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.disabled,
  },
  symptomCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness,
    ...theme.shadows.medium,
    backgroundColor: theme.colors.background,
  },
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  symptomName: {
    ...theme.typography.h3,
    fontSize: 18,
    color: theme.colors.text,
    flex: 1,
  },
  severityChip: {
    height: 28,
  },
  severityChipText: {
    color: '#fff',
    ...theme.typography.bold,
    fontSize: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  timeText: {
    ...theme.typography.caption,
    color: theme.colors.disabled,
    marginLeft: theme.spacing.xs,
  },
  divider: {
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.sm,
  },
  severityBarContainer: {
    marginVertical: theme.spacing.sm,
  },
  severityBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.surface,
  },
  severityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  severityMinLabel: {
    ...theme.typography.caption,
    color: theme.colors.disabled,
  },
  severityMaxLabel: {
    ...theme.typography.caption,
    color: theme.colors.disabled,
  },
  detailsContainer: {
    marginTop: theme.spacing.sm,
  },
  detailsTitle: {
    ...theme.typography.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  detailsText: {
    ...theme.typography.body2,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.roundness / 2,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.disabled,
    marginTop: theme.spacing.md,
  },
  loadMoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    flexDirection: 'row',
  },
  loadMoreText: {
    ...theme.typography.body2,
    color: theme.colors.disabled,
    marginLeft: theme.spacing.sm,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    minHeight: 300,
  },
  emptyStateText: {
    ...theme.typography.h3,
    color: theme.colors.disabled,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  emptyStateButton: {
    marginTop: theme.spacing.md,
  },
  dialog: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    maxHeight: '80%',
  },
  dialogTitle: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  dialogScrollArea: {
    paddingHorizontal: 0,
  },
  dialogContent: {
    padding: theme.spacing.md,
  },
  input: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  severityContainer: {
    marginBottom: theme.spacing.md,
  },
  severityLabel: {
    ...theme.typography.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  severityScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  severityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  selectedSeverity: {
    borderWidth: 0,
  },
  severityButtonText: {
    ...theme.typography.medium,
    fontSize: 12,
    color: theme.colors.text,
  },
  selectedSeverityText: {
    color: '#fff',
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginTop: -theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  snackbar: {
    backgroundColor: theme.colors.error,
  },
});

export default SymptomScreen;