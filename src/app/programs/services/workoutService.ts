import { BaseApiService } from "../../../services/BaseApiService";
import {
  WorkoutRequest,
  WorkoutResponse,
} from "@seenelm/train-core";
import { SuccessResponse } from "../../../types/api.types";

/**
 * Service for standalone workout management operations
 * Uses /workout endpoint (not /program)
 */
class WorkoutService extends BaseApiService<
  WorkoutResponse,
  WorkoutRequest,
  WorkoutRequest
> {
  constructor() {
    super("/workout", "workout");
  }

  protected getBaseEndpoint(): string {
    return this.baseEndpoint;
  }

  /**
   * Get all workouts for a user
   * GET /workout/user/:userId
   */
  async fetchUserWorkouts(userId: string): Promise<WorkoutResponse[]> {
    return this.get<WorkoutResponse[]>(`/workout/user/${userId}`);
  }

  /**
   * Get a specific workout by ID
   * GET /workout/:workoutId
   */
  async getWorkoutById(workoutId: string): Promise<WorkoutResponse> {
    return this.get<WorkoutResponse>(`/workout/${workoutId}`);
  }

  /**
   * Create a new standalone workout
   * POST /workout
   */
  async createWorkout(workoutRequest: WorkoutRequest): Promise<WorkoutResponse> {
    return this.create(workoutRequest);
  }

  /**
   * Update a workout
   * PUT /workout/:workoutId
   */
  async updateWorkout(
    workoutId: string,
    workoutRequest: WorkoutRequest
  ): Promise<SuccessResponse> {
    return this.put(`/workout/${workoutId}`, workoutRequest);
  }

  /**
   * Delete a workout
   * DELETE /workout/:workoutId
   */
  async deleteWorkout(workoutId: string): Promise<SuccessResponse> {
    return this.deleteById(workoutId);
  }
}

// Export singleton instance
export const workoutService = new WorkoutService();
export default workoutService;
