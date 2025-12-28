import { BaseApiService } from "../../../services/BaseApiService";
import { UserProfileResponse, UserProfileRequest } from "@trainapp-io/train-core";
import { SuccessResponse } from "../../../types/api.types";
import { tokenService } from "../../../services/tokenService";

export default class UserProfileService extends BaseApiService<
  UserProfileResponse,
  UserProfileRequest,
  UserProfileRequest
> {
  constructor() {
    super("/user-profile", "user-profile");
  }

  protected getBaseEndpoint(): string {
    return this.baseEndpoint;
  }

  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    return this.get<UserProfileResponse>(`/user-profile/${userId}`);
  }

  async updateUserProfile(
    userProfileRequest: UserProfileRequest
  ): Promise<SuccessResponse> {
    return this.put<SuccessResponse>(`/user-profile`, userProfileRequest);
  }

  /**
   * Gets the current user's profile
   * @returns Promise with the current user's profile data
   */
  async getCurrentUserProfile(): Promise<UserProfileResponse> {
    const userString = tokenService.getUser();
    if (!userString) {
      throw new Error("No authenticated user found");
    }

    try {
      const currentUser = JSON.parse(userString);
      if (!currentUser.userId) {
        throw new Error("User ID not found in stored user data");
      }
      return this.getUserProfile(currentUser.userId);
    } catch (error) {
      console.error("Error parsing user data:", error);
      throw new Error("Invalid user data format");
    }
  }
}
