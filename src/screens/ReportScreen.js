import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { 
  Button, Card, Title, Paragraph, Divider, Text,
  ActivityIndicator, Snackbar, Surface, Chip,
  Dialog, Portal
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DatePickerModal } from 'react-native-paper-dates';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { api } from '../services/api';
import { theme } from '../theme/theme';
import { useContext } from 'react';
import { UserContext } from '../../App';

// Use require for the logo
const logoImage = require('../../assets/logo.png');

// Constants for PDF styling
const THEME_COLOR = theme.colors.primary;
const ACCENT_COLOR = theme.colors.secondary;
const LIGHT_GRAY = theme.colors.surface;
const DARK_GRAY = theme.colors.disabled;
const PAGE_MARGIN = 20;
const CONTENT_WIDTH = 170;

// Define fonts
const fonts = {
  Roboto: {
    normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
    bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf',
    italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf',
    bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf'
  }
};

function ReportScreen() {
  const insets = useSafeAreaInsets();
  const { getUserId } = useContext(UserContext);
  
  // Function to safely get the user ID with a fallback
  const getUserIdSafe = () => {
    const userId = getUserId();
    return userId; // Fallback for development only
  };
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [error, setError] = useState(null);
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showPdfOptions, setShowPdfOptions] = useState(false);
  const [savedPdfPath, setSavedPdfPath] = useState(null);

  // Setup network state listeners
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setIsOnline(isConnected);
    });

    // Initial network check
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Load and convert logo on component mount
  useEffect(() => {
    const loadLogo = async () => {
      try {
        // Fetch the logo as a blob
        const response = await fetch(logoImage);
        const blob = await response.blob();
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoDataUrl(reader.result);
        };
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
        const cleanSection = section
          .replace(/\\n/g, '\n')
          .replace(/\*\*/g, '')
          .trim();
        
        return {
          id: index,
          content: cleanSection
        };
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
      
      // Check network connection
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected || !netInfo.isInternetReachable) {
        setError('No Internet connection. Please check your network and try again.');
        return;
      }
      
      if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        setError('End date cannot be earlier than start date.');
        return;
      }

      const userId = getUserIdSafe();
      const reportData = await api.generateReport(userId, startDate, endDate, 'summary');
  
      setReport({
        content: formatReportContent(reportData),
        generatedAt: new Date()
      });
    } catch (error) {
      console.error('Error generating report:', error);
  
      if (error.status === 404) {
        setError('No health data found for the selected date range. Please try a different date range.');
      } else if (error.status === 500) {
        setError('The AI Report Generator encountered a problem. Please try again later.');
      } else {
        setError('Unexpected error. Please check your connection and try again.');
      }
  
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileNameWithDate = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    return `health-report-${dateStr}.pdf`;
  };

  const getDownloadPath = () => {
    // Get the appropriate directory for the platform
    return `${FileSystem.documentDirectory}${getFileNameWithDate()}`;
  };

  const savePdfToDevice = async (pdfBase64) => {
    try {
      const filePath = getDownloadPath();
      
      // Write the base64 PDF data to a file
      await FileSystem.writeAsStringAsync(filePath, pdfBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Update state with the saved file path
      setSavedPdfPath(filePath);
      
      return filePath;
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw error;
    }
  };

  const viewPdf = async (filePath) => {
    try {
      // Check if sharing is available
      const canShare = await Sharing.isAvailableAsync();
      
      if (canShare) {
        // Share the PDF file which allows viewing it
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/pdf',
          dialogTitle: 'View Health Report',
          UTI: 'com.adobe.pdf', // iOS-specific
        });
      } else {
        // On Android, we can use IntentLauncher as a fallback
        if (Platform.OS === 'android') {
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: filePath,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            type: 'application/pdf',
          });
        } else {
          // For iOS, if sharing isn't available, show an error
          Alert.alert(
            'Cannot Open PDF',
            'Your device cannot open the PDF file directly. Please use the Share option to open it in another app.'
          );
        }
      }
    } catch (error) {
      console.error('Error viewing PDF:', error);
      setError('Could not open the PDF. Please try again.');
    }
  };

  const sharePdf = async (filePath) => {
    try {
      // Check if sharing is available
      const canShare = await Sharing.isAvailableAsync();
      
      if (canShare) {
        // Share the PDF file
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Health Report',
          UTI: 'com.adobe.pdf', // iOS-specific
        });
      } else {
        Alert.alert(
          'Sharing Not Available',
          'Sharing is not available on this device.'
        );
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      setError('Could not share the PDF. Please try again.');
    }
  };

  const exportToPdf = async () => {
    try {
      setIsPdfExporting(true);
      setError(null);

      // Check network connection
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected || !netInfo.isInternetReachable) {
        setError('No Internet connection. Please check your network and try again.');
        return;
      }

      // Import pdfmake dynamically
      const pdfMake = (await import('pdfmake/build/pdfmake')).default;

      // Process sections
      const sections = report.content.map(section => {
        const lines = section.content.split('\n');
        const title = lines[0].trim();
        // Process content to create proper paragraphs and lists
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

      // Define document definition
      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        
        header: {
          stack: [
            {
              canvas: [
                {
                  type: 'rect',
                  x: 0,
                  y: 0,
                  w: 595.28,
                  h: 60,
                  color: THEME_COLOR,
                }
              ]
            },
            {
              text: 'HEALTH REPORT',
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
                canvas: [
                  {
                    type: 'line',
                    x1: 40,
                    y1: -30,
                    x2: 555.28,
                    y2: -30,
                    lineWidth: 1,
                    lineColor: THEME_COLOR
                  }
                ]
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
          // Report info
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
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 10,
                    x2: 515.28,
                    y2: 10,
                    lineWidth: 1,
                    lineColor: THEME_COLOR
                  }
                ]
              }
            ]
          },

          // Sections
          ...sections.map((section, index) => ({
            stack: [
              // Section header
              {
                margin: [0, 20, 0, 0],
                columns: [
                  {
                    canvas: [
                      {
                        type: 'rect',
                        x: 0,
                        y: 0,
                        w: 4,
                        h: 24,
                        color: ACCENT_COLOR
                      }
                    ],
                    width: 4
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
              // Section content
              {
                stack: section.content.map(line => {
                  if (line.startsWith('*')) {
                    return {
                      margin: [15, 5, 0, 5],
                      columns: [
                        {
                          text: '•',
                          width: 15,
                          color: ACCENT_COLOR,
                          fontSize: 11
                        },
                        {
                          text: line.substring(1).trim(),
                          fontSize: 11,
                          color: '#333333'
                        }
                      ]
                    };
                  }
                  return {
                    text: line,
                    fontSize: 11,
                    lineHeight: 1.4,
                    margin: [0, 8, 0, 8],
                    color: '#333333'
                  };
                }),
                margin: [15, 10, 0, 0]
              },
              index < sections.length - 1 ? {
                canvas: [
                  {
                    type: 'line',
                    x1: 0,
                    y1: 20,
                    x2: 515.28,
                    y2: 20,
                    lineWidth: 0.5,
                    lineColor: '#e0e0e0'
                  }
                ],
                margin: [0, 10, 0, 10]
              } : {}
            ]
          }))
        ],

        defaultStyle: {
          font: 'Roboto'
        }
      };

      // Create PDF with custom fonts
      const pdf = pdfMake.createPdf(docDefinition, null, fonts);
      
      // Get PDF as base64
      pdf.getBase64(async (base64Data) => {
        try {
          // Save the PDF to the device
          const filePath = await savePdfToDevice(base64Data);
          
          // Show success message and options to view or share
          Alert.alert(
            'PDF Saved Successfully',
            `Your report has been saved as ${getFileNameWithDate()}`,
            [
              { 
                text: 'Open', 
                onPress: () => viewPdf(filePath) 
              },
              { 
                text: 'Share', 
                onPress: () => sharePdf(filePath) 
              },
              { 
                text: 'Close', 
                style: 'cancel' 
              }
            ]
          );
        } catch (error) {
          console.error('Error in PDF export process:', error);
          setError(`Failed to save PDF: ${error.message}`);
        } finally {
          setIsPdfExporting(false);
        }
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      setError(`Failed to export PDF: ${error.message}`);
      setIsPdfExporting(false);
    }
  };
  
  const onDismissDatePicker = () => {
    setDatePickerVisible(false);
  };

  const onConfirmDatePicker = ({ startDate: start, endDate: end }) => {
    setDatePickerVisible(false);
    
    // Format dates for the API
    const formatDate = (date) => {
      if (!date) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setStartDate(start ? formatDate(start) : '');
    setEndDate(end ? formatDate(end) : '');
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleExportButtonPress = () => {
    if (savedPdfPath) {
      setShowPdfOptions(true);
    } else {
      exportToPdf();
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
    >
      {!isOnline && (
        <View>
          <Surface style={styles.offlineBanner}>
            <Ionicons name="cloud-offline" size={18} color="#fff" />
            <Text style={styles.offlineText}>You are offline</Text>
          </Surface>
        </View>
      )}

      {error && (
        <View>
          <Card style={[styles.errorCard]}>
            <Card.Content>
              <View style={styles.errorContent}>
                <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

      <View>
        <Surface style={styles.headerCard}>
          <View style={styles.headerContent}>
            <Image 
              source={logoImage} 
              style={styles.headerLogo} 
              resizeMode="contain"
            />
            <View>
              <Text style={styles.headerTitle}>Health Reports</Text>
              <Text style={styles.headerSubtitle}>
                Get AI-generated insights about your health
              </Text>
            </View>
          </View>
        </Surface>
      </View>

      <View>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Generate Health Report</Title>
            <Text style={styles.cardSubtitle}>
              Select a date range to generate a comprehensive health report
            </Text>
            
            <TouchableOpacity 
              style={styles.dateSelector}
              onPress={() => setDatePickerVisible(true)}
            >
              <View style={styles.dateSelectorContent}>
                <Ionicons name="calendar" size={24} color={theme.colors.primary} />
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>Date Range</Text>
                  <Text style={styles.dateValue}>
                    {startDate || endDate ? 
                      `${formatDisplayDate(startDate) || 'All'} to ${formatDisplayDate(endDate) || 'Present'}` : 
                      'Select dates (optional)'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.disabled} />
            </TouchableOpacity>
            
            <Text style={styles.dateNote}>
              Note: If no dates are selected, the report will include data from the last 30 days
            </Text>
            
            <Button 
              mode="contained" 
              onPress={generateReport} 
              loading={isLoading}
              disabled={isLoading}
              style={styles.generateButton}
              icon="file-document-outline"
              contentStyle={styles.buttonContent}
            >
              Generate Report
            </Button>
          </Card.Content>
        </Card>
      </View>

      {report && (
        <View>
          <Card style={styles.reportCard}>
            <Card.Content>
              <View style={styles.reportHeader}>
                <View>
                  <Title style={styles.reportTitle}>Health Report</Title>
                  <Text style={styles.reportDate}>
                    Generated on: {report.generatedAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                <Button 
                  mode="contained" 
                  onPress={handleExportButtonPress}
                  loading={isPdfExporting}
                  disabled={isPdfExporting}
                  icon="download"
                  compact
                  style={styles.exportButton}
                  labelStyle={styles.exportButtonLabel}
                >
                  {savedPdfPath ? 'View PDF' : 'Export PDF'}
                </Button>
              </View>
              
              <Divider style={styles.divider} />
              
              {report.content.map((section, index) => {
                // Extract title and content from section
                const lines = section.content.split('\n');
                const title = lines[0];
                const content = lines.slice(1).join('\n');
                
                return (
                  <View 
                    key={section.id} 
                    style={styles.section}
                  >
                    {index > 0 && <Divider style={styles.sectionDivider} />}
                    <View style={styles.sectionTitleContainer}>
                      <View style={styles.sectionTitleBar} />
                      <Text style={styles.sectionTitle}>{title}</Text>
                    </View>
                    <Text style={styles.reportContent}>
                      {content}
                    </Text>
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        </View>
      )}

      <DatePickerModal
        locale="en"
        mode="range"
        visible={datePickerVisible}
        onDismiss={onDismissDatePicker}
        startDate={startDate ? new Date(startDate) : undefined}
        endDate={endDate ? new Date(endDate) : undefined}
        onConfirm={onConfirmDatePicker}
        saveLabel="Confirm"
        startLabel="Start date"
        endLabel="End date"
      />

      <Portal>
        <Dialog
          visible={showPdfOptions}
          onDismiss={() => setShowPdfOptions(false)}
          style={styles.dialog}
        >
          <Dialog.Title>PDF Options</Dialog.Title>
          <Dialog.Content>
            <Text>What would you like to do with your health report?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => {
                setShowPdfOptions(false);
                viewPdf(savedPdfPath);
              }}
              icon="eye"
              style={styles.dialogButton}
            >
              View PDF
            </Button>
            <Button 
              onPress={() => {
                setShowPdfOptions(false);
                sharePdf(savedPdfPath);
              }}
              icon="share-variant"
              style={styles.dialogButton}
            >
              Share
            </Button>
            <Button 
              onPress={() => {
                setShowPdfOptions(false);
                exportToPdf();
              }}
              icon="file-export"
              style={styles.dialogButton}
            >
              Export New
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        action={{
          label: 'Dismiss',
          onPress: () => setError(null),
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
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  headerCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  headerLogo: {
    width: 48,
    height: 48,
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  headerSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.disabled,
  },
  card: {
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    ...theme.shadows.medium,
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.error,
    ...theme.typography.body2,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  cardSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.disabled,
    marginBottom: theme.spacing.md,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness / 2,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  dateSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTextContainer: {
    marginLeft: theme.spacing.md,
  },
  dateLabel: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  dateValue: {
    ...theme.typography.body2,
    color: theme.colors.text,
  },
  dateNote: {
    ...theme.typography.caption,
    color: theme.colors.disabled,
    fontStyle: 'italic',
    marginBottom: theme.spacing.md,
  },
  generateButton: {
    marginTop: theme.spacing.sm,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
  reportCard: {
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.background,
    ...theme.shadows.medium,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  reportTitle: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  reportDate: {
    ...theme.typography.caption,
    color: theme.colors.disabled,
  },
  exportButton: {
    backgroundColor: theme.colors.secondary,
  },
  exportButtonLabel: {
    ...theme.typography.caption,
    fontWeight: 'bold',
  },
  divider: {
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionDivider: {
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitleBar: {
    width: 4,
    height: 20,
    backgroundColor: theme.colors.secondary,
    borderRadius: 2,
    marginRight: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.h3,
    fontSize: 18,
    color: theme.colors.text,
  },
  reportContent: {
    ...theme.typography.body2,
    color: theme.colors.text,
    lineHeight: 22,
  },
  snackbar: {
    backgroundColor: theme.colors.error,
  },
  offlineBanner: {
    backgroundColor: theme.colors.error,
    padding: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    borderRadius: theme.roundness,
  },
  offlineText: {
    color: '#fff',
    ...theme.typography.medium,
    marginLeft: theme.spacing.xs,
  },
  dialog: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
  },
  dialogButton: {
    marginHorizontal: theme.spacing.xs,
  },
});

export default ReportScreen;