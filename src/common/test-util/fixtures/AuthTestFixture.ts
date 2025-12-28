import { RegistrationModel } from "../../../app/access/components/forms/RegistrationForm";
import { UserLoginRequest } from "@trainapp-io/train-core";

export default class AuthTestFixture {
  public static NAME: string = "John Doe";
  public static EMAIL: string = "john.doe@example.com";
  public static PASSWORD: string = "Password123!";
  public static CONFIRM_PASSWORD: string = "Password123!";
  public static AGREE_TO_TERMS: boolean = true;

  public static createRegistrationModel(
    updatedData?: Partial<RegistrationModel>
  ): RegistrationModel {
    return {
      name: AuthTestFixture.NAME,
      email: AuthTestFixture.EMAIL,
      password: AuthTestFixture.PASSWORD,
      confirmPassword: AuthTestFixture.CONFIRM_PASSWORD,
      agreeToTerms: AuthTestFixture.AGREE_TO_TERMS,
      ...updatedData,
    };
  }

  public static createLoginModel(
    updatedData?: Partial<UserLoginRequest>
  ): UserLoginRequest {
    return {
      email: AuthTestFixture.EMAIL,
      password: AuthTestFixture.PASSWORD,
      deviceId: "test-device-id",
      ...updatedData,
    };
  }
}
