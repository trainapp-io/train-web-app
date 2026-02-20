import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import TextInput from '../../../../components/ui/TextInput';
import Button from '../../../../components/ui/Button';
import Checkbox from '../../../../components/ui/Checkbox';
import Form from '../../../../components/ui/Form';
import SocialButton from '../../../../components/ui/SocialButton';
import { authService } from '../../services/authService';
import { tokenService } from '../../../../services/tokenService';
import { UserRequest } from '@trainapp-io/train-core';
import { RegistrationErrorTypes } from '../../../../common/enums/authEnum';
import { AxiosError } from 'axios';
import { ErrorResponse } from '../../../../mocks/handlers';

export interface RegistrationModel {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

const RegistrationForm: React.FC = () => {
  const navigate = useNavigate();

    const [registrationForm, setRegistrationForm] = useState<RegistrationModel>({
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleChange = (field: keyof RegistrationModel, value: string | boolean) => {
    setRegistrationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePassword = () => {
    if (registrationForm.password !== registrationForm.confirmPassword) {
      setPasswordError(RegistrationErrorTypes.PasswordDoesNotMatch);
      return false;
    }
    if (registrationForm.password.length < 8) {
      setPasswordError(RegistrationErrorTypes.InvalidPasswordLength);
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit");
    
    if (!validatePassword()) {
      return;
    }
    
    if (!registrationForm.agreeToTerms) {
      setError(RegistrationErrorTypes.TermsNotAgreed);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create UserRequest object
      const userRequest: UserRequest = {
        name: registrationForm.name,
        email: registrationForm.email,
        phoneNumber: registrationForm.phoneNumber,
        password: registrationForm.password,
        deviceId: tokenService.getDeviceId(),
        agreeToTerms: registrationForm.agreeToTerms
      };
      
      // Register user using authService
      const response = await authService.register(userRequest);
      console.log('Registration successful:', response);
      navigate('/');
    } catch (err: any) {
      if (err instanceof AxiosError) {
        const errorResponse = err.response?.data as ErrorResponse;
        console.error('Registration error:', err);
        
        // Check if it's a server error (5xx)
        if (err.response && err.response.status >= 500) {
          setError(RegistrationErrorTypes.UnknownError);
        } else {
          setError(errorResponse?.message || RegistrationErrorTypes.UnknownError);
        }
      } else {
        setError(RegistrationErrorTypes.UnknownError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = await authService.signInWithGoogle();
      console.log('Successfully signed up with Google:', userData);
      navigate('/');
    } catch (err: any) {
      console.error('Google sign-up error:', err);
      setError(err.message || 'Failed to sign up with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Form onSubmit={handleSubmit} error={error}>
        <TextInput
          id="name"
          testId="name-input"
          type="text"
          label="Full Name"
          value={registrationForm.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="John Doe"
          required
          disabled={isLoading}
          autoComplete="name"
        />
        
        <TextInput
          id="email"
          testId="email-input"
          type="email"
          label="Email"
          value={registrationForm.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="your@email.com"
          required
          disabled={isLoading}
          autoComplete="email"
        />
        
        <TextInput
          id="phoneNumber"
          testId="phone-input"
          type="text"
          label="Phone Number"
          value={registrationForm.phoneNumber}
          onChange={(e) => handleChange('phoneNumber', e.target.value)}
          placeholder="(555) 123-4567"
          required
          disabled={isLoading}
          autoComplete="tel"
        />
        
        <TextInput
          id="password"
          testId="password-input"
          type="password"
          label="Password"
          value={registrationForm.password}
          onChange={(e) => handleChange('password', e.target.value)}
          placeholder="••••••••"
          required
          disabled={isLoading}
          autoComplete="new-password"
          error={passwordError || undefined}
        />
        
        <TextInput
          id="confirmPassword"
          testId="confirm-password-input"
          type="password"
          label="Confirm Password"
          value={registrationForm.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          placeholder="••••••••"
          required
          disabled={isLoading}
          error={passwordError || undefined}
          autoComplete="new-password"
        />
        
        <div className="form-options">
          <Checkbox
            id="agreeToTerms"
            testId="terms-checkbox"
            label={
              <>
                I agree to the <Link to="/terms-of-service">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
              </>
            }
            checked={registrationForm.agreeToTerms}
            onChange={(e) => handleChange('agreeToTerms', e.target.checked)}
            disabled={isLoading}
          />
        </div>
        
        <Button
          type="submit"
          testId="register-button"
          disabled={isLoading}
          isLoading={isLoading}
          className="login-button"
        >
          Register
        </Button>
      </Form>
      
      <div className="social-login">
        <p>Or sign up with</p>
        <SocialButton
          provider="google"
          testId="google-button"
          onClick={handleSignUpWithGoogle}
          disabled={isLoading}
          isLoading={isLoading && error?.includes('Google')}
        />
      </div>
    </>
  );
};

export default RegistrationForm;
