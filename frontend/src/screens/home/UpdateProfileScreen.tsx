import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { api } from '../../lib/api';
import { useUserStore } from '../../lib/userStore';
import { useNavigation } from '@react-navigation/native';

export default function UpdateProfileScreen() {
  const user = useUserStore((state) => state.user);
  const login = useUserStore((state) => state.login);
  const token = useUserStore((state) => state.token);
  const navigation = useNavigation();

  // Initialize state with existing user data if available
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [weight, setWeight] = useState(user?.weight?.toString() || '');
  const [height, setHeight] = useState(user?.height?.toString() || '');
  const [goals, setGoals] = useState(user?.fitness_goals || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      // The payload matches the UserProfileUpdateRequest schema
      const payload = {
        full_name: fullName,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        fitness_goals: goals
      };

      const response = await api.put('/users/me', payload); // Hits the route in users.py
      
      // Update the global store with the new data returned by the server
      if (token) {
        await login(response.data, token);
      }

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "Could not update profile";
      Alert.alert('Update Failed', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Fitness Profile</Text>
      <Text style={styles.subtitle}>Help us customize your workout plan.</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput 
          style={styles.input} 
          value={fullName} 
          onChangeText={setFullName} 
          placeholder="Your Name"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput 
            style={styles.input} 
            value={weight} 
            onChangeText={setWeight} 
            keyboardType="numeric"
            placeholder="70"
            placeholderTextColor="#666"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Height (cm)</Text>
          <TextInput 
            style={styles.input} 
            value={height} 
            onChangeText={setHeight} 
            keyboardType="numeric"
            placeholder="180"
            placeholderTextColor="#666"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Fitness Goals</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={goals} 
          onChangeText={setGoals} 
          multiline
          numberOfLines={4}
          placeholder="e.g., Lose weight, build muscle, improve cardio..."
          placeholderTextColor="#666"
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleUpdate} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#111" /> : <Text style={styles.saveButtonText}>Save Profile</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  content: { padding: 25, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#c5f135', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#aaa', marginBottom: 30 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#222', color: '#fff', borderRadius: 12, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#333' },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  saveButton: { backgroundColor: '#c5f135', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#111', fontSize: 18, fontWeight: 'bold' },
  backButton: { marginTop: 20, alignItems: 'center' },
  backButtonText: { color: '#888', fontSize: 14 },
});
