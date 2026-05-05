import { useEffect, useState } from "react";
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

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { AppStackParamList } from "@/types/navigation";
import { useAuthStore } from "@/store/authStore";

type NavProp = NativeStackNavigationProp<AppStackParamList, "MainTabs">;

type Prescription = {
  id: string;
  title: string;
  doctorName?: string;
  notes?: string;
  files: {
    uri: string;
    name: string;
    type: string;
  }[];
  createdAt: string;
  status: "active" | "expired" | "completed";
};

const mockPrescriptions: Prescription[] = [
  {
    id: "1",
    title: "Vitamine D și B12",
    doctorName: "Dr. Popescu Ion",
    notes: "Luați dimineața după masă",
    files: [
      {
        uri: "https://via.placeholder.com/100x150/3B82F6/FFFFFF?text=Prescription",
        name: "prescription_1.jpg",
        type: "image/jpeg",
      },
    ],
    createdAt: "2024-03-15T10:30:00Z",
    status: "active",
  },
  {
    id: "2",
    title: "Suplimente Calciu",
    doctorName: "Dr. Ionescu Maria",
    notes: "Doar după consultație",
    files: [
      {
        uri: "https://via.placeholder.com/100x150/10B981/FFFFFF?text=Prescription",
        name: "prescription_2.jpg",
        type: "image/jpeg",
      },
      {
        uri: "https://via.placeholder.com/100x150/F59E0B/FFFFFF?text=Analysis",
        name: "analysis_1.pdf",
        type: "application/pdf",
      },
    ],
    createdAt: "2024-02-28T14:15:00Z",
    status: "active",
  },
  {
    id: "3",
    title: "Tratament sezonier",
    doctorName: "Dr. Radulescu Andrei",
    notes: "Finalizat - control necesar",
    files: [
      {
        uri: "https://via.placeholder.com/100x150/EF4444/FFFFFF?text=Prescription",
        name: "prescription_3.jpg",
        type: "image/jpeg",
      },
    ],
    createdAt: "2024-01-10T09:00:00Z",
    status: "completed",
  },
];

