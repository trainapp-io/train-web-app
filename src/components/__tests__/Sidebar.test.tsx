import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/assets/logo.svg', () => ({ default: 'logo.svg' }));
vi.mock('@/assets/logo-white.svg', () => ({ default: 'logo-white.svg' }));

vi.mock('../../app/access/services/authService', () => ({
  authService: { logout: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../services/tokenService', () => ({
  tokenService: {
    getDeviceId: vi.fn().mockReturnValue('device-id'),
    getRefreshToken: vi.fn().mockReturnValue('refresh-token'),
  },
}));

import Sidebar from '../Sidebar';
import { LuHouse, LuDumbbell } from 'react-icons/lu';

const tabs = [
  { id: '', label: 'Home', icon: <LuHouse /> },
  { id: 'workouts', label: 'Workouts', icon: <LuDumbbell /> },
];

const renderSidebar = () =>
  render(
    <BrowserRouter>
      <Sidebar tabs={tabs} />
    </BrowserRouter>
  );

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure desktop viewport for each test
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
  });

  it('renders all tab labels', () => {
    renderSidebar();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Workouts')).toBeInTheDocument();
  });

  it('renders sign out button', () => {
    renderSidebar();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('renders mobile menu button', () => {
    renderSidebar();
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('toggles mobile menu on button click', async () => {
    // Simulate mobile viewport before mounting
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    renderSidebar();
    const menuButton = await screen.findByRole('button', { name: /open menu/i });
    fireEvent.click(menuButton);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
    });
  });

  it('renders sidebar toggle button on desktop', () => {
    renderSidebar();
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();
  });

  it('collapses sidebar when toggle button is clicked', () => {
    renderSidebar();
    const toggle = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
  });

  it('toggles sidebar with Cmd+K keyboard shortcut', () => {
    renderSidebar();
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();
  });

  it('does not toggle with Cmd+K when Ctrl is used (also valid)', () => {
    renderSidebar();
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
  });

  it('ignores unrelated key presses', () => {
    renderSidebar();
    fireEvent.keyDown(window, { key: 'j', metaKey: true });
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();
  });

  it('shows ⌘K hint in toggle button', () => {
    renderSidebar();
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });
});
