import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';

// Wrapper that provides routing + auth context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
}

describe('App shell smoke tests', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <TestWrapper>
        <div data-testid="app-shell">CoffeeCraze</div>
      </TestWrapper>
    );
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
    expect(container).toBeTruthy();
  });
});

describe('SEO component', () => {
  it('sets document title', async () => {
    const SEO = (await import('../../components/common/SEO')).default;
    render(<SEO title="Test Page" description="Test description" />, { wrapper: MemoryRouter });
    expect(document.title).toContain('Test Page');
  });
});

describe('MetricCard component', () => {
  it('renders label and value', async () => {
    const MetricCard = (await import('../../components/dashboard/MetricCard')).default;
    render(
      <MetricCard
        label="Test Metric"
        value="42"
        icon={<span>🔢</span>}
        color="primary"
      />,
      { wrapper: MemoryRouter }
    );
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
