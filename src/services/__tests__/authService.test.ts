import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../app/access/services/authService';
import { tokenService } from '../tokenService';
import api from '../apiClient';
import { auth } from '../../firebase/firebase';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';

// Mock dependencies
vi.mock('../tokenService', () => ({
  tokenService: {
    setTokens: vi.fn(),
    getAccessToken: vi.fn(),
    getDeviceId: vi.fn(() => 'mock-device-id'),
    clearTokens: vi.fn()
  }
}));

vi.mock('../apiClient', () => ({
  default: {
    post: vi.fn()
  }
}));

vi.mock('../../firebase/firebase', () => ({
  auth: {
    currentUser: null
  }
}));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn().mockImplementation(() => ({
    setCustomParameters: vi.fn()
  })),
  signInWithPopup: vi.fn(),
  signOut: vi.fn()
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    (tokenService.getDeviceId as any).mockReturnValue('mock-device-id');
    global.fetch = vi.fn();
  });

  describe('register', () => {
    it('should register a user and store tokens', async () => {
      // Arrange
      const mockUserRequest = {
        username: 'testuser',
        email: 'test@example.com',
        phoneNumber: '555-123-4567',
        password: 'password123',
        name: 'Test User',
        deviceId: 'mock-device-id',
        agreeToTerms: true
      };
      
      const mockResponse = {
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          userId: 'user-123',
          username: 'testuser',
          name: 'Test User'
        }
      };
      
      (api.post as any).mockResolvedValueOnce(mockResponse);
      
      // Act
      const result = await authService.register(mockUserRequest);
      
      // Assert
      expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/user/register'), mockUserRequest);
      expect(tokenService.setTokens).toHaveBeenCalledWith(
        mockResponse.data.accessToken,
        mockResponse.data.refreshToken,
        mockResponse.data.userId,
        mockResponse.data.username,
        mockResponse.data.name
      );
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should throw an error if registration fails', async () => {
      // Arrange
      const mockUserRequest = {
        username: 'testuser',
        email: 'test@example.com',
        phoneNumber: '555-123-4567',
        password: 'password123',
        name: 'Test User',
        deviceId: 'mock-device-id',
        agreeToTerms: true
      };
      
      const mockError = new Error('Registration failed');
      (api.post as any).mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(authService.register(mockUserRequest)).rejects.toThrow();
      expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/user/register'), mockUserRequest);
      expect(tokenService.setTokens).not.toHaveBeenCalled();
    });
  });
  
  describe('login', () => {
    it('should login a user and store tokens', async () => {
      // Arrange
      const mockLoginRequest = {
        email: 'test@example.com',
        password: 'password123',
        deviceId: 'device-123'
      };
      
      const mockResponse = {
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          userId: 'user-123',
          username: 'testuser',
          name: 'Test User'
        }
      };
      
      (api.post as any).mockResolvedValueOnce(mockResponse);
      
      // Act
      const result = await authService.login(mockLoginRequest);
      
      // Assert
      expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/user/login'), mockLoginRequest);
      expect(tokenService.setTokens).toHaveBeenCalledWith(
        mockResponse.data.accessToken,
        mockResponse.data.refreshToken,
        mockResponse.data.userId,
        mockResponse.data.username,
        mockResponse.data.name
      );
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should throw an error if login fails', async () => {
      // Arrange
      const mockLoginRequest = {
        email: 'test@example.com',
        password: 'password123',
        deviceId: 'device-123'
      };
      
      const mockError = new Error('Login failed');
      (api.post as any).mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(authService.login(mockLoginRequest)).rejects.toThrow();
      expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/user/login'), mockLoginRequest);
      expect(tokenService.setTokens).not.toHaveBeenCalled();
    });
  });
  
  describe('requestPasswordReset', () => {
    it('should send a password reset request', async () => {
      // Arrange
      const mockRequest = {
        email: 'test@example.com'
      };
      
      (api.post as any).mockResolvedValueOnce({});
      
      // Act
      await authService.requestPasswordReset(mockRequest);
      
      // Assert
      expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/user/request-password-reset'), mockRequest);
    });
    
    it('should throw an error if password reset request fails', async () => {
      // Arrange
      const mockRequest = {
        email: 'test@example.com'
      };
      
      const mockError = new Error('Password reset request failed');
      (api.post as any).mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(authService.requestPasswordReset(mockRequest)).rejects.toThrow();
      expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/user/request-password-reset'), mockRequest);
    });
  });
  
  describe('resetPasswordWithCode', () => {
    it('should reset password with code', async () => {
      // Arrange
      const mockRequest = {
        email: 'test@example.com',
        resetCode: '123456',
        newPassword: 'newpassword123'
      };
      
      (api.post as any).mockResolvedValueOnce({});
      
      // Act
      await authService.resetPasswordWithCode(mockRequest);
      
      // Assert
      expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/user/reset-password-with-code'), mockRequest);
    });
    
    it('should throw an error if password reset with code fails', async () => {
      // Arrange
      const mockRequest = {
        email: 'test@example.com',
        resetCode: '123456',
        newPassword: 'newpassword123'
      };
      
      const mockError = new Error('Password reset with code failed');
      (api.post as any).mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(authService.resetPasswordWithCode(mockRequest)).rejects.toThrow();
      expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/user/reset-password-with-code'), mockRequest);
    });
  });
  
  describe('signInWithGoogle', () => {
    it('should sign in with Google and store tokens', async () => {
      // Arrange
      const mockUser = {
        getIdToken: vi.fn().mockResolvedValue('google-id-token'),
        displayName: 'Test User'
      };
      
      const mockResult = {
        user: mockUser
      };
      
      const mockResponse = {
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          userId: 'user-123',
          username: 'testuser',
          name: 'Test User'
        }
      };
      
      (vi.mocked(signInWithPopup) as any).mockResolvedValueOnce(mockResult);
      (api.post as any).mockResolvedValueOnce(mockResponse);
      
      // Act
      const result = await authService.signInWithGoogle();
      
      // Assert
      expect(signInWithPopup).toHaveBeenCalled();
      expect(mockUser.getIdToken).toHaveBeenCalled();
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining('/user/google-auth'),
        {
          idToken: 'google-id-token',
          name: 'Test User',
          deviceId: 'mock-device-id',
          agreeToTerms: true
        },
        {
          headers: {
            Authorization: 'Bearer google-id-token'
          }
        }
      );
      expect(tokenService.setTokens).toHaveBeenCalledWith(
        mockResponse.data.accessToken,
        mockResponse.data.refreshToken,
        mockResponse.data.userId,
        mockResponse.data.username,
        mockResponse.data.name
      );
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should throw an error if Google sign-in fails', async () => {
      // Arrange
      const mockError = new Error('Google sign-in failed');
      (vi.mocked(signInWithPopup) as any).mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(authService.signInWithGoogle()).rejects.toThrow();
      expect(signInWithPopup).toHaveBeenCalled();
      expect(api.post).not.toHaveBeenCalled();
      expect(tokenService.setTokens).not.toHaveBeenCalled();
    });
  });
  
  describe('authenticateWithProvider', () => {
    it('should authenticate with provider and store tokens', async () => {
      // Arrange
      const mockIdToken = 'provider-id-token';
      const mockName = 'Test User';
      const mockUrl = 'https://api.example.com/auth/provider';
      
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          userId: 'user-123',
          username: 'testuser',
          name: 'Test User'
        })
      };
      
      (global.fetch as any).mockResolvedValueOnce(mockResponse);
      
      // Act
      const result = await authService.authenticateWithProvider(mockIdToken, mockName, mockUrl);
      
      // Assert
      expect(global.fetch).toHaveBeenCalledWith(mockUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockIdToken}`
        },
        body: JSON.stringify({ name: mockName, agreeToTerms: true })
      });
      expect(tokenService.setTokens).toHaveBeenCalledWith(
        'access-token',
        'refresh-token',
        'user-123',
        'testuser',
        'Test User'
      );
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        userId: 'user-123',
        username: 'testuser',
        name: 'Test User'
      });
    });
    
    it('should throw an error if provider authentication fails with non-OK response', async () => {
      // Arrange
      const mockIdToken = 'provider-id-token';
      const mockName = 'Test User';
      const mockUrl = 'https://api.example.com/auth/provider';
      
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      };
      
      (global.fetch as any).mockResolvedValueOnce(mockResponse);
      
      // Act & Assert
      await expect(authService.authenticateWithProvider(mockIdToken, mockName, mockUrl)).rejects.toThrow('Authentication failed');
      expect(global.fetch).toHaveBeenCalled();
      expect(tokenService.setTokens).not.toHaveBeenCalled();
    });
    
    it('should throw an error if provider authentication fetch fails', async () => {
      // Arrange
      const mockIdToken = 'provider-id-token';
      const mockName = 'Test User';
      const mockUrl = 'https://api.example.com/auth/provider';
      
      const mockError = new Error('Network error');
      (global.fetch as any).mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(authService.authenticateWithProvider(mockIdToken, mockName, mockUrl)).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalled();
      expect(tokenService.setTokens).not.toHaveBeenCalled();
    });
  });
  
  describe('logout', () => {
    it('should log out user when authenticated', async () => {
      // Arrange
      const mockLogoutRequest = {
        deviceId: 'device-123',
        refreshToken: 'mock-refresh-token'
      };
      
      (tokenService.getAccessToken as any).mockReturnValueOnce('access-token');
      (api.post as any).mockResolvedValueOnce({});
      
      // Act
      await authService.logout(mockLogoutRequest);
      
      // Assert
      expect(tokenService.getAccessToken).toHaveBeenCalled();
      expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/user/logout'), mockLogoutRequest);
      expect(firebaseSignOut).toHaveBeenCalledWith(auth);
      expect(tokenService.clearTokens).toHaveBeenCalled();
    });
    
    it('should not call API if user is not authenticated', async () => {
      // Arrange
      const mockLogoutRequest = {
        deviceId: 'device-123',
        refreshToken: 'mock-refresh-token'
      };
      
      (tokenService.getAccessToken as any).mockReturnValueOnce(null);
      
      // Act
      await authService.logout(mockLogoutRequest);
      
      // Assert
      expect(tokenService.getAccessToken).toHaveBeenCalled();
      expect(api.post).not.toHaveBeenCalled();
      expect(firebaseSignOut).not.toHaveBeenCalled();
      expect(tokenService.clearTokens).not.toHaveBeenCalled();
    });
    
    it('should throw an error if logout API call fails', async () => {
      // Arrange
      const mockLogoutRequest = {
        deviceId: 'device-123',
        refreshToken: 'mock-refresh-token'
      };
      
      (tokenService.getAccessToken as any).mockReturnValueOnce('access-token');
      const mockError = new Error('Logout failed');
      (api.post as any).mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(authService.logout(mockLogoutRequest)).rejects.toThrow();
      expect(tokenService.getAccessToken).toHaveBeenCalled();
      expect(api.post).toHaveBeenCalledWith(expect.stringContaining('/user/logout'), mockLogoutRequest);
      expect(firebaseSignOut).not.toHaveBeenCalled();
      expect(tokenService.clearTokens).not.toHaveBeenCalled();
    });
  });
  
  describe('getCurrentUser', () => {
    it('should return user from localStorage', () => {
      // Arrange
      const mockUser = {
        userId: 'user-123',
        username: 'testuser',
        name: 'Test User'
      };
      
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockUser));
      
      // Act
      const result = authService.getCurrentUser();
      
      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith('user');
      expect(result).toEqual(mockUser);
    });
    
    it('should return null if no user in localStorage', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValueOnce(null);
      
      // Act
      const result = authService.getCurrentUser();
      
      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith('user');
      expect(result).toBeNull();
    });
  });
  
  describe('isAuthenticated', () => {
    it('should return true if access token exists', () => {
      // Arrange
      (tokenService.getAccessToken as any).mockReturnValueOnce('access-token');
      
      // Act
      const result = authService.isAuthenticated();
      
      // Assert
      expect(tokenService.getAccessToken).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should return false if access token does not exist', () => {
      // Arrange
      (tokenService.getAccessToken as any).mockReturnValueOnce(null);
      
      // Act
      const result = authService.isAuthenticated();
      
      // Assert
      expect(tokenService.getAccessToken).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});