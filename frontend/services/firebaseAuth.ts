import { 
  initializeAuth, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  signOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { app } from './firebase.js';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
    confirmationResult: any;
  }
}

// Initialize auth with app check
export const auth = initializeAuth(app, {
  persistence: [],
});

// Setup reCAPTCHA verifier
export const setupRecaptcha = () => {
  try {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response: any) => {
        console.log('reCAPTCHA verified:', response);
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
  } catch (error) {
    console.error('Error setting up reCAPTCHA:', error);
  }
};

// Send OTP to phone number
export const sendOTP = async (phoneNumber: string) => {
  try {
    setupRecaptcha();
    const phoneWithCountry = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    const appVerifier = window.recaptchaVerifier;
    const confirmationResult = await signInWithPhoneNumber(auth, phoneWithCountry, appVerifier);
    
    // Store confirmation result for later verification
    window.confirmationResult = confirmationResult;
    return { success: true, message: 'OTP sent successfully' };
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to send OTP. Please try again.' 
    };
  }
};

// Verify OTP
export const verifyOTP = async (otp: string) => {
  try {
    const confirmationResult = window.confirmationResult;
    
    if (!confirmationResult) {
      return { 
        success: false, 
        message: 'No OTP request found. Please send OTP again.' 
      };
    }

    const result = await confirmationResult.confirm(otp);
    const user = result.user;
    
    return { 
      success: true, 
      message: 'OTP verified successfully',
      user: {
        uid: user.uid,
        phoneNumber: user.phoneNumber,
        email: user.email
      }
    };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return { 
      success: false, 
      message: error.message || 'Invalid OTP. Please try again.' 
    };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('Error logging out:', error);
    return { success: false, message: error.message };
  }
};

// Monitor auth state changes
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};
