import { BaseApiService, QueryParams } from "../../../services/BaseApiService";
import {
  PaginationResponse,
  CertificationResponse,
  SearchProfilesResponse,
} from "@trainapp-io/train-core";

/**
 * Service for search operations
 */
class SearchService extends BaseApiService<any, any, any> {
  constructor() {
    super("/search", "search");
  }

  protected getBaseEndpoint(): string {
    return this.baseEndpoint;
  }

  /**
   * Search certifications
   * GET /search/certifications
   * @param searchTerm - Search query
   * @param page - Page number
   * @param limit - Results limit
   * @returns Promise with certifications search response
   */
  async searchCertifications(
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResponse<CertificationResponse>> {
    const params: QueryParams = {
      searchTerm,
      page,
      limit,
    };

    return this.get<PaginationResponse<CertificationResponse>>(
      "/search/certifications",
      params
    );
  }

  /**
   * Search profiles and groups
   * GET /search/profiles
   * @param searchTerm - Search query
   * @param page - Page number
   * @param limit - Results limit
   * @returns Promise with profiles search response
   */
  async searchProfilesAndGroups(
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResponse<SearchProfilesResponse>> {
    const params: QueryParams = {
      searchTerm,
      page,
      limit,
    };

    return this.get<PaginationResponse<SearchProfilesResponse>>(
      "/search/profiles",
      params
    );
  }
}

// Export singleton instance
export const searchService = new SearchService();
export default searchService;
