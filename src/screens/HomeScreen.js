import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Searchbar, ActivityIndicator, Snackbar, Button, Text } from 'react-native-paper';
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
        
        // Date filtering
        if (hasDateRange) {
          const symptomDate = symptom.timestamp ? new Date(symptom.timestamp) : null;
          
          // Skip items without valid timestamps if date filtering is active
          if (!symptomDate) return false;
          
          // Filter by start date if set
          if (startDate && symptomDate < startDate) return false;
          
          // Filter by end date if set (end of the day for inclusive range)
          if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            if (symptomDate > endOfDay) return false;
          }
        }
        
        // Text search if search query exists
        if (hasSearchQuery) {
          const name = symptom.name?.toLowerCase() || '';
          const details = symptom.details?.toLowerCase() || '';
          if (!name.includes(searchLower) && !details.includes(searchLower)) {
            return false;
          }
        }
        
        return true;
      });
      
      // Sort results by most recent first (chronological order)
      const sortedResults = [...filtered].sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
        return dateB - dateA; // Descending order (newest first)
      });
      
      setFilteredSymptoms(sortedResults);
    } catch (error) {
      console.error('Error filtering symptoms:', error);
      setFilteredSymptoms([]);
      setSearchError("An error occurred while searching");
    }
  };

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

  const onDismissDatePicker = () => {
    setDatePickerVisible(false);
  };

  const onConfirmDatePicker = (params) => {
    setDatePickerVisible(false);
    setStartDate(params.startDate);
    setEndDate(params.endDate);
  };

  const getSeverityColor = (severity) => {
    if (!severity) return '#9e9e9e'; // Gray for N/A
    const numSeverity = parseInt(severity, 10);
    if (isNaN(numSeverity)) return '#9e9e9e';
    
    if (numSeverity <= 3) return '#4CAF50'; // Green for mild
    if (numSeverity <= 6) return '#FF9800'; // Orange for moderate
    return '#F44336'; // Red for severe
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString();
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
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search symptoms by name or details..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={theme.colors.primary}
        />
        
        <View style={styles.dateFilterContainer}>
          <TouchableOpacity 
            onPress={() => setDatePickerVisible(true)}
            style={styles.dateFilterButton}
          >
            <View style={styles.dateFilterContent}>
              <Text style={styles.dateFilterLabel}>Date: </Text>
              <Text style={styles.dateFilterText} numberOfLines={1}>
                {startDate && endDate 
                  ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                  : "Filter by date"}
              </Text>
            </View>
          </TouchableOpacity>
          
          {(startDate || endDate) && (
            <TouchableOpacity 
              onPress={() => {
                setStartDate(null);
                setEndDate(null);
              }}
              style={styles.clearDateButton}
            >
              <Text style={styles.clearDateText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Button 
          mode="contained" 
          style={styles.searchButton}
          onPress={performSearch}
        >
          Search
        </Button>
        
        {searchError && (
          <Text style={styles.errorText}>{searchError}</Text>
        )}
      </View>

      {searchPerformed && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.searchResultsHeader}>
              <Title>Search Results</Title>
              {filteredSymptoms.length > 0 && (
                <Text style={styles.resultCount}>{filteredSymptoms.length} result{filteredSymptoms.length !== 1 ? 's' : ''}</Text>
              )}
            </View>
            
            {filteredSymptoms.length > 0 ? (
              filteredSymptoms.map(symptom => (
                <View key={symptom._id} style={styles.searchResult}>
                  <View style={styles.resultHeader}>
                    <Title style={styles.symptomName}>{symptom.name || 'Unnamed Symptom'}</Title>
                    <View style={[styles.severityPill, {
                      backgroundColor: getSeverityColor(symptom.severity)
                    }]}>
                      <Text style={styles.severityText}>
                        {symptom.severity || 'N/A'}/10
                      </Text>
                    </View>
                  </View>
                  <Paragraph style={styles.dateText}>
                    {symptom.timestamp ? new Date(symptom.timestamp).toLocaleDateString() : 'N/A'}
                  </Paragraph>
                  {symptom.details && (
                    <Paragraph style={styles.details}>{symptom.details}</Paragraph>
                  )}
                </View>
              ))
            ) : (
              <Paragraph style={styles.noDataMessage}>No symptom data found</Paragraph>
            )}
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
                <View style={styles.resultHeader}>
                  <Title style={styles.symptomName}>{symptom.name || 'Unnamed Symptom'}</Title>
                  <View style={[styles.severityPill, {
                    backgroundColor: getSeverityColor(symptom.severity)
                  }]}>
                    <Text style={styles.severityText}>
                      {symptom.severity || 'N/A'}/10
                    </Text>
                  </View>
                </View>
                <Paragraph style={styles.dateText}>
                  {symptom.timestamp ? new Date(symptom.timestamp).toLocaleDateString() : 'N/A'}
                </Paragraph>
                {symptom.details && (
                  <Paragraph style={styles.details}>{symptom.details}</Paragraph>
                )}
              </View>
            ))
          ) : (
            <Paragraph style={styles.noDataMessage}>No symptoms recorded yet</Paragraph>
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
            <Paragraph style={styles.noDataMessage}>No medications added yet</Paragraph>
          )}
        </Card.Content>
      </Card>

      <DatePickerModal
        locale="en"
        mode="range"
        visible={datePickerVisible}
        onDismiss={onDismissDatePicker}
        startDate={startDate}
        endDate={endDate}
        onConfirm={onConfirmDatePicker}
      />

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
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 8,
    elevation: 4,
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
    padding: 16,
  },
  searchResult: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  noDataMessage: {
    fontStyle: 'italic',
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
  },
});

export default HomeScreen;