import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from "vitest"
import { generateDynamicConfigurationComponent } from '../configurationGenerator';
import { Configuration } from '../../types/configuration';

// Mock dependencies
vi.mock('../../hooks/useConfiguration', () => ({
  useConfiguration: () => ({
    saveConfiguration: vi.fn(),
    loading: false
  })
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-token'
  })
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../services/FieldRenderer', () => ({
  FieldRenderer: {
    renderFields: () => <div>Mock Fields</div>
  }
}));

vi.mock('../../components/common/ComponentCard', () => {
  return {
    default: function MockComponentCard({ title, children }: { title: string; children: React.ReactNode }) {
      return (
        <div data-testid="component-card">
          <h2>{title}</h2>
          {children}
        </div>
      );
    }
  };
});

describe('configurationGenerator', () => {
  const mockConfigurations: Configuration[] = [
    {
      id: '1',
      client_id: 'test-client',
      section: 'test-section',
      sub: 'sub-section',
      key: 'test-key',
      value: 'test-value',
      title: 'Test configuration',
      type: 'string',
      note: '',
      order: 1,
      public: true,
      created_at: new Date(),
      updated_at: new Date(),
      status_id: 0
    }
  ];

  it('should generate a dynamic configuration component with correct section name', () => {
    const DynamicComponent = generateDynamicConfigurationComponent('testSection');

    render(
      <DynamicComponent
        configurations={mockConfigurations}
        onConfigSaved={() => { }}
      />
    );

    expect(screen.getByText('TestSection')).toBeTruthy();
    expect(screen.getByText('Save TestSection Configuration')).toBeTruthy();
  });

  it('should show empty state when no configurations are provided', () => {
    const DynamicComponent = generateDynamicConfigurationComponent('emptySection');

    render(
      <DynamicComponent
        configurations={[]}
        onConfigSaved={() => { }}
      />
    );

    expect(screen.getByText('No configurations found for EmptySection section.')).toBeTruthy();
  });
});