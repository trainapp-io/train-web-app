import {describe, expect, vi, beforeEach, it} from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { mockReactRouterDom } from '../../../../../mocks/mocks';
import { RegistrationModel } from '../RegistrationForm';
import { RegistrationErrorTypes } from '../../../../../common/enums/authEnum';

// Mock modules before importing the component

// Mock useNavigate
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockReactRouterDom.useNavigate(),
}));

// Import the component after mocking dependencies
import RegistrationForm from '../RegistrationForm';
import AuthDataProvider from '../../../../../common/test-util/data-providers/AuthDataProvider';

describe('RegistrationForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderRegistration = () => {
        return render(
        <BrowserRouter>
            <RegistrationForm />
        </BrowserRouter>
        );
    };

    const fillForm = async (model: RegistrationModel) => {
        const nameInput = screen.getByTestId('name-input');
        const emailInput = screen.getByTestId('email-input');
        const phoneInput = screen.getByTestId('phone-input');
        const passwordInput = screen.getByTestId('password-input');
        const confirmPasswordInput = screen.getByTestId('confirm-password-input');
        const termsCheckbox = screen.getByTestId('terms-checkbox');
    
        fireEvent.change(nameInput, { target: { value: model.name } });
        fireEvent.change(emailInput, { target: { value: model.email } });
        fireEvent.change(phoneInput, { target: { value: model.phoneNumber } });
        fireEvent.change(passwordInput, { target: { value: model.password } });
        fireEvent.change(confirmPasswordInput, { target: { value: model.confirmPassword } });

        if (model.agreeToTerms) {
            fireEvent.click(termsCheckbox);
        }
    };

    it('renders the form correctly', () => {
        renderRegistration();

        // Check for all form elements using testId attributes
        expect(screen.getByTestId('name-input')).toBeInTheDocument();
        expect(screen.getByTestId('email-input')).toBeInTheDocument();
        expect(screen.getByTestId('phone-input')).toBeInTheDocument();
        expect(screen.getByTestId('password-input')).toBeInTheDocument();
        expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
        expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument();
        expect(screen.getByTestId('register-button')).toBeInTheDocument();
        expect(screen.getByTestId('google-button')).toBeInTheDocument();
        
        // Check for text elements
        expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
        expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
        expect(screen.getByText(/Or sign up with/i)).toBeInTheDocument();
    });

    describe('Error Cases', () => {
        it.each(AuthDataProvider.registrationFormErrorCases)(
            "$description",
            async ({ model, expectedError }) => {
              renderRegistration();
              
              // Fill form with invalid password
              await fillForm(model);
              
              // Submit form
              const submitButton = screen.getByTestId('register-button');
              fireEvent.click(submitButton);
              
              // Check for error message
              await waitFor(() => {
                if (expectedError === RegistrationErrorTypes.InvalidPasswordLength || 
                    expectedError === RegistrationErrorTypes.PasswordDoesNotMatch ||
                    expectedError === RegistrationErrorTypes.EmailRequired) {
                    const passwordInput = screen.getByTestId('password-input');
                    const errorElement = passwordInput.closest('.form-group')?.querySelector('.input-error');
                    expect(errorElement).toHaveTextContent(expectedError);
                } else {
                    // For other errors, check the form error message
                    const errorElement = screen.getByTestId('form-error');
                    expect(errorElement).toHaveTextContent(expectedError);
                }
              });
            }
          );
    });
});