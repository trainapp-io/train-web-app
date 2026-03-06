import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router";
import { LuLogOut, LuMenu, LuX, LuChevronLeft, LuChevronRight } from "react-icons/lu";
import logo from "@/assets/logo.svg";
import logoWhite from "@/assets/logo-white.svg";
import { authService } from "../app/access/services/authService";
import { tokenService } from "../services/tokenService";
import { LogoutRequest } from "@trainapp-io/train-core";
import "./styles/sidebar.css";

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  tabs: TabItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ tabs }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Check if the screen is mobile size and if it's a small height screen
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileWidth = window.innerWidth <= 768;
      setIsMobile(isMobileWidth);
      
      // Check if it's a small height screen (less than 600px)
      setIsSmallScreen(window.innerHeight < 600);
      
      if (!isMobileWidth) {
        setMobileOpen(false);
      }
    };
    
    // Initial check
    checkScreenSize();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Check for dark mode
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    darkModeQuery.addEventListener('change', handleChange);
    return () => darkModeQuery.removeEventListener('change', handleChange);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [navigate]);

  // Cmd+K shortcut to toggle sidebar (desktop only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey) && !isMobile) {
        e.preventDefault();
        setCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile]);

  const handleSignOut = async () => {
    const logoutRequest: LogoutRequest = {
      deviceId: tokenService.getDeviceId(),
      refreshToken: tokenService.getRefreshToken() || "",
    };
    try {
      await authService.logout(logoutRequest);
      navigate("/login");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  // Determine sidebar classes based on state
  const sidebarClasses = `sidebar ${collapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''} ${isMobile && mobileOpen ? 'mobile-open' : ''}`;
  const overlayClasses = `sidebar-overlay ${mobileOpen ? 'active' : ''}`;

  // Create signout button component
  const SignoutButton = () => (
    <div className={`sidebar-signout ${isSmallScreen ? 'top-position' : ''}`} onClick={handleSignOut} title="Sign Out">
      <span className="tab-icon">
        <LuLogOut />
      </span>
      <span className="tab-label">Sign Out</span>
    </div>
  );

  return (
    <>
      {/* Mobile menu button - positioned in the header area */}
      <button 
        className="mobile-menu-button" 
        onClick={toggleSidebar}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <LuX /> : <LuMenu />}
      </button>

      <div className={sidebarClasses}>
        {/* Only show header on desktop */}
        {!isMobile && (
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <img src={isDarkMode ? logoWhite : logo} alt="Train Logo" />
            </div>
            <button
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <LuChevronRight /> : <LuChevronLeft />}
              {!collapsed && <span className="sidebar-shortcut-hint">⌘K</span>}
            </button>
          </div>
        )}

        {/* Wrap sidebar content in a container for better mobile layout */}
        <div className="sidebar-content">
          {/* Show signout at top for small screens */}
          {isSmallScreen && isMobile && <SignoutButton />}
          
          <div className="sidebar-tabs">
            {tabs.map((tab) => (
              <NavLink
                key={tab.id}
                to={tab.id === "" ? "/" : `/${tab.id}`}
                className={({ isActive }) => `sidebar-tab ${isActive ? "active" : ""}`}
                title={tab.label}
                onClick={() => isMobile && setMobileOpen(false)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </NavLink>
            ))}
          </div>
          
          {/* Show signout at bottom for normal screens */}
          {(!isSmallScreen || !isMobile) && <SignoutButton />}
        </div>
      </div>
      
      {/* Overlay for mobile - closes sidebar when clicking outside */}
      {isMobile && (
        <div 
          className={overlayClasses} 
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        ></div>
      )}
    </>
  );
};

export default Sidebar;
