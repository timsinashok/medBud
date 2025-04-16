import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, Title, Paragraph, Divider, TextInput, Snackbar } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../services/api';
import { theme } from '../theme/theme';

const logoImage = require('../../assets/logo.png');

const THEME_COLOR = theme.colors.primary;
const ACCENT_COLOR = theme.colors.secondary;
const LIGHT_GRAY = theme.colors.background;
const DARK_GRAY = theme.colors.disabled;
const fonts = {
  Roboto: {
    normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
    bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf',
    italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf',
    bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf'
  }
};

const USER_ID = '67ebd559c9003543caba959c';

function ReportScreen() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [error, setError] = useState(null);
  const [logoDataUrl, setLogoDataUrl] = useState(null);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch(logoImage);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoDataUrl(reader.result);
        reader.readAsDataURL(blob);
      } catch (err) {
        console.warn('Error pre-loading logo:', err);
      }
    };
    loadLogo();
  }, []);

  const formatReportContent = (rawContent) => {
    try {
      const reportData = JSON.parse(rawContent);
      const reportContent = reportData.generated_report;
      const sections = reportContent.split('###').filter(Boolean);
      return sections.map((section, index) => {
        const cleanSection = section.replace(/\\n/g, '\n').replace(/\*\*/g, '').trim();
        return { id: index, content: cleanSection };
      });
    } catch (error) {
      console.error('Error parsing report:', error);
      return [{ id: 0, content: rawContent }];
    }
  };

  const generateReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        setError('End date cannot be earlier than start date.');
        return;
      }

      const reportData = await api.generateReport(USER_ID, startDate, endDate, 'summary');
      setReport({
        content: formatReportContent(reportData),
        generatedAt: new Date()
      });
    } catch (error) {
      console.error('Error generating report:', error);
      if (error.status === 404) {
        setError('No health data found for the selected date range.');
      } else if (error.status === 500) {
        setError('The AI Report Generator encountered a problem.');
      } else {
        setError('Unexpected error. Please try again.');
      }
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPdf = async () => {
    try {
      setIsPdfExporting(true);
      setError(null);

      const pdfMake = (await import('pdfmake/build/pdfmake')).default;

      const sections = report.content.map(section => {
        const lines = section.content.split('\n');
        const title = lines[0].trim();
        const contentLines = lines.slice(1);
        const processedContent = [];
        let currentParagraph = [];

        contentLines.forEach(line => {
          line = line.trim();
          if (!line) {
            if (currentParagraph.length > 0) {
              processedContent.push(currentParagraph.join(' '));
              currentParagraph = [];
            }
          } else if (line.startsWith('*')) {
            if (currentParagraph.length > 0) {
              processedContent.push(currentParagraph.join(' '));
              currentParagraph = [];
            }
            processedContent.push(line);
          } else {
            currentParagraph.push(line);
          }
        });

        if (currentParagraph.length > 0) {
          processedContent.push(currentParagraph.join(' '));
        }

        return { title, content: processedContent };
      });

      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        header: {
          stack: [
            {
              canvas: [{ type: 'rect', x: 0, y: 0, w: 595.28, h: 60, color: THEME_COLOR }]
            },
            {
              text: 'MEDBUD HEALTH REPORT',
              fontSize: 28,
              bold: true,
              color: 'white',
              margin: [40, -45, 40, 20]
            }
          ]
        },
        footer: function(currentPage, pageCount) {
          return {
            stack: [
              {
                canvas: [{ type: 'line', x1: 40, y1: -30, x2: 555.28, y2: -30, lineWidth: 1, lineColor: THEME_COLOR }]
              },
              {
                text: `Page ${currentPage} of ${pageCount}`,
                alignment: 'center',
                fontSize: 9,
                color: DARK_GRAY,
                margin: [0, -20, 0, 0]
              }
            ]
          };
        },
        content: [
          {
            stack: [
              {
                columns: [
                  {
                    text: `Generated: ${report.generatedAt.toLocaleDateString()}`,
                    fontSize: 11,
                    color: DARK_GRAY,
                    width: 'auto'
                  },
                  startDate || endDate ? {
                    text: `Report Period: ${startDate || 'All'} to ${endDate || 'Present'}`,
                    fontSize: 11,
                    color: DARK_GRAY,
                    width: 'auto'
                  } : {}
                ],
                columnGap: 20
              },
              {
                canvas: [{ type: 'line', x1: 0, y1: 10, x2: 515.28, y2: 10, lineWidth: 1, lineColor: THEME_COLOR }]
              }
            ]
          },
          ...sections.map((section, index) => ({
            stack: [
              {
                margin: [0, 20, 0, 0],
                columns: [
                  {
                    canvas: [{ type: 'rect', x: 0, y: 0, w: 4, h: 24, color: ACCENT_COLOR }]
                  },
                  {
                    text: section.title,
                    fontSize: 16,
                    bold: true,
                    color: ACCENT_COLOR,
                    margin: [10, 0, 0, 0]
                  }
                ]
              },
              {
                stack: section.content.map(line => {
                  if (line.startsWith('*')) {
                    return {
                      margin: [15, 5, 0, 5],
                      columns: [
                        { text: '•', width: 15, color: ACCENT_COLOR, fontSize: 11 },
                        { text: line.substring(1).trim(), fontSize: 11, color: theme.colors.text }
                      ]
                    };
                  }
                  return {
                    text: line,
                    fontSize: 11,
                    lineHeight: 1.4,
                    margin: [0, 8, 0, 8],
                    color: theme.colors.text
                  };
                }),
                margin: [15, 10, 0, 0]
              },
              index < sections.length - 1 ? {
                canvas: [{ type: 'line', x1: 0, y1: 20, x2: 515.28, y2: 20, lineWidth: 0.5, lineColor: theme.colors.elevation.level1 }]
              } : {}
            ]
          }))
        ],
        defaultStyle: { font: 'Roboto' }
      };

      const pdf = pdfMake.createPdf(docDefinition, null, fonts);
      pdf.download('medbud-health-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError(`Failed to export PDF: ${error.message}`);
    } finally {
      setIsPdfExporting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {error && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.errorCard}>
          <Card style={styles.cardContent}>
            <Card.Content>
              <Paragraph style={styles.errorText}>{error}</Paragraph>
            </Card.Content>
          </Card>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.card}>
        <Card style={styles.cardContent}>
          <Card.Content>
            <Title style={styles.cardTitle}>Generate Health Report</Title>
            <View style={styles.dateContainer}>
              <TextInput
                label="Start Date"
                value={startDate}
                onChangeText={setStartDate}
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                accessibilityLabel="Enter start date"
              />
              <TextInput
                label="End Date"
                value={endDate}
                onChangeText={setEndDate}
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                accessibilityLabel="Enter end date"
              />
            </View>
            <Paragraph style={styles.dateNote}>
              Note: If no dates are selected, the report will include the last 30 days
            </Paragraph>
            <Button 
              mode="contained" 
              onPress={generateReport} 
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              accessibilityLabel="Generate report"
            >
              Generate Report
            </Button>
          </Card.Content>
        </Card>
      </Animated.View>

      {report && (
        <Animated.View entering={FadeInDown.duration(300).delay(200)} style={styles.card}>
          <Card style={styles.cardContent}>
            <Card.Content>
              <View style={styles.reportHeader}>
                <Title style={styles.cardTitle}>Health Report</Title>
                <Button 
                  mode="contained" 
                  onPress={exportToPdf}
                  loading={isPdfExporting}
                  disabled={isPdfExporting}
                  icon="download"
                  style={styles.exportButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.exportButtonLabel}
                  accessibilityLabel="Export report as PDF"
                >
                  Export PDF
                </Button>
              </View>
              <Paragraph style={styles.reportDate}>
                Generated on: {report.generatedAt.toLocaleDateString()}
              </Paragraph>
              {report.content.map((section, index) => (
                <Animated.View key={section.id} entering={FadeInDown.duration(300).delay(200 + index * 50)} style={styles.section}>
                  {index > 0 && <Divider style={styles.divider} />}
                  <Paragraph style={styles.reportContent}>
                    {section.content}
                  </Paragraph>
                </Animated.View>
              ))}
            </Card.Content>
          </Card>
        </Animated.View>
      )}

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        action={{
          label: 'Retry',
          onPress: () => generateReport(),
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
  errorCard: {
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontFamily: theme.typography.regular.fontFamily,
    fontSize: theme.typography.regular.fontSize,
  },
  cardTitle: {
    fontFamily: theme.typography.title.fontFamily,
    fontWeight: theme.typography.title.fontWeight,
    fontSize: theme.typography.title.fontSize,
    color: theme.colors.text,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  dateInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
  },
  dateNote: {
    fontFamily: theme.typography.caption.fontFamily,
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.disabled,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  reportDate: {
    fontFamily: theme.typography.caption.fontFamily,
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.disabled,
    marginBottom: theme.spacing.md,
  },
  section: {
    marginTop: theme.spacing.md,
  },
  divider: {
    marginVertical: theme.spacing.md,
    backgroundColor: theme.colors.elevation.level1,
  },
  reportContent: {
    fontFamily: theme.typography.regular.fontFamily,
    fontSize: theme.typography.regular.fontSize,
    lineHeight: 24,
    color: theme.colors.text,
  },
  exportButton: {
    borderRadius: theme.roundness,
    elevation: 2,
    backgroundColor: theme.colors.secondary,
  },
  exportButtonLabel: {
    fontFamily: theme.typography.medium.fontFamily,
    fontSize: theme.typography.regular.fontSize,
  },
  snackbar: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.roundness,
  },
});

export default ReportScreen;