import {describe, expect, vi, beforeEach, it} from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { mockReactRouterDom } from '../../../../../mocks/mocks';
import { UserLoginRequest } from '@trainapp-io/train-core';
import AuthDataProvider from '../../../../../common/test-util/data-providers/AuthDataProvider';

// Mock useNavigate
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockReactRouterDom.useNavigate(),
}));

// Import the component after mocking dependencies
import LoginForm from '../LoginForm';

describe('LoginForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderLogin = () => {
        return render(
        <BrowserRouter>
            <LoginForm />
        </BrowserRouter>
        );
    };

    const fillForm = async (model: UserLoginRequest) => {
        const emailInput = screen.getByTestId('email-input');
        const passwordInput = screen.getByTestId('password-input');

        fireEvent.change(emailInput, { target: { value: model.email } });
        fireEvent.change(passwordInput, { target: { value: model.password } });
    }

    it('renders the form correctly', () => {
        renderLogin();

        expect(screen.getByTestId('email-input')).toBeInTheDocument();
        expect(screen.getByTestId("password-input")).toBeInTheDocument();
        expect(screen.getByTestId("forgot-password-link")).toBeInTheDocument();
        expect(screen.getByTestId('login-button')).toBeInTheDocument();
        expect(screen.getByTestId('google-button')).toBeInTheDocument();
    });

    describe('Error Cases', () => {
        it.each(AuthDataProvider.loginFormErrorCases)(
            "$description",
            async ({ model, expectedError }) => {
              renderLogin();
              
              await fillForm(model);
              
              // Submit form
              const submitButton = screen.getByTestId('login-button');
              fireEvent.click(submitButton);
              
              // Check for error message
              await waitFor(() => {
                const errorElement = screen.getByTestId('form-error');
                expect(errorElement).toHaveTextContent(expectedError);
              });
            }
          );
    });
});
