import api from '../../../services/apiClient';
import type { StripeOnboardingStatus, StripeOnboardingStartResponse } from '../types/crm.types';

export const stripeService = {
  async getOnboardingStatus(): Promise<StripeOnboardingStatus> {
    const response = await api.get<StripeOnboardingStatus>('/crm/stripe/onboarding/status');
    return response.data;
  },

  async startOnboarding(): Promise<StripeOnboardingStartResponse> {
    const response = await api.post<StripeOnboardingStartResponse>('/crm/stripe/onboarding');
    return response.data;
  },
};

export default stripeService;
