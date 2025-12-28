import { BaseApiService } from "../../../services/BaseApiService";
import {
  ProgramResponse,
  ProgramRequest,
  WorkoutRequest,
  WorkoutResponse,
  MealRequest,
  MealResponse,
  WeekRequest,
  WorkoutLogRequest,
  WorkoutLogResponse,
  WeekResponse,
} from "@trainapp-io/train-core";
import { SuccessResponse } from "../../../types/api.types";

/**
 * Service for program management operations
 */
class ProgramService extends BaseApiService<
  ProgramResponse,
  ProgramRequest,
  ProgramRequest
> {
  constructor() {
    super("/program", "program");
  }

  protected getBaseEndpoint(): string {
    return this.baseEndpoint;
  }

  /**
   * Create a new program
   * POST /program
   */
  async createProgram(programData: ProgramRequest): Promise<ProgramResponse> {
    return this.create(programData);
  }

  async updateProgram(
    programId: string,
    programRequest: ProgramRequest
  ): Promise<SuccessResponse> {
    return this.put(`/program/${programId}`, programRequest);
  }

  async deleteProgram(programId: string): Promise<SuccessResponse> {
    return this.deleteById(programId);
  }

  /**
   * Get All User Programs
   * GET /program/user
   */
  async fetchUserPrograms(userId: string): Promise<ProgramResponse[]> {
    return this.get<ProgramResponse[]>(`/program/user/${userId}`);
  }

  /**
   * Get a specific program by ID
   * GET /program/:programId
   */
  async getProgramById(programId: string): Promise<ProgramResponse> {
    return this.get<ProgramResponse>(`/program/${programId}`);
  }

  /**
   * Update a week
   * PUT /program/:programId/week/:weekId
   */
  async updateWeek(
    programId: string,
    weekId: string,
    weekRequest: WeekRequest
  ): Promise<SuccessResponse> {
    return this.put(`/program/${programId}/week/${weekId}`, weekRequest);
  }

  /**
   * Delete a week
   * DELETE /program/:programId/week/:weekId
   */
  async deleteWeek(
    programId: string,
    weekId: string
  ): Promise<SuccessResponse> {
    return this.delete(`/program/${programId}/week/${weekId}`);
  }

  /**
   * Create a new workout
   * POST /program/:programId/week/:weekId/workout
   */
  async createWorkout(
    programId: string,
    weekId: string,
    workoutRequest: WorkoutRequest
  ): Promise<WorkoutResponse> {
    return this.post(
      `/program/${programId}/week/${weekId}/workout`,
      workoutRequest
    );
  }

  /**
   * Update a workout
   * PUT /program/:programId/week/:weekId/workout/:workoutId
   */
  async updateWorkout(
    programId: string,
    weekId: string,
    workoutId: string,
    workoutRequest: WorkoutRequest
  ): Promise<SuccessResponse> {
    return this.put(
      `/program/${programId}/week/${weekId}/workout/${workoutId}`,
      workoutRequest
    );
  }

  /**
   * Delete a workout
   * DELETE /program/:programId/week/:weekId/workout/:workoutId
   */
  async deleteWorkout(
    programId: string,
    weekId: string,
    workoutId: string
  ): Promise<SuccessResponse> {
    return this.delete(
      `/program/${programId}/week/${weekId}/workout/${workoutId}`
    );
  }

  /**
   * Get a specific workout by ID
   * GET /program/:programId/week/:weekId/workout/:workoutId
   */
  async getWorkout(
    programId: string,
    weekId: string,
    workoutId: string
  ): Promise<WorkoutResponse> {
    return this.get(
      `/program/${programId}/week/${weekId}/workout/${workoutId}`
    );
  }

  /**
   * Log a users workout
   * POST /program/:programId/week/:weekId/workout/log
   */
  async createWorkoutLog(
    programId: number,
    weekId: number,
    workoutLogRequest: WorkoutLogRequest
  ): Promise<WorkoutLogResponse> {
    return this.post<WorkoutLogResponse>(
      `/program/${programId}/week/${weekId}/workout/log`,
      workoutLogRequest
    );
  }

  async updateWorkoutLog(
    programId: string,
    weekId: string,
    workoutId: string,
    workoutLogId: string,
    workoutLogRequest: WorkoutLogRequest
  ): Promise<SuccessResponse> {
    return this.put(
      `/program/${programId}/week/${weekId}/workout/${workoutId}/log/${workoutLogId}`,
      workoutLogRequest
    );
  }

  async deleteWorkoutLog(
    programId: string,
    weekId: string,
    workoutId: string,
    workoutLogId: string
  ): Promise<SuccessResponse> {
    return this.delete(
      `/program/${programId}/week/${weekId}/workout/${workoutId}/log/${workoutLogId}`
    );
  }

  async getWorkoutLog(
    programId: string,
    weekId: string,
    workoutId: string,
    workoutLogId: string
  ): Promise<WorkoutLogResponse> {
    return this.get(
      `/program/${programId}/week/${weekId}/workout/${workoutId}/log/${workoutLogId}`
    );
  }

  /**
   * Create a new meal
   * POST /program/:programId/week/:weekId/meal
   */
  async createMeal(
    programId: string,
    weekId: string,
    mealRequest: MealRequest
  ): Promise<MealResponse> {
    return this.post(`/program/${programId}/week/${weekId}/meal`, mealRequest);
  }

  /**
   * Get all workouts for a week
   * GET /program/:programId/week/:weekId/workouts
   */
  async getWeekWorkouts(
    programId: string,
    weekId: string
  ): Promise<WorkoutResponse[]> {
    return this.get(`/program/${programId}/week/${weekId}/workouts`);
  }

  /**
   * Get all meals for a week
   * GET /program/:programId/week/:weekId/meals
   */
  async getWeekMeals(
    programId: string,
    weekId: string
  ): Promise<MealResponse[]> {
    return this.get(`/program/${programId}/week/${weekId}/meals`);
  }

  /**
   * Get all details of a week
   * GET /program/:programId/week/:weekId
   */
  async getWeek(programId: string, weekId: string): Promise<WeekResponse> {
    return this.get(`/program/${programId}/week/${weekId}`);
  }
}

// Export singleton instance
export const programService = new ProgramService();
export default programService;
