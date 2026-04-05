import { useMutation } from '@tanstack/react-query';
import { useApiQuery } from '../../../services/queryService';
import { stripeService } from '../services/stripeService';
import type { StripeOnboardingStatus, StripeOnboardingStartResponse, CrmApiError } from '../types/crm.types';
import type { AxiosError } from 'axios';

export function useStripeStatus() {
  return useApiQuery<StripeOnboardingStatus>(
    ['crm', 'stripe', 'onboarding'],
    '/crm/stripe/onboarding/status'
  );
}

export function useStartOnboarding() {
  return useMutation<StripeOnboardingStartResponse, AxiosError<CrmApiError>, void>({
    mutationFn: () => stripeService.startOnboarding(),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
}
