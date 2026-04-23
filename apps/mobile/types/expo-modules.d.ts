// =============================================================================
// Type declarations for Expo modules hoisted to root node_modules
// in the monorepo. These packages are installed but tsc cannot resolve
// their types from the mobile workspace due to module resolution paths.
// =============================================================================

declare module 'expo-image' {
  import React, { ComponentType } from 'react';
  import { ImageStyle, StyleProp, ViewProps } from 'react-native';

  export type ImageContentFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  export type ImageContentPosition = 'center' | 'top' | 'right' | 'bottom' | 'left' |
    'top center' | 'top right' | 'top left' |
    'right center' | 'bottom center' | 'bottom right' |
    'bottom left' | 'left center';

  export type ImageSource = string | number | {
    uri?: string;
    width?: number;
    height?: number;
    headers?: Record<string, string>;
    cacheKey?: string;
    blurhash?: string;
    thumbhash?: string;
  };

  export interface ImageProps extends ViewProps {
    source?: ImageSource | ImageSource[];
    style?: StyleProp<ImageStyle>;
    contentFit?: ImageContentFit;
    contentPosition?: ImageContentPosition;
    placeholder?: ImageSource | string;
    placeholderContentFit?: ImageContentFit;
    transition?: number | { duration?: number; effect?: string; timing?: string };
    cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
    blurRadius?: number;
    tintColor?: string;
    priority?: 'low' | 'normal' | 'high';
    recyclingKey?: string;
    onLoad?: (event: { source: { width: number; height: number; url: string } }) => void;
    onLoadStart?: () => void;
    onLoadEnd?: () => void;
    onError?: (event: { error: string }) => void;
    accessible?: boolean;
    accessibilityLabel?: string;
    alt?: string;
  }

  export class Image extends React.Component<ImageProps> {
    static loadAsync(source: ImageSource | ImageSource[]): Promise<void>;
    static prefetch(urls: string | string[], cachePolicy?: string): Promise<boolean>;
  }

  export function prefetch(urls: string | string[]): Promise<boolean>;
  export function clearDiskCache(): Promise<boolean>;
  export function clearMemoryCache(): Promise<boolean>;
}

declare module 'expo-splash-screen' {
  export function preventAutoHideAsync(): Promise<boolean>;
  export function hideAsync(): Promise<boolean>;
}

declare module 'expo-sharing' {
  export function isAvailableAsync(): Promise<boolean>;
  export function shareAsync(url: string, options?: {
    mimeType?: string;
    dialogTitle?: string;
    UTI?: string;
  }): Promise<void>;
}

declare module '@stripe/stripe-react-native' {
  import { ComponentType, ReactNode } from 'react';

  export interface StripeProviderProps {
    publishableKey: string;
    merchantIdentifier?: string;
    urlScheme?: string;
    children: ReactNode;
  }

  export const StripeProvider: ComponentType<StripeProviderProps>;

  export interface PaymentSheetParams {
    paymentIntentClientSecret?: string;
    setupIntentClientSecret?: string;
    customerId?: string;
    customerEphemeralKeySecret?: string;
    merchantDisplayName?: string;
    applePay?: { merchantCountryCode: string; cartItems?: Array<{ label: string; amount: string }> };
    googlePay?: { merchantCountryCode: string; testEnv?: boolean };
    style?: 'alwaysLight' | 'alwaysDark' | 'automatic';
    returnURL?: string;
    defaultBillingDetails?: Record<string, unknown>;
  }

  export interface PaymentSheet {
    error?: { code: string; message: string };
    paymentOption?: { label: string; image: string };
  }

  export function useStripe(): {
    initPaymentSheet(params: PaymentSheetParams): Promise<PaymentSheet>;
    presentPaymentSheet(): Promise<PaymentSheet>;
    confirmPaymentSheetPayment(): Promise<PaymentSheet>;
    createToken(params: Record<string, unknown>): Promise<{ token: { id: string } }>;
    createPaymentMethod(params: Record<string, unknown>): Promise<{ paymentMethod: { id: string } }>;
  };
}
