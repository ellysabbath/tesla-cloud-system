// This file handles all API calls
// Currently using mock implementations since there's no backend

import type { 
  LoginCredentials, 
  RegisterData, 
  PasswordResetRequest, 
  ResetPasswordData,
  User 
} from '../types';

// Simulated delay for API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Authentication APIs
export const authApi = {
  // Register a new user
  register: async (data: RegisterData): Promise<{ success: boolean; message: string; user?: User }> => {
    await delay(1500);
    console.log('Registering user:', data);
    
    // Simulate successful registration
    const username = `TESLA-2026-${Math.floor(Math.random() * 10000)}`;
    
    return {
      success: true,
      message: 'Registration successful. Please check your email for verification.',
      user: {
        id: crypto.randomUUID(),
        username,
        fullName: data.fullName,
        email: data.email,
        profilePicture: '',
        countryCode: data.countryCode,
        mobileNumber: data.mobileNumber,
        region: data.region,
        currentCity: data.currentCity,
        dateOfBirth: data.dateOfBirth,
        educationalBackground: data.educationalBackground,
        ipAddress: '192.168.1.1',
        deviceName: 'Unknown Device',
        isVerified: false,
        createdAt: new Date().toISOString(),
      },
    };
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<{ success: boolean; message: string; user?: User }> => {
    await delay(1000);
    console.log('Logging in:', credentials);
    
    // Simulate successful login
    return {
      success: true,
      message: 'Login successful',
      user: {
        id: '1',
        username: credentials.username,
        fullName: 'Demo User',
        email: 'demo@teslacloud.com',
        profilePicture: '',
        countryCode: '+255',
        mobileNumber: '123456789',
        region: 'Dar es Salaam',
        currentCity: 'Dar es Salaam',
        dateOfBirth: { year: '2000', month: '01', day: '01' },
        ipAddress: '192.168.1.1',
        deviceName: 'Unknown Device',
        isVerified: true,
        createdAt: new Date().toISOString(),
      },
    };
  },

  // Verify account
  verifyAccount: async (token: string): Promise<{ success: boolean; message: string }> => {
    await delay(1000);
    console.log('Verifying account with token:', token);
    
    return {
      success: true,
      message: 'Account verified successfully',
    };
  },

  // Request password reset
  requestPasswordReset: async (data: PasswordResetRequest): Promise<{ success: boolean; message: string }> => {
    await delay(1000);
    console.log('Requesting password reset for:', data.email);
    
    return {
      success: true,
      message: 'Reset codes sent to your email',
    };
  },

  // Verify reset codes
  verifyResetCodes: async (code: string): Promise<{ success: boolean; message: string }> => {
    await delay(1000);
    console.log('Verifying reset code:', code);
    
    return {
      success: true,
      message: 'Code verified successfully',
    };
  },

  // Reset password
  resetPassword: async (data: ResetPasswordData): Promise<{ success: boolean; message: string }> => {
    await delay(1000);
    console.log('Resetting password');
    
    return {
      success: true,
      message: 'Password reset successfully',
    };
  },

  // Logout
  logout: async (): Promise<{ success: boolean }> => {
    await delay(500);
    return { success: true };
  },
};

// Helper function to convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Get user's IP address (mock)
export const getIpAddress = async (): Promise<string> => {
  await delay(300);
  return '192.168.1.1';
};

// Get device name (mock)
export const getDeviceName = (): string => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Windows')) return 'Windows PC';
  if (userAgent.includes('Mac')) return 'Mac';
  if (userAgent.includes('Linux')) return 'Linux PC';
  if (userAgent.includes('Android')) return 'Android Device';
  if (userAgent.includes('iOS')) return 'iOS Device';
  return 'Unknown Device';
};