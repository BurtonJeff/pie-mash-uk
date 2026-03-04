import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { signInWithEmail, signInWithGoogle, signInWithApple } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import {
  isBiometricsAvailable,
  isBiometricsEnabled,
  getBiometricLabel,
  authenticate,
  enableBiometrics,
  disableBiometrics,
} from '../../lib/biometrics';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export default function SignInScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioLabel, setBioLabel] = useState('Biometrics');

  useEffect(() => {
    (async () => {
      const available = await isBiometricsAvailable();
      if (!available) return;
      const enabled = await isBiometricsEnabled();
      const label = await getBiometricLabel();
      setBioAvailable(true);
      setBioEnabled(enabled);
      setBioLabel(label);
    })();
  }, []);

  async function handleEmailSignIn() {
    if (!email || !password) return;
    setLoading(true);
    try {
      await signInWithEmail(email, password);

      // Offer to enable biometrics if available but not yet set up
      if (bioAvailable && !bioEnabled) {
        const { data } = await supabase.auth.getSession();
        const refreshToken = data.session?.refresh_token;
        if (refreshToken) {
          Alert.alert(
            `Enable ${bioLabel}?`,
            `Sign in faster next time using ${bioLabel} instead of your password.`,
            [
              { text: 'Not now', style: 'cancel' },
              {
                text: 'Enable',
                onPress: async () => {
                  await enableBiometrics(refreshToken);
                  setBioEnabled(true);
                },
              },
            ],
          );
        }
      }
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometricSignIn() {
    setLoading(true);
    try {
      const success = await authenticate(bioLabel);
      if (!success) {
        setLoading(false);
        return;
      }

      const { getBiometricRefreshToken } = await import('../../lib/biometrics');
      const refreshToken = await getBiometricRefreshToken();
      if (!refreshToken) {
        Alert.alert('Sign in failed', 'Biometric credentials not found. Please sign in with your password.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
      if (error) {
        // Refresh token expired — clear biometrics and ask user to sign in normally
        await disableBiometrics();
        setBioEnabled(false);
        Alert.alert('Session expired', 'Please sign in with your password to re-enable biometric login.');
      }
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert('Google sign in failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApple() {
    setLoading(true);
    try {
      await signInWithApple();
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple sign in failed', e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Pie & Mash</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {/* Biometric quick sign-in */}
        {bioEnabled && (
          <TouchableOpacity style={styles.bioButton} onPress={handleBiometricSignIn} disabled={loading}>
            <Ionicons
              name={bioLabel === 'Face ID' ? 'scan-outline' : 'finger-print-outline'}
              size={24}
              color="#2D5016"
            />
            <Text style={styles.bioButtonText}>Sign in with {bioLabel}</Text>
          </TouchableOpacity>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
        />

        <TouchableOpacity
          style={styles.forgotLink}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotLinkText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleEmailSignIn} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.oauthButton} onPress={handleGoogle} disabled={loading}>
          <Text style={styles.oauthButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity style={[styles.oauthButton, styles.appleButton]} onPress={handleApple} disabled={loading}>
            <Text style={[styles.oauthButtonText, styles.appleButtonText]}>Continue with Apple</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.link}>
          <Text style={styles.linkText}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },

  bioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#2D5016',
    borderRadius: 8,
    padding: 14,
    marginBottom: 24,
  },
  bioButtonText: { fontSize: 16, fontWeight: '600', color: '#2D5016' },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2D5016',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#ddd' },
  dividerText: { marginHorizontal: 12, color: '#999' },
  oauthButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  oauthButtonText: { fontSize: 16, fontWeight: '500' },
  appleButton: { backgroundColor: '#000', borderColor: '#000' },
  appleButtonText: { color: '#fff' },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotLinkText: { color: '#2D5016', fontSize: 14 },
  link: { alignItems: 'center', marginTop: 8 },
  linkText: { color: '#2D5016', fontSize: 15 },
});
