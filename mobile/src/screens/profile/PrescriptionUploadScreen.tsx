import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
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
  const [prescriptionTitle, setPrescriptionTitle] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permisiune necesară",
        "Avem nevoie de permisiunea pentru a accesa galeria foto."
      );
      return false;
    }
    return true;
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permisiune necesară",
        "Avem nevoie de permisiunea pentru a accesa camera."
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
      Alert.alert("Eroare", "Nu am putut selecta imaginile din galerie.");
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
      Alert.alert("Eroare", "Nu am putut face fotografia.");
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
    if (!prescriptionTitle.trim()) {
      Alert.alert("Eroare", "Vă rugăm introduceți titlul prescripției.");
      return;
    }

    if (selectedFiles.length === 0) {
      Alert.alert("Eroare", "Vă rugăm selectați cel puțin un fișier.");
      return;
    }

    setUploading(true);

    try {
      const API_BASE_URL = "http://localhost:8000/api/v1";
      
      // Upload each file separately
      for (const file of selectedFiles) {
        const formData = new FormData();
        
        // Create a blob from the URI
        const response = await fetch(file.uri);
        const blob = await response.blob();
        
        formData.append('file', blob, file.name);
        if (notes.trim()) {
          formData.append('notes', notes);
        }
        if (doctorName.trim()) {
          formData.append('doctor_name', doctorName);
        }
        if (prescriptionTitle.trim()) {
          formData.append('title', prescriptionTitle);
        }

        const uploadResponse = await fetch(`${API_BASE_URL}/users/me/prescriptions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status}`);
        }
      }

      Alert.alert(
        "Succes",
        "Prescripția a fost încărcată cu succes!",
        [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setSelectedFiles([]);
              setPrescriptionTitle("");
              setDoctorName("");
              setNotes("");
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert("Eroare", "Nu am putut încărca prescripția. Încercați din nou.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen scrollable={false}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Încărcare Prescripție</Text>

        <Card variant="default" padding="md">
          <Input
            label="Titlu Prescripție"
            value={prescriptionTitle}
            onChangeText={setPrescriptionTitle}
            placeholder="Ex: Prescripție vitamine"
          />
          <Input
            label="Nume Doctor"
            value={doctorName}
            onChangeText={setDoctorName}
            placeholder="Ex: Dr. Popescu"
          />
          <Input
            label="Note (opțional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Note sau instrucțiuni suplimentare"
            multiline
          />
        </Card>

        <Card variant="default" title="Selectare Fișiere" padding="md">
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickFromGallery}>
              <Text style={styles.uploadButtonText}>📷 Galerie Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
              <Text style={styles.uploadButtonText}>📸 Fă Poză</Text>
            </TouchableOpacity>
          </View>

          {selectedFiles.length > 0 && (
            <View style={styles.filesContainer}>
              <Text style={styles.filesTitle}>Fișiere selectate ({selectedFiles.length})</Text>
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
          label="Încarcă Prescripția"
          onPress={handleUpload}
          loading={uploading}
          disabled={!prescriptionTitle.trim() || selectedFiles.length === 0}
          fullWidth
        />

        <Button
          label="Vezi Prescripțiile"
          onPress={() => navigation.navigate("PrescriptionList" as any)}
          variant="outline"
          fullWidth
        />

        <Button
          label="Înapoi"
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
