import { RegistrationModel } from "../../../app/access/components/forms/RegistrationForm";
import AuthTestFixture from "../fixtures/AuthTestFixture";
import {
  RegistrationErrorTypes,
  LoginErrorTypes,
} from "../../../common/enums/authEnum";
import { UserLoginRequest } from "@trainapp-io/train-core";
import { AuthErrorTypes } from "../../../common/enums/authEnum";

export interface ErrorTestCase<T> {
  description: string;
  model: T;
  expectedError: string;
}

export default class AuthDataProvider {
  static registrationFormErrorCases: ErrorTestCase<RegistrationModel>[] = [
    {
      description: "Password is less than 8 characters",
      model: AuthTestFixture.createRegistrationModel({
        password: "1234567",
        confirmPassword: "1234567",
      }),
      expectedError: RegistrationErrorTypes.InvalidPasswordLength,
    },
    {
      description: "Password does not match",
      model: AuthTestFixture.createRegistrationModel({
        password: "12345679",
        confirmPassword: "12345678",
      }),
      expectedError: RegistrationErrorTypes.PasswordDoesNotMatch,
    },
    {
      description: "Terms not agreed",
      model: AuthTestFixture.createRegistrationModel({
        agreeToTerms: false,
      }),
      expectedError: RegistrationErrorTypes.TermsNotAgreed,
    },
    {
      description: "Email already exists",
      model: AuthTestFixture.createRegistrationModel({
        email: "existing@example.com",
      }),
      expectedError: RegistrationErrorTypes.EmailAlreadyExists,
    },
    {
      description: "Server error",
      model: AuthTestFixture.createRegistrationModel({
        email: "server-error@example.com",
        password: "validpassword123",
        confirmPassword: "validpassword123",
        agreeToTerms: true,
      }),
      expectedError: RegistrationErrorTypes.UnknownError,
    },
  ];

  static loginFormErrorCases: ErrorTestCase<UserLoginRequest>[] = [
    {
      description: "Invalid password",
      model: AuthTestFixture.createLoginModel({
        password: "invalid-password@example.com",
      }),
      expectedError: LoginErrorTypes.InvalidPassword,
    },
    {
      description: "Server error",
      model: AuthTestFixture.createLoginModel({
        email: "server-error@example.com",
      }),
      expectedError: AuthErrorTypes.ServerError,
    },
  ];
}