export const PrescriptionListScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { accessToken } = useAuthStore();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const API_BASE_URL = "http://172.20.10.4:8000/api/v1";
      const response = await fetch(`${API_BASE_URL}/users/me/prescriptions`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const transformedPrescriptions = data.map((item: any) => ({
        id: item.id.toString(),
        title: item.filename.replace(/\.[^/.]+$/, ""), // Remove file extension
        doctorName: "", // Backend doesn't store this yet
        notes: item.notes,
        files: [{
          uri: item.s3_url_or_path.startsWith('http') 
            ? item.s3_url_or_path 
            : `https://via.placeholder.com/100x150/3B82F6/FFFFFF?text=${encodeURIComponent(item.filename)}`,
          name: item.filename,
          type: item.filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        }],
        createdAt: item.uploaded_at,
        status: "active" as const, // Backend doesn't have status yet
      }));
      
      setPrescriptions(transformedPrescriptions);
    } catch (err) {
      setError("Nu am putut încărca prescripțiile. Încercați din nou.");
      console.error("Error fetching prescriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusColor = (status: Prescription["status"]): string => {
    switch (status) {
      case "active":
        return colors.success;
      case "completed":
        return colors.info;
      case "expired":
        return colors.warning;
      default:
        return colors.textPalette.secondary;
    }
  };

  const getStatusText = (status: Prescription["status"]): string => {
    switch (status) {
      case "active":
        return "Activă";
      case "completed":
        return "Finalizată";
      case "expired":
        return "Expirată";
      default:
        return "Necunoscut";
    }
  };

  const handleDeletePrescription = (prescription: Prescription) => {
    Alert.alert(
      "Confirmare ștergere",
      `Sunteți sigur că doriți să ștergeți prescripția "${prescription.title}"?`,
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Șterge",
          style: "destructive",
          onPress: () => {
            // Aici ar fi logica de ștergere
            Alert.alert("Succes", "Prescripția a fost ștearsă.");
          },
        },
      ]
    );
  };

  const handleViewFiles = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
  };

  const activePrescriptions = prescriptions.filter(p => p.status === "active");
  const completedPrescriptions = prescriptions.filter(p => p.status === "completed");
  const expiredPrescriptions = prescriptions.filter(p => p.status === "expired");

  return (
    <Screen scrollable={false}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Prescripțiile Mele</Text>

        <Button
          label="Adaugă Prescripție Nouă"
          onPress={() => navigation.navigate("PrescriptionUpload" as any)}
          fullWidth
        />

        {/* Prescripții Active */}
        {activePrescriptions.length > 0 && (
          <Card variant="default" title="Prescripții Active" padding="md">
            {activePrescriptions.map((prescription) => (
              <View key={prescription.id}>
                <TouchableOpacity
                  style={styles.prescriptionItem}
                  onPress={() => handleViewFiles(prescription)}
                >
                  <View style={styles.prescriptionHeader}>
                    <View style={styles.prescriptionInfo}>
                      <Text style={styles.prescriptionTitle}>{prescription.title}</Text>
                      {prescription.doctorName && (
                        <Text style={styles.doctorName}>Dr. {prescription.doctorName}</Text>
                      )}
                      <Text style={styles.date}>{formatDate(prescription.createdAt)}</Text>
                    </View>
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(prescription.status) }]}>
                        <Text style={styles.statusText}>{getStatusText(prescription.status)}</Text>
                      </View>
                      <Text style={styles.fileCount}>{prescription.files.length} fișiere</Text>
                    </View>
                  </View>
                  {prescription.notes && (
                    <Text style={styles.notes} numberOfLines={2}>
                      {prescription.notes}
                    </Text>
                  )}
                  <View style={styles.prescriptionFooter}>
                    <Text style={styles.viewFilesText}>Vezi fișiere</Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeletePrescription(prescription);
                      }}
                    >
                      <Text style={styles.deleteButtonText}>Șterge</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
                {activePrescriptions.indexOf(prescription) < activePrescriptions.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </Card>
        )}

        {/* Prescripții Finalizate */}
        {completedPrescriptions.length > 0 && (
          <Card variant="default" title="Finalizate" padding="md">
            {completedPrescriptions.map((prescription) => (
              <View key={prescription.id}>
                <TouchableOpacity
                  style={styles.prescriptionItem}
                  onPress={() => handleViewFiles(prescription)}
                >
                  <View style={styles.prescriptionHeader}>
                    <View style={styles.prescriptionInfo}>
                      <Text style={styles.prescriptionTitle}>{prescription.title}</Text>
                      {prescription.doctorName && (
                        <Text style={styles.doctorName}>Dr. {prescription.doctorName}</Text>
                      )}
                      <Text style={styles.date}>{formatDate(prescription.createdAt)}</Text>
                    </View>
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(prescription.status) }]}>
                        <Text style={styles.statusText}>{getStatusText(prescription.status)}</Text>
                      </View>
                      <Text style={styles.fileCount}>{prescription.files.length} fișiere</Text>
                    </View>
                  </View>
                  {prescription.notes && (
                    <Text style={styles.notes} numberOfLines={2}>
                      {prescription.notes}
                    </Text>
                  )}
                  <View style={styles.prescriptionFooter}>
                    <Text style={styles.viewFilesText}>Vezi fișiere</Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeletePrescription(prescription);
                      }}
                    >
                      <Text style={styles.deleteButtonText}>Șterge</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
                {completedPrescriptions.indexOf(prescription) < completedPrescriptions.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </Card>
        )}

        {/* Prescripții Expirate */}
        {expiredPrescriptions.length > 0 && (
          <Card variant="default" title="Expirate" padding="md">
            {expiredPrescriptions.map((prescription) => (
              <View key={prescription.id}>
                <TouchableOpacity
                  style={styles.prescriptionItem}
                  onPress={() => handleViewFiles(prescription)}
                >
                  <View style={styles.prescriptionHeader}>
                    <View style={styles.prescriptionInfo}>
                      <Text style={styles.prescriptionTitle}>{prescription.title}</Text>
                      {prescription.doctorName && (
                        <Text style={styles.doctorName}>Dr. {prescription.doctorName}</Text>
                      )}
                      <Text style={styles.date}>{formatDate(prescription.createdAt)}</Text>
                    </View>
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(prescription.status) }]}>
                        <Text style={styles.statusText}>{getStatusText(prescription.status)}</Text>
                      </View>
                      <Text style={styles.fileCount}>{prescription.files.length} fișiere</Text>
                    </View>
                  </View>
                  {prescription.notes && (
                    <Text style={styles.notes} numberOfLines={2}>
                      {prescription.notes}
                    </Text>
                  )}
                  <View style={styles.prescriptionFooter}>
                    <Text style={styles.viewFilesText}>Vezi fișiere</Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeletePrescription(prescription);
                      }}
                    >
                      <Text style={styles.deleteButtonText}>Șterge</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
                {expiredPrescriptions.indexOf(prescription) < expiredPrescriptions.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </Card>
        )}

        {/* Modal pentru vizualizare fișiere */}
        {selectedPrescription && (
          <Card variant="elevated" title={`Fișiere - ${selectedPrescription.title}`} padding="md">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filesContainer}>
                {selectedPrescription.files.map((file, index) => (
                  <View key={index} style={styles.filePreview}>
                    {file.type.startsWith("image/") ? (
                      <Image source={{ uri: file.uri }} style={styles.fileImage} />
                    ) : (
                      <View style={styles.filePlaceholder}>
                        <Text style={styles.filePlaceholderText}>📄</Text>
                      </View>
                    )}
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            <Button
              label="Închide"
              onPress={() => setSelectedPrescription(null)}
              variant="outline"
              fullWidth
            />
          </Card>
        )}

        {loading && (
          <Card variant="default" padding="md">
            <Text style={styles.emptyText}>Se încarcă prescripțiile...</Text>
          </Card>
        )}

        {error && (
          <Card variant="default" padding="md">
            <Text style={styles.errorText}>{error}</Text>
            <Button
              label="Reîncearcă"
              onPress={fetchPrescriptions}
              variant="outline"
              fullWidth
            />
          </Card>
        )}

        {!loading && !error && prescriptions.length === 0 && (
          <Card variant="default" padding="md">
            <Text style={styles.emptyText}>Nu aveți nicio prescripție încă.</Text>
            <Button
              label="Adaugă Prima Prescripție"
              onPress={() => navigation.navigate("PrescriptionUpload" as any)}
            />
          </Card>
        )}

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
  prescriptionItem: {
    paddingVertical: spacing[3],
  },
  prescriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionTitle: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: colors.textPalette.primary,
    marginBottom: spacing[1],
  },
  doctorName: {
    fontSize: typography.size.sm,
    color: colors.textPalette.secondary,
    marginBottom: spacing[1],
  },
  date: {
    fontSize: typography.size.xs,
    color: colors.textPalette.muted,
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.chip,
    marginBottom: spacing[1],
  },
  statusText: {
    color: colors.textPalette.inverse,
    fontSize: typography.size.xs,
    fontWeight: "700",
  },
  fileCount: {
    fontSize: typography.size.xs,
    color: colors.textPalette.secondary,
  },
  notes: {
    fontSize: typography.size.sm,
    color: colors.textPalette.secondary,
    marginTop: spacing[2],
    fontStyle: "italic",
  },
  prescriptionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing[2],
  },
  viewFilesText: {
    color: colors.accent.base,
    fontWeight: "600",
    fontSize: typography.size.sm,
  },
  deleteButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.sm,
    backgroundColor: colors.error,
  },
  deleteButtonText: {
    color: colors.textPalette.inverse,
    fontSize: typography.size.xs,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderPalette.muted,
    marginVertical: spacing[2],
  },
  filesContainer: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing.md,
  },
  filePreview: {
    alignItems: "center",
    width: 80,
  },
  fileImage: {
    width: 60,
    height: 80,
    borderRadius: radius.sm,
    marginBottom: spacing[1],
  },
  filePlaceholder: {
    width: 60,
    height: 80,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.borderPalette.default,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[1],
  },
  filePlaceholderText: {
    fontSize: 24,
  },
  fileName: {
    fontSize: typography.size.xs,
    color: colors.textPalette.secondary,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    color: colors.textPalette.secondary,
    marginBottom: spacing.md,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
