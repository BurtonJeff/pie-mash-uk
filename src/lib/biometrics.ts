import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ENABLED_KEY = 'biometricsEnabled';
const REFRESH_TOKEN_KEY = 'biometricRefreshToken';

/** True if the device has biometric hardware AND at least one enrolled identity. */
export async function isBiometricsAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  return LocalAuthentication.isEnrolledAsync();
}

/** Returns the human-readable label for the available biometric type. */
export async function getBiometricLabel(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }
  return 'Touch ID';
}

/** Prompts the user for biometric authentication. Returns true on success. */
export async function authenticate(label: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: `Sign in to Pie & Mash with ${label}`,
    cancelLabel: 'Use password',
    disableDeviceFallback: false,
  });
  return result.success;
}

/** Whether the user has enabled biometric login on this device. */
export async function isBiometricsEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(ENABLED_KEY)) === 'true';
}

/**
 * Enable biometric login by storing the Supabase refresh token in the
 * device's secure enclave (encrypted by the OS).
 */
export async function enableBiometrics(refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  await AsyncStorage.setItem(ENABLED_KEY, 'true');
}

/** Disable biometric login and clear the stored token. */
export async function disableBiometrics(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await AsyncStorage.removeItem(ENABLED_KEY);
}

/** Retrieve the stored refresh token (null if not set or cleared). */
export async function getBiometricRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}
