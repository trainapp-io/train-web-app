import { 
    GoogleAuthProvider, 
    signInWithPopup,
    signOut as firebaseSignOut,
  } from 'firebase/auth';
  import { auth } from '../../../firebase/firebase';
  import api from '../../../services/apiClient';
  import { 
    UserRequest, 
    UserLoginRequest, 
    LogoutRequest,
    RequestPasswordResetRequest,
    ResetPasswordWithCodeRequest,
    UserResponse
  } from '@trainapp-io/train-core';
  import { tokenService } from '../../../services/tokenService';
import { AxiosError } from 'axios';
  
  export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  
  export const authService = {
    async register(userRequest: UserRequest): Promise<UserResponse> {
      try {
        const response = await api.post<UserResponse>(`${API_URL}/user/register`, userRequest);
        tokenService.setTokens(response.data.accessToken, response.data.refreshToken, response.data.userId, response.data.username, response.data.name);
        return response.data;
      } catch (error) {
        if (error instanceof AxiosError) {
          console.error('Error registering user:', error);
          throw error;
        }
        console.error('Error registering user:', error);
        throw error;
      }
    },

    async login(userLoginRequest: UserLoginRequest): Promise<UserResponse> {
      try {
        const response = await api.post<UserResponse>(`${API_URL}/user/login`, userLoginRequest);
        tokenService.setTokens(response.data.accessToken, response.data.refreshToken, response.data.userId, response.data.username, response.data.name);
        return response.data;
      } catch (error) {
        console.error('Error logging in user:', error);
        throw error;
      }
    },

    async requestPasswordReset(request: RequestPasswordResetRequest): Promise<void> {
      try {
        await api.post(`${API_URL}/user/request-password-reset`, request);
      } catch (error) {
        console.error('Error requesting password reset:', error);
        throw error;
      }
    },

    async resetPasswordWithCode(request: ResetPasswordWithCodeRequest): Promise<void> {
      try {
        await api.post(`${API_URL}/user/reset-password-with-code`, request);
      } catch (error) {
        console.error('Error resetting password with code:', error);
        throw error;
      }
    },

    // Sign in with Google
    async signInWithGoogle(): Promise<UserResponse> {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });
        const result = await signInWithPopup(auth, provider);
        
        // Get the ID token
        const idToken = await result.user.getIdToken();
        
        // Send the token to your backend with device ID
        const response = await api.post<UserResponse>(`${API_URL}/user/google-auth`, {
          idToken,
          name: result.user.displayName,
          deviceId: tokenService.getDeviceId(),
          agreeToTerms: true
        }, {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        });
        
        // Store tokens using tokenService
        tokenService.setTokens(response.data.accessToken, response.data.refreshToken, response.data.userId, response.data.username, response.data.name);
        
        return response.data;
      } catch (error) {
        console.error('Error signing in with Google:', error);
        throw error;
      }
    },
    
    // Send the Google ID token to your backend
    async authenticateWithProvider(idToken: string, name: string | null, url: string) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`
          },
          body: JSON.stringify({ 
            name,
            agreeToTerms: true
          }),
        });
        
        if (!response.ok) {
          throw new Error('Authentication failed');
        }
        
        const data = await response.json();
        
        // Store the JWT token from your backend
        tokenService.setTokens(data.accessToken, data.refreshToken, data.userId, data.username, data.name);
        
        return data;
      } catch (error) {
        console.error('Error authenticating with backend:', error);
        throw error;
      }
    },

    // Sign out
    async logout(logoutRequest: LogoutRequest): Promise<void> {
        // Only perform API call and Firebase signout if authenticated
        if (this.isAuthenticated()) {
            try {
                await api.post(`${API_URL}/user/logout`, logoutRequest);
                
                // Only attempt Firebase signout if API call succeeds
                try {
                    await firebaseSignOut(auth);
                } catch (firebaseError) {
                    console.error('Error signing out from Firebase:', firebaseError);
                    // Continue with local logout even if Firebase signout fails
                }
                
                // Clear tokens when authenticated
                tokenService.clearTokens();
            } catch (error) {
                console.error('Error calling signout endpoint:', error);
                // Re-throw the error to propagate it to the caller
                throw error;
            }
        }
    },
    
    // Get current user from localStorage
    getCurrentUser() {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    },
    
    // Check if user is authenticated
    isAuthenticated() {
      return !!tokenService.getAccessToken();
    }
  };