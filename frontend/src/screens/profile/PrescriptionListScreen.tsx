import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { api } from '../../lib/api';
import { Card, Button } from '../../components/ui';
import { colors, typography, spacing, radius } from '../../theme';

type Prescription = {
  id: string;
  title: string;
  doctor_name?: string;
  notes?: string;
  filename: string;
  s3_url_or_path: string;
  uploaded_at: string;
};

export default function PrescriptionListScreen() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/users/me/prescriptions');
      setPrescriptions(response.data);
    } catch (err: any) {
      setError('Could not load prescriptions. Please try again.');
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const buildImageUrl = (path: string): string => {
    if (path.startsWith('http')) {
      return path;
    }
    
    // Extract filename from absolute Windows path
    let filename = path;
    if (path.includes('\\') || path.includes('C:')) {
      const pathParts = path.split('\\');
      filename = pathParts[pathParts.length - 1];
    } else if (path.includes('/')) {
      const pathParts = path.split('/');
      filename = pathParts[pathParts.length - 1];
    }
    
    // Build URL using FastAPI static files endpoint
    const baseUrl = 'http://172.20.10.4:8000';
    return `${baseUrl}/uploads/${filename}`;
  };

  const handleDeletePrescription = (prescription: Prescription) => {
    console.log('Delete Button Clicked');
    if (window.confirm(`Are you sure you want to delete the prescription "${prescription.title}"?`)) {
      deletePrescription(prescription);
    }
  };

  const deletePrescription = async (prescription: Prescription) => {
    try {
      await api.delete(`/users/me/prescriptions/${prescription.id}`);
      setPrescriptions((prev: any[]) => prev.filter((p: any) => p.id !== prescription.id));
      alert('Prescription deleted successfully.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Could not delete prescription';
      alert(errorMessage);
    }
  };

  const handleViewFiles = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>My Prescriptions</Text>

      <Button
        label="Add New Prescription"
        onPress={() => {
          console.log('Add Button Clicked');
          alert('Navigate to Prescription Upload');
        }}
        variant="primary"
        size="lg"
        fullWidth
        style={styles.addButton}
      />

      {loading && (
        <Card variant="default" padding="md">
          <Text style={styles.emptyText}>Loading prescriptions...</Text>
        </Card>
      )}

      {error && (
        <Card variant="default" padding="md">
          <Text style={styles.errorText}>{error}</Text>
          <Button
            label="Retry"
            onPress={fetchPrescriptions}
            variant="outline"
            fullWidth
          />
        </Card>
      )}

      {!loading && !error && prescriptions.length === 0 && (
        <Card variant="default" padding="md">
          <Text style={styles.emptyText}>You don't have any prescriptions yet.</Text>
          <Button
            label="Add First Prescription"
            onPress={() => alert('Navigate to Prescription Upload')}
            variant="primary"
            fullWidth
          />
        </Card>
      )}

      {prescriptions.map((prescription: any) => (
        <Card key={prescription.id} variant="default" padding="md" style={styles.prescriptionCard}>
          <View style={styles.prescriptionHeader}>
            <View style={styles.prescriptionInfo}>
              <Text style={styles.prescriptionTitle}>{prescription.title}</Text>
              {prescription.doctor_name && (
                <Text style={styles.doctorName}>Dr. {prescription.doctor_name}</Text>
              )}
              <Text style={styles.date}>{formatDate(prescription.uploaded_at)}</Text>
            </View>
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
          </View>
          
          {prescription.notes && (
            <Text style={styles.notes} numberOfLines={2}>
              {prescription.notes}
            </Text>
          )}
          
          <View style={styles.prescriptionFooter}>
            <TouchableOpacity
              style={styles.viewFilesBtn}
              onPress={() => handleViewFiles(prescription)}
            >
              <Text style={styles.viewFilesText}>View Files</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePrescription(prescription)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      <Button
        label="Back"
        onPress={() => alert('Go back')}
        variant="ghost"
        fullWidth
      />

      {/* Modal for viewing files */}
      {selectedPrescription && (
        <Modal
          visible={true}
          animationType="slide"
          onRequestClose={() => setSelectedPrescription(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Files - {selectedPrescription.title}</Text>
              <TouchableOpacity onPress={() => setSelectedPrescription(null)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: buildImageUrl(selectedPrescription.s3_url_or_path) }} 
                style={styles.fileImage}
                resizeMode="contain"
              />
            </View>
            
            <View style={styles.modalFooter}>
              <Text style={styles.fileName}>{selectedPrescription.filename}</Text>
              <Button
                label="Close"
                onPress={() => setSelectedPrescription(null)}
                variant="outline"
                fullWidth
              />
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scroll: {
    padding: spacing.screen,
    paddingBottom: spacing['2xl'],
  },
  title: {
    ...typography.styles.h1,
    marginBottom: spacing.xl,
  },
  addButton: {
    marginBottom: spacing.lg,
  },
  prescriptionCard: {
    marginBottom: spacing.md,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionTitle: {
    ...typography.styles.h3,
    marginBottom: spacing[1],
  },
  doctorName: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[1],
  },
  date: {
    ...typography.styles.caption,
    color: colors.text.muted,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.chip,
  },
  statusText: {
    ...typography.styles.caption,
    color: colors.text.inverse,
    fontWeight: '700',
  },
  notes: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  prescriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewFilesBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  viewFilesText: {
    ...typography.styles.bodySmall,
    color: colors.accent.base,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.sm,
    backgroundColor: colors.error,
  },
  deleteButtonText: {
    ...typography.styles.caption,
    color: colors.text.inverse,
    fontWeight: '700',
  },
  emptyText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.styles.body,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
  },
  closeBtn: {
    fontSize: 24,
    color: colors.text.primary,
    fontWeight: '700',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    marginVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileImage: {
    flex: 1,
    width: '100%',
    borderRadius: 15,
  },
  modalFooter: {
    paddingBottom: spacing.lg,
  },
  fileName: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
