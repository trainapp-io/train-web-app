import React, { ReactNode } from 'react';
import './styles/contentView.css';
import { useLocation } from 'react-router';
import PageHeader from './ui/PageHeader';

interface ContentViewProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

const ContentView: React.FC<ContentViewProps> = ({ 
  children, 
  title, 
  actions 
}) => {
  const location = useLocation();
  
  // Get page title from props or derive from location path
  const pageTitle = title || getPageTitleFromPath(location.pathname);
  
  return (
    <div className="content-view">
      {pageTitle && (
        <PageHeader 
          title={pageTitle} 
          actions={actions} 
        />
      )}
      {children}
    </div>
  );
};

// Helper function to derive page title from URL path
const getPageTitleFromPath = (path: string): string => {
  if (path.endsWith('/log')) return 'Log Workout';

  // Remove leading slash and get first segment
  const segment = path.split('/')[1];
  
  if (!segment) return 'Home';
  
  // Convert to title case and handle special cases
  switch (segment) {
    case 'events':
      return 'Events';
    case 'groups':
      return 'Groups';
    case 'profile':
      return 'Profile';
    case 'search':
      return 'Search';
    case 'programs':
      return 'Programs';
    default:
      // Convert kebab-case or camelCase to Title Case
      return segment
        .replace(/-/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^\w/, c => c.toUpperCase());
  }
};

export default ContentView;
