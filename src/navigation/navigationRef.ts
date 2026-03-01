import { createNavigationContainerRef } from '@react-navigation/native';

// Allows navigation from outside React components (e.g. push notification handlers).
export const navigationRef = createNavigationContainerRef<any>();
