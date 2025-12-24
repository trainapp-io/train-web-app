import { BaseApiService } from "../../../services/BaseApiService";
import {
  WorkoutLogRequest,
  WorkoutLogResponse,
} from "@trainapp-io/train-core";
import { SuccessResponse } from "../../../types/api.types";

/**
 * Service for workout log operations
 * Handles CRUD operations for workout logs
 */
class WorkoutLogService extends BaseApiService<
  WorkoutLogResponse,
  WorkoutLogRequest,
  WorkoutLogRequest
> {
  constructor() {
    super("/workout-logs", "workout log");
  }

  protected getBaseEndpoint(): string {
    return this.baseEndpoint;
  }

  /**
   * Create a new workout log
   * POST /workout-logs
   */
  async createWorkoutLog(
    workoutLogRequest: WorkoutLogRequest
  ): Promise<WorkoutLogResponse> {
    return this.create(workoutLogRequest);
  }

  /**
   * Get workout log history for a user
   * GET /workout-logs?userId=:userId
   */
  async getWorkoutLogHistory(userId: string): Promise<WorkoutLogResponse[]> {
    return this.get<WorkoutLogResponse[]>(this.getBaseEndpoint(), { userId });
  }

  /**
   * Get a specific workout log by ID
   * GET /workout-logs/:logId
   */
  async getWorkoutLog(logId: string): Promise<WorkoutLogResponse> {
    return this.getById(logId);
  }

  /**
   * Update an existing workout log
   * PUT /workout-logs/:logId
   */
  async updateWorkoutLog(
    logId: string,
    workoutLogRequest: WorkoutLogRequest
  ): Promise<WorkoutLogResponse> {
    return this.update(logId, workoutLogRequest);
  }

  /**
   * Delete a workout log
   * DELETE /workout-logs/:logId
   */
  async deleteWorkoutLog(logId: string): Promise<SuccessResponse> {
    return this.deleteById(logId);
  }
}

// Export singleton instance
export const workoutLogService = new WorkoutLogService();
export default workoutLogService;
