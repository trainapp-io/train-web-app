import React, { useState, useEffect } from 'react';
import logo from '../../../../assets/logo.svg';
import logoWhite from '../../../../assets/logo-white.svg';
import './AuthCard.css';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1598136490937-f77b0ce520fe?q=80&w=1469&auto=format&fit=crop',
    headline: 'Every rep counts.',
    sub: 'Log your workouts, track your progress, and stay on top of your goals.',
    tag: 'Workout Tracking',
  },
  {
    image: 'https://images.unsplash.com/photo-1763800447274-ec337a0baf7d?q=80&w=1073&auto=format&fit=crop',
    headline: 'Built around your schedule.',
    sub: 'Organize training weeks, assign programs, and manage availability in one place.',
    tag: 'Program Management',
  },
  {
    image: 'https://images.unsplash.com/photo-1611094607507-8c8173e5cf33?q=80&w=1470&auto=format&fit=crop',
    headline: 'Consistency is the goal.',
    sub: 'See your history, spot patterns, and keep momentum going day after day.',
    tag: 'Progress Insights',
  },
];

const AuthCard: React.FC<AuthCardProps> = ({
  title,
  subtitle,
  children,
  footer,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeQuery.addEventListener('change', handleChange);
    return () => darkModeQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="auth-layout">
      <div className="auth-image-panel">
        <div className="auth-slide-images">
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`auth-slide-image ${i === activeSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}
        </div>

        <div className="auth-slides">
          {slides.map((slide, i) => (
            <div key={i} className={`auth-slide ${i === activeSlide ? 'active' : ''}`}>
              <span className="auth-slide-tag">{slide.tag}</span>
              <h2 className="auth-slide-headline">{slide.headline}</h2>
              <p className="auth-slide-sub">{slide.sub}</p>
            </div>
          ))}
        </div>
        <div className="auth-slide-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`auth-slide-dot ${i === activeSlide ? 'active' : ''}`}
              onClick={() => setActiveSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-container">
          <div className="auth-logo-container">
            <img src={isDarkMode ? logoWhite : logo} alt="Logo" className="auth-logo" />
          </div>

          <div className="auth-header">
            <h1 className="auth-title">{title}</h1>
            {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          </div>

          <div className="auth-content">
            {children}
          </div>

          {footer && (
            <div className="auth-footer">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCard;
