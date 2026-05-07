import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { api } from '../../lib/api';
import { Card, Button } from '../../components/ui';
import { colors, typography, spacing, radius } from '../../theme';

export default function PrescriptionUploadScreen() {
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = () => {
    // For Web, we'll use a simple file input approach
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setSelectedFile(file);
      }
    };
    input.click();
  };

  const handleUpload = async () => {
    console.log('Upload Button Clicked');
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file to upload.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      if (notes.trim()) {
        formData.append('notes', notes);
      }

      const response = await api.post('/users/me/prescriptions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert(
        'Success',
        'Prescription uploaded successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSelectedFile(null);
              setNotes('');
              alert('Navigate to Prescription List');
            },
          },
        ]
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Could not upload prescription';
      Alert.alert('Error', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Upload Prescription</Text>

      <Card variant="default" padding="md">
        <Text style={styles.notesLabel}>Notes (optional)</Text>
        <View style={styles.notesInputContainer}>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes or instructions"
            multiline
            numberOfLines={4}
          />
        </View>
      </Card>

      <Card variant="default" title="Select File" padding="md">
        <TouchableOpacity style={styles.uploadButton} onPress={handleFileSelect}>
          <Text style={styles.uploadButtonText}>📷 Choose File</Text>
        </TouchableOpacity>

        {selectedFile && (
          <View style={styles.fileContainer}>
            <Text style={styles.fileTitle}>Selected File:</Text>
            <View style={styles.fileItem}>
              <Text style={styles.fileName}>{selectedFile.name}</Text>
              <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setSelectedFile(null)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Card>

      <Button
        label="Upload Prescription"
        onPress={handleUpload}
        loading={uploading}
        disabled={!selectedFile}
        variant="primary"
        size="lg"
        fullWidth
        style={styles.uploadBtn}
      />

      <Button
        label="View Prescriptions"
        onPress={() => alert('Navigate to Prescription List')}
        variant="outline"
        fullWidth
        style={styles.viewBtn}
      />

      <Button
        label="Back"
        onPress={() => alert('Go back')}
        variant="ghost"
        fullWidth
      />
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
  notesLabel: {
    ...typography.styles.label,
    marginBottom: spacing[2],
  },
  notesInputContainer: {
    marginBottom: spacing.md,
  },
  notesInput: {
    borderWidth: 1,
    backgroundColor: '#1E1E1E',
    borderColor: '#B4E61E',
    borderRadius: 8,
    padding: spacing[3],
    minHeight: 100,
    fontSize: typography.size.base,
    color: '#FFFFFF',
    fontFamily: typography.family.base,
  },
  uploadButton: {
    backgroundColor: colors.accent.muted,
    borderWidth: 1,
    borderColor: colors.accent.base,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  uploadButtonText: {
    color: colors.accent.base,
    fontWeight: '600',
    fontSize: typography.size.sm,
  },
  fileContainer: {
    marginTop: spacing.md,
  },
  fileTitle: {
    ...typography.styles.label,
    marginBottom: spacing.sm,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  fileName: {
    ...typography.styles.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  fileSize: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginRight: spacing[3],
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '700',
  },
  uploadBtn: {
    marginBottom: spacing.md,
  },
  viewBtn: {
    marginBottom: spacing.md,
  },
});
