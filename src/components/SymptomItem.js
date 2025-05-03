import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Text, useTheme } from 'react-native-paper';

const SymptomItem = ({ symptom, isSearchResult = false }) => {
  const theme = useTheme();

  return (
    <View>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.name}>{symptom.name || 'Unnamed Symptom'}</Title>
          <View style={styles.detailsRow}>
            <Paragraph style={styles.info}>
              Severity: <Text style={styles.severityText}>{symptom.severity || 'N/A'}/10</Text>
            </Paragraph>
            <Paragraph style={styles.info}>
              Date: {symptom.timestamp ? new Date(symptom.timestamp).toLocaleDateString() : 'N/A'}
            </Paragraph>
          </View>
          {symptom.details && (
            <Paragraph style={styles.details}>Details: {symptom.details}</Paragraph>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    borderLeftColor: theme => theme.colors.primary,
    borderRadius: theme => theme.roundness,
    backgroundColor: theme => theme.colors.surface,
    elevation: 2,
    marginBottom: theme => theme.spacing.sm,
  },
  name: {
    fontSize: theme => theme.typography.subtitle.fontSize,
    fontWeight: theme => theme.typography.subtitle.fontWeight,
    color: theme => theme.colors.text,
    marginBottom: theme => theme.spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme => theme.spacing.xs,
  },
  info: {
    fontSize: theme => theme.typography.body.fontSize,
    color: theme => theme.colors.secondaryText,
  },
  severityText: {
    fontWeight: 'bold',
    color: theme => theme.colors.primary,
  },
  details: {
    fontSize: theme => theme.typography.body.fontSize,
    color: theme => theme.colors.secondaryText,
    fontStyle: 'italic',
    marginTop: theme => theme.spacing.sm,
  },
});

export default SymptomItem;