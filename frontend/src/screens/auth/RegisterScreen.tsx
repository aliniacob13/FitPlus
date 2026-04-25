import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { api } from '../../lib/api';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      console.log("Attempting registration...");
      
      // Sending data to your FastAPI backend
      const response = await api.post('/auth/register', {
        email: email,
        password: password,
        full_name: fullName, // Make sure this matches your backend schema!
      });

      console.log("Registration Successful:", response.data);
      Alert.alert(
        'Success', 
        'Account created! You can now log in.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login' as never) }]
      );

    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message;
      console.log("Register Error:", errorMsg);
      Alert.alert('Registration Failed', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>Join FitPlus</Text>
        <Text style={styles.subtitle}>Start your journey today.</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#888"
          value={fullName}
          onChangeText={setFullName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login' as never)}
        >
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', justifyContent: 'center' },
  formContainer: { paddingHorizontal: 30 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#c5f135', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#aaa', marginBottom: 40, textAlign: 'center' },
  input: { backgroundColor: '#222', color: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#333' },
  button: { backgroundColor: '#c5f135', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#111', fontSize: 18, fontWeight: 'bold' },
  loginLink: { marginTop: 24, alignItems: 'center' },
  loginText: { color: '#aaa', fontSize: 14 },
  loginTextBold: { color: '#c5f135', fontWeight: 'bold' },
});
