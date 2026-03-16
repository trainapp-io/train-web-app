import React from 'react';
import { LuExternalLink, LuCreditCard } from 'react-icons/lu';
import './StripeOnboardingBanner.css';

interface StripeOnboardingBannerProps {
  onConnect: () => void;
  isLoading: boolean;
}

const StripeOnboardingBanner: React.FC<StripeOnboardingBannerProps> = ({
  onConnect,
  isLoading,
}) => {
  return (
    <div className="stripe-banner" role="alert">
      <div className="stripe-banner__content">
        <LuCreditCard className="stripe-banner__icon" aria-hidden="true" />
        <div className="stripe-banner__text">
          <p className="stripe-banner__title">Connect Stripe to accept payments</p>
          <p className="stripe-banner__subtitle">
            Set up Stripe to record and refund payments for this client.
          </p>
        </div>
      </div>
      <button
        className="stripe-banner__btn"
        onClick={onConnect}
        disabled={isLoading}
        aria-label="Connect Stripe account"
      >
        {isLoading ? (
          'Redirecting…'
        ) : (
          <>
            <LuExternalLink aria-hidden="true" />
            Connect Stripe
          </>
        )}
      </button>
    </div>
  );
};

export default StripeOnboardingBanner;
