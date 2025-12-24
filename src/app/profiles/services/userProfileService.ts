import api from "../../../services/apiClient";
import {
  SuccessResponse,
  CustomSection,
  UserFollowersResponse,
  UserGroupsResponse,
} from "../../../types/api.types";
import { UserProfileResponse, UserProfileRequest } from "@trainapp-io/train-core";
import { tokenService } from "../../../services/tokenService";

/**
 * Service for user profile management operations
 */
export const userProfileService = {
  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    try {
      const response = await api.get<UserProfileResponse>(
        `/user-profile/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  },

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
  },

  /**
   * Update user profile
   * @param profileData - User profile data
   * @returns Promise with success response
   */
  async updateUserProfile(
    profileData: UserProfileRequest
  ): Promise<SuccessResponse> {
    try {
      const response = await api.put<SuccessResponse>(
        "/user-profile",
        profileData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  },

  /**
   * Add custom section to user profile
   * @param title - Section title
   * @param content - Section content
   * @returns Promise with the created custom section
   */
  async addCustomSection(
    title: string,
    content: string
  ): Promise<CustomSection> {
    try {
      const response = await api.post<CustomSection>(
        "/user-profile/custom-section",
        {
          title,
          content,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error adding custom section:", error);
      throw error;
    }
  },

  /**
   * Update custom section
   * @param sectionId - Section ID
   * @param data - Section data to update
   * @returns Promise with success response
   */
  async updateCustomSection(
    sectionId: string,
    data: { title?: string; content?: string }
  ): Promise<SuccessResponse> {
    try {
      const response = await api.put<SuccessResponse>(
        `/user-profile/custom-section/${sectionId}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error updating custom section:", error);
      throw error;
    }
  },

  /**
   * Delete custom section
   * @param sectionId - Section ID
   * @returns Promise with success response
   */
  async deleteCustomSection(sectionId: string): Promise<SuccessResponse> {
    try {
      const response = await api.delete<SuccessResponse>(
        `/user-profile/custom-section/${sectionId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting custom section:", error);
      throw error;
    }
  },

  /**
   * Follow user
   * @param userId - User ID to follow
   * @returns Promise with success response
   */
  async followUser(userId: string): Promise<SuccessResponse> {
    try {
      const response = await api.post<SuccessResponse>(
        `/user-profile/follow/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error following user:", error);
      throw error;
    }
  },

  /**
   * Unfollow user
   * @param userId - User ID to unfollow
   * @returns Promise with success response
   */
  async unfollowUser(userId: string): Promise<SuccessResponse> {
    try {
      const response = await api.delete<SuccessResponse>(
        `/user-profile/unfollow/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error unfollowing user:", error);
      throw error;
    }
  },

  /**
   * Get user groups
   * @param userId - User ID
   * @returns Promise with user groups response
   */
  async getUserGroups(userId: string): Promise<UserGroupsResponse> {
    try {
      const response = await api.get<UserGroupsResponse>(
        `/user-profile/groups/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting user groups:", error);
      throw error;
    }
  },

  /**
   * Get user followers
   * @param userId - User ID
   * @param limit - Results limit
   * @param cursor - Pagination cursor
   * @returns Promise with user followers response
   */
  async getUserFollowers(
    userId: string,
    limit: number = 10,
    cursor?: string
  ): Promise<UserFollowersResponse> {
    try {
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      if (cursor) {
        params.append("cursor", cursor);
      }

      const response = await api.get<UserFollowersResponse>(
        `/user-profile/followers/${userId}?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting user followers:", error);
      throw error;
    }
  },

  /**
   * Get users followed by user
   * @param userId - User ID
   * @param limit - Results limit
   * @param cursor - Pagination cursor
   * @returns Promise with user following response
   */
  async getUserFollowing(
    userId: string,
    limit: number = 10,
    cursor?: string
  ): Promise<UserFollowersResponse> {
    try {
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      if (cursor) {
        params.append("cursor", cursor);
      }

      const response = await api.get<UserFollowersResponse>(
        `/user-profile/following/${userId}?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting user following:", error);
      throw error;
    }
  },

  /**
   * Search user followers
   * @param userId - User ID
   * @param query - Search query
   * @param limit - Results limit
   * @param cursor - Pagination cursor
   * @returns Promise with user followers response
   */
  async searchUserFollowers(
    userId: string,
    query: string,
    limit: number = 10,
    cursor?: string
  ): Promise<UserFollowersResponse> {
    try {
      const params = new URLSearchParams();
      params.append("query", query);
      params.append("limit", limit.toString());
      if (cursor) {
        params.append("cursor", cursor);
      }

      const response = await api.get<UserFollowersResponse>(
        `/user-profile/followers/${userId}/search?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error searching user followers:", error);
      throw error;
    }
  },

  /**
   * Search users followed by user
   * @param userId - User ID
   * @param query - Search query
   * @param limit - Results limit
   * @param cursor - Pagination cursor
   * @returns Promise with user following response
   */
  async searchUserFollowing(
    userId: string,
    query: string,
    limit: number = 10,
    cursor?: string
  ): Promise<UserFollowersResponse> {
    try {
      const params = new URLSearchParams();
      params.append("query", query);
      params.append("limit", limit.toString());
      if (cursor) {
        params.append("cursor", cursor);
      }

      const response = await api.get<UserFollowersResponse>(
        `/user-profile/following/${userId}/search?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("Error searching user following:", error);
      throw error;
    }
  },
};

export default userProfileService;
