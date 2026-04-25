import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
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
import * as SecureStore from 'expo-secure-store'; // Added this!
import { useUserStore } from '../../lib/userStore';
import { api } from '../../lib/api';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const login = useUserStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      console.log("Attempting login...");
      const response = await api.post('/auth/login', {
        email: email,
        password: password,
      });

      const token = response.data.access_token; 
      console.log("Login Success! Token received.");

      // 1. Save the token immediately
      await SecureStore.setItemAsync('jwt_token', token);

      // 2. THE REAL PART: Ask the backend for the current user profile
      // We pass the token in the headers so the backend knows who we are
      const userResponse = await api.get('/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const realUser = userResponse.data;
      console.log("Real user profile fetched:", realUser.email);

      // 3. Log in to the global state with the REAL data
      await login(realUser, token);
      console.log("Zustand updated with real user. Navigating...");

    
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message;
      console.log("Login Error Detail:", errorMsg);
      Alert.alert('Login Failed', errorMsg);
    } finally {
      setIsLoading(false); // Reset the button state
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>FitPlus</Text>
        <Text style={styles.subtitle}>Welcome back. Ready to sweat?</Text>

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
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

       <TouchableOpacity 
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register' as never)} // Add this!
        >
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.registerTextBold}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#c5f135', 
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#c5f135',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#111',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    color: '#aaa',
    fontSize: 14,
  },
  registerTextBold: {
    color: '#c5f135',
    fontWeight: 'bold',
  },
});