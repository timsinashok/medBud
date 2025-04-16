import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Searchbar, ActivityIndicator, Snackbar, Button, Text } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../services/api';
import { theme } from '../theme/theme';
import { DatePickerModal } from 'react-native-paper-dates';

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
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const performSearch = () => {
    try {
      setSearchPerformed(true);
      setSearchError(null);
      
      // Check if user has provided any search criteria
      const hasSearchQuery = searchQuery && searchQuery.trim().length > 0;
      const hasDateRange = startDate !== null || endDate !== null;
      
      if (!hasSearchQuery && !hasDateRange) {
        setSearchError("Please enter search text or select a date range");
        setFilteredSymptoms([]);
        return;
      }
      
      if (!allSymptoms || !Array.isArray(allSymptoms)) {
        setFilteredSymptoms([]);
        return;
      }

      const searchLower = (searchQuery || '').toLowerCase().trim();
      
      const filtered = allSymptoms.filter(symptom => {
        if (!symptom || typeof symptom !== 'object') return false;
        const name = symptom.name?.toLowerCase() || '';
        const details = symptom.details?.toLowerCase() || '';
        return name.includes(searchLower) || details.includes(searchLower);
      });
      
      setFilteredSymptoms(filtered);
    } catch (error) {
      console.error('Error filtering symptoms:', error);
      setFilteredSymptoms([]);
      setSearchError("An error occurred while searching");
    }
  };

  const loadData = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      const [symptomsData, medicationsData] = await Promise.all([
        api.getSymptoms(USER_ID, 0, 100),
        api.getMedications(USER_ID)
      ]);

      const validSymptoms = Array.isArray(symptomsData) ? symptomsData : [];
      setAllSymptoms(validSymptoms);
      const sortedSymptoms = [...validSymptoms].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      setRecentSymptoms(sortedSymptoms.slice(0, 5));
      setMedications(medicationsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load data. Please try again.');
      setAllSymptoms([]);
      setRecentSymptoms([]);
      setMedications([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => loadData(true);

  const onDismissDatePicker = () => setDatePickerVisible(false);

  const onConfirmDatePicker = (params) => {
    setDatePickerVisible(false);
    setStartDate(params.startDate);
    setEndDate(params.endDate);
  };

  const getSeverityColor = (severity) => {
    if (!severity) return theme.colors.disabled;
    const numSeverity = parseInt(severity, 10);
    if (isNaN(numSeverity)) return theme.colors.disabled;
    if (numSeverity <= 3) return '#4CAF50';
    if (numSeverity <= 6) return '#FF9800';
    return '#F44336';
  };

  const formatDate = (date) => date ? date.toLocaleDateString() : 'Not set';

  if (isLoading && !isRefreshing && !recentSymptoms.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
          colors={[theme.colors.primary]}
        />
      }
    >
      <Animated.View entering={FadeInDown.duration(300)} style={styles.searchContainer}>
        <Searchbar
          placeholder="Search symptoms..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={theme.colors.primary}
          accessibilityLabel="Search symptoms"
        />
        
        <View style={styles.dateFilterContainer}>
          <TouchableOpacity 
            onPress={() => setDatePickerVisible(true)}
            style={styles.dateFilterButton}
            accessibilityLabel="Select date range"
          >
            <View style={styles.dateFilterContent}>
              <Text style={styles.dateFilterLabel}>Date: </Text>
              <Text style={styles.dateFilterText} numberOfLines={1}>
                {startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : "Filter by date"}
              </Text>
            </View>
          </TouchableOpacity>
          
          {(startDate || endDate) && (
            <TouchableOpacity 
              onPress={() => { setStartDate(null); setEndDate(null); }}
              style={styles.clearDateButton}
              accessibilityLabel="Clear date filter"
            >
              <Text style={styles.clearDateText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Button 
          mode="contained" 
          style={styles.searchButton}
          onPress={performSearch}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          accessibilityLabel="Perform search"
        >
          Search
        </Button>
        
        {searchError && <Text style={styles.errorText}>{searchError}</Text>}
      </Animated.View>

      {searchPerformed && (
        <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.card}>
          <Card style={styles.cardContent}>
            <Card.Content>
              <View style={styles.searchResultsHeader}>
                <Title style={styles.cardTitle}>Search Results</Title>
                {filteredSymptoms.length > 0 && (
                  <Text style={styles.resultCount}>{filteredSymptoms.length} result{filteredSymptoms.length !== 1 ? 's' : ''}</Text>
                )}
              </View>
              {filteredSymptoms.length > 0 ? (
                filteredSymptoms.map((symptom, index) => (
                  <Animated.View key={symptom._id} entering={FadeInDown.duration(300).delay(100 + index * 50)} style={styles.searchResult}>
                    <View style={styles.resultHeader}>
                      <Title style={styles.symptomName}>{symptom.name || 'Unnamed Symptom'}</Title>
                      <View style={[styles.severityPill, { backgroundColor: getSeverityColor(symptom.severity) }]}>
                        <Text style={styles.severityText}>{symptom.severity || 'N/A'}/10</Text>
                      </View>
                    </View>
                    <Paragraph style={styles.dateText}>
                      {symptom.timestamp ? new Date(symptom.timestamp).toLocaleDateString() : 'N/A'}
                    </Paragraph>
                    {symptom.details && <Paragraph style={styles.details}>{symptom.details}</Paragraph>}
                  </Animated.View>
                ))
              ) : (
                <Paragraph style={styles.noDataMessage}>No symptom data found</Paragraph>
              )}
            </Card.Content>
          </Card>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.duration(300).delay(200)} style={styles.card}>
        <Card style={styles.cardContent}>
          <Card.Content>
            <Title style={styles.cardTitle}>Welcome to MEDBUD</Title>
            <Paragraph style={styles.cardSubtitle}>Your personal health tracking assistant</Paragraph>
          </Card.Content>
        </Card>
      </Animated.View>

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
          label: 'Retry',
          onPress: () => loadData(true),
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
  searchContainer: {
    marginBottom: theme.spacing.md,
  },
  searchBar: {
    borderRadius: theme.roundness,
    elevation: 2,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.elevation.level2,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  dateFilterButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.sm,
    elevation: 2,
    flex: 1,
    shadowColor: theme.colors.elevation.level2,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dateFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateFilterLabel: {
    fontFamily: theme.typography.medium.fontFamily,
    fontWeight: theme.typography.medium.fontWeight,
    fontSize: theme.typography.caption.fontSize,
    marginRight: theme.spacing.xs,
    color: theme.colors.primary,
  },
  dateFilterText: {
    flex: 1,
    fontFamily: theme.typography.regular.fontFamily,
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
  },
  clearDateButton: {
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    elevation: 2,
  },
  clearDateText: {
    color: theme.colors.error,
    fontFamily: theme.typography.medium.fontFamily,
    fontSize: theme.typography.caption.fontSize,
  },
  searchButton: {
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
  errorText: {
    color: theme.colors.error,
    fontFamily: theme.typography.regular.fontFamily,
    fontSize: theme.typography.caption.fontSize,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateFilterButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    padding: 10,
    elevation: 2,
    flex: 1,
  },
  dateFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateFilterLabel: {
    fontWeight: 'bold',
    marginRight: 4,
    color: theme.colors.primary,
  },
  dateFilterText: {
    flex: 1,
    color: '#555',
  },
  clearDateButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e8e8e8',
    borderRadius: 4,
  },
  clearDateText: {
    color: theme.colors.error || '#f44336',
    fontWeight: 'bold',
    fontSize: 12,
  },
  searchButton: {
    marginTop: 8,
    marginBottom: 4,
  },
  errorText: {
    color: theme.colors.error || '#f44336',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  cardSubtitle: {
    fontFamily: theme.typography.regular.fontFamily,
    fontSize: theme.typography.regular.fontSize,
    color: theme.colors.text,
  },
  searchResult: {
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.elevation.level1,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.elevation.level1,
  },
  resultCount: {
    fontFamily: theme.typography.caption.fontFamily,
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.disabled,
    fontStyle: 'italic',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severityPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness,
    minWidth: 45,
    alignItems: 'center',
  },
  severityText: {
    color: '#FFFFFF',
    fontFamily: theme.typography.medium.fontFamily,
    fontSize: theme.typography.caption.fontSize,
  },
  dateText: {
    fontFamily: theme.typography.regular.fontFamily,
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.disabled,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 6,
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  severityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 45,
    alignItems: 'center',
  },
  severityText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    marginBottom: 4,
  },
  symptomItem: {
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.elevation.level1,
  },
  medicationItem: {
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.elevation.level1,
  },
  symptomName: {
    fontFamily: theme.typography.medium.fontFamily,
    fontSize: theme.typography.regular.fontSize,
    color: theme.colors.text,
  },
  medicationName: {
    fontFamily: theme.typography.medium.fontFamily,
    fontSize: theme.typography.regular.fontSize,
    color: theme.colors.text,
  },
  details: {
    fontFamily: theme.typography.regular.fontFamily,
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  noDataMessage: {
    fontFamily: theme.typography.regular.fontFamily,
    fontSize: theme.typography.regular.fontSize,
    color: theme.colors.disabled,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
  },
  snackbar: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.roundness,
  },
  noDataMessage: {
    fontStyle: 'italic',
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
  },
});

export default HomeScreen;