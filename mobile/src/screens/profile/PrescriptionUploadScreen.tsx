import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { AppStackParamList } from "@/types/navigation";
import { useAuthStore } from "@/store/authStore";

type NavProp = NativeStackNavigationProp<AppStackParamList, "MainTabs">;

type PrescriptionFile = {
  uri: string;
  name: string;
  type: string;
  size: number;
};

export const PrescriptionUploadScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { accessToken } = useAuthStore();
  const [selectedFiles, setSelectedFiles] = useState<PrescriptionFile[]>([]);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need permission to access the photo gallery."
      );
      return false;
    }
    return true;
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need permission to access the camera."
      );
      return false;
    }
    return true;
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles: PrescriptionFile[] = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
          size: asset.fileSize || 0,
        }));
        
        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not select images from gallery.");
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        const newFile: PrescriptionFile = {
          uri: result.assets[0].uri,
          name: result.assets[0].fileName || `photo_${Date.now()}.jpg`,
          type: result.assets[0].mimeType || "image/jpeg",
          size: result.assets[0].fileSize || 0,
        };
        
        setSelectedFiles((prev) => [...prev, newFile]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not take photo.");
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert("Error", "Please select at least one file.");
      return;
    }

    if (!accessToken) {
      Alert.alert("Error", "You are not authenticated");
      return;
    }

    setUploading(true);

    console.log('[Upload] Start - Uploading', selectedFiles.length, 'files');
    
    try {
      const API_BASE_URL = "http://172.20.10.4:8000/api/v1";
      
      // Upload each file separately
      for (const file of selectedFiles) {
        console.log('[Upload] Processing file:', file);
        
        const formData = new FormData();
        
        // Append file with proper structure for React Native and TypeScript
        formData.append('file', {
          uri: file.uri,
          type: file.type || 'image/jpeg',
          name: file.name,
        } as any);
        
        if (notes.trim()) {
          formData.append('notes', notes);
        }

        console.log('[Upload] Sending FormData to:', `${API_BASE_URL}/users/me/prescriptions`);
        
        // Create AbortController for timeout (React Native compatible)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const uploadResponse = await fetch(`${API_BASE_URL}/users/me/prescriptions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            // Don't set Content-Type for FormData - let React Native set it with boundary
          },
          body: formData,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        console.log('[Upload] Response status:', uploadResponse.status);

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('[Upload] Failed:', uploadResponse.status, errorText);
          throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
        }

        const result = await uploadResponse.json();
        console.log('[Upload] Success:', result);
      }

      console.log('[Upload] All files uploaded successfully');
      Alert.alert(
        "Success",
        "Prescription uploaded successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setSelectedFiles([]);
              setNotes("");
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('[Upload] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Upload] Error message:', errorMessage);
      Alert.alert("Error", `Could not upload prescription: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen scrollable={false}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Upload Prescription</Text>

        <Card variant="default" padding="md">
          <Text style={styles.notesLabel}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes or instructions"
            multiline
            textAlignVertical="top"
          />
        </Card>

        <Card variant="default" title="Select Files" padding="md">
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickFromGallery}>
              <Text style={styles.uploadButtonText}>📷 Photo Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
              <Text style={styles.uploadButtonText}>📸 Take Photo</Text>
            </TouchableOpacity>
          </View>

          {selectedFiles.length > 0 && (
            <View style={styles.filesContainer}>
              <Text style={styles.filesTitle}>Selected Files ({selectedFiles.length})</Text>
              {selectedFiles.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  <Image source={{ uri: file.uri }} style={styles.thumbnail} />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFile(index)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Button
          label="Upload Prescription"
          onPress={handleUpload}
          loading={uploading}
          disabled={selectedFiles.length === 0}
          fullWidth
        />

        <Button
          label="View Prescriptions"
          onPress={() => navigation.navigate("PrescriptionList" as any)}
          variant="outline"
          fullWidth
        />

        <Button
          label="Back"
          onPress={() => navigation.goBack()}
          variant="ghost"
          fullWidth
        />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingBottom: spacing["2xl"],
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPalette.primary,
    marginTop: spacing[3],
  },
  notesLabel: {
    ...typography.styles.label,
    marginBottom: spacing[2],
  },
  notesInput: {
    borderWidth: 0,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: spacing[3],
    minHeight: 100,
    textAlignVertical: "top",
    fontSize: typography.size.base,
    color: colors.textPalette.primary,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: colors.accent.muted,
    borderWidth: 1,
    borderColor: colors.accent.base,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  uploadButtonText: {
    color: colors.accent.base,
    fontWeight: "600",
    fontSize: typography.size.sm,
  },
  filesContainer: {
    marginTop: spacing.md,
  },
  filesTitle: {
    ...typography.styles.h3,
    marginBottom: spacing.sm,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: radius.sm,
    marginRight: spacing[3],
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.textPalette.primary,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: typography.size.xs,
    color: colors.textPalette.secondary,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    color: colors.textPalette.inverse,
    fontSize: 12,
    fontWeight: "700",
  },
});
