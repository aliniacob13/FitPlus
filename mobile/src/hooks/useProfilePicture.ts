/**
 * useProfilePicture
 *
 * Handles picking a profile photo (camera or library) and persisting the
 * image URI between app sessions using expo-secure-store.
 *
 * No extra packages needed — uses expo-image-picker and expo-secure-store,
 * both already installed in the project.
 */

import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "fitplus_profile_picture_uri";

// expo-secure-store is not available on web — fall back to localStorage.
const storage = {
  get: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  set: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  delete: async (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

type UseProfilePictureReturn = {
  /** URI of the current profile picture, or null if none set */
  imageUri: string | null;
  /** Open an action sheet to choose camera or library */
  pickImage: () => void;
  /** Remove the profile picture */
  removeImage: () => void;
  /** True while loading the stored URI on mount */
  loading: boolean;
};

export const useProfilePicture = (): UseProfilePictureReturn => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Load persisted URI on mount ───────────────────────────────────────────

  useEffect(() => {
    void (async () => {
      try {
        const stored = await storage.get(STORAGE_KEY);
        if (stored) setImageUri(stored);
      } catch {
        // Ignore — secure store unavailable
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const saveUri = async (uri: string) => {
    setImageUri(uri);
    try {
      await storage.set(STORAGE_KEY, uri);
    } catch {
      // URI shown in UI even if persistence fails
    }
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera access needed",
        "Please allow camera access in Settings to take a profile photo.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await saveUri(result.assets[0].uri);
    }
  };

  const launchLibrary = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Photo library access needed",
        "Please allow photo library access in Settings to choose a profile photo.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await saveUri(result.assets[0].uri);
    }
  };

  // ── pickImage — shows action sheet ────────────────────────────────────────

  const pickImage = useCallback(() => {
    // Web doesn't support camera — go straight to library.
    if (Platform.OS === "web") {
      void launchLibrary();
      return;
    }

    Alert.alert(
      "Profile Photo",
      "Choose how to add your photo",
      [
        {
          text: "Take Photo",
          onPress: () => void launchCamera(),
        },
        {
          text: "Choose from Library",
          onPress: () => void launchLibrary(),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true },
    );
  }, []);

  // ── removeImage ───────────────────────────────────────────────────────────

  const removeImage = useCallback(() => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove your profile photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setImageUri(null);
            try {
              await storage.delete(STORAGE_KEY);
            } catch {
              // ignore
            }
          },
        },
      ],
    );
  }, []);

  return { imageUri, pickImage, removeImage, loading };
};
