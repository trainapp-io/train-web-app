import { WorkoutResponse, WorkoutRequest } from "@trainapp-io/train-core";
import { BaseApiService } from "../../../services/BaseApiService";
import { SuccessResponse } from "../../../types/api.types";

export class WorkoutService extends BaseApiService<
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

  async createWorkout(workoutData: WorkoutRequest): Promise<WorkoutResponse> {
    return this.create(workoutData);
  }

  async getWorkouts(): Promise<WorkoutResponse[]> {
    return this.get<WorkoutResponse[]>(`${this.getBaseEndpoint()}/`);
  }

  async getWorkoutById(workoutId: string): Promise<WorkoutResponse> {
    return this.getById(workoutId);
  }

  async updateWorkout(
    workoutId: string,
    workoutData: WorkoutRequest
  ): Promise<WorkoutResponse> {
    return this.update(workoutId, workoutData);
  }

  async deleteWorkout(workoutId: string): Promise<SuccessResponse> {
    return this.deleteById(workoutId);
  }
}

export const workoutService = new WorkoutService();
export default workoutService;
