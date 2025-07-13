import { render, screen } from '@testing-library/react';
import { beforeEach,describe, expect, it, vi } from 'vitest';

// El mock de @/computer ha sido eliminado para evitar conflicto con el mock global

vi.mock('@/lib/posthog', () => ({
  posthog: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    track: vi.fn(),
  }
}));

vi.mock('@/components/Header', () => ({
  Header: () => (
    <header data-testid="header">
      <div>Header</div>
      <div data-testid="controls">Controls</div>
    </header>
  ),
}));

vi.mock('@/components/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock('@/editor', () => ({
  Editor: () => <div data-testid="editor">Editor</div>,
}));

vi.mock('@/components/Controls', () => ({
  Controls: () => <div data-testid="controls">Controls</div>,
}));

// Mock de Jotai para evitar problemas
vi.mock('jotai', () => ({
  atom: vi.fn(),
  useAtom: vi.fn(() => [null, vi.fn()]),
  useAtomValue: vi.fn(() => null),
  atomWithStorage: vi.fn(),
  createStore: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    sub: vi.fn(),
  })),
  Provider: ({ children }: any) => children,
}));

vi.mock('jotai/react', () => ({
  useAtom: vi.fn(() => [null, vi.fn()]),
  useAtomValue: vi.fn(() => null),
  Provider: ({ children }: any) => children,
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', async () => {
    // Importar App dinámicamente para evitar problemas de import
    const { default: App } = await import('../App');
    
    render(<App />);
    
    // Verificar que los componentes principales se renderizan
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should render computer component', async () => {
    const { default: App } = await import('../App');
    
    render(<App />);
    
    expect(screen.getByTestId('computer-container')).toBeInTheDocument();
  });

  it('should render editor component', async () => {
    const { default: App } = await import('../App');
    
    render(<App />);
    
    expect(screen.getByTestId('editor')).toBeInTheDocument();
  });

  it('should render controls component', async () => {
    const { default: App } = await import('../App');
    
    render(<App />);
    
    expect(screen.getByTestId('controls')).toBeInTheDocument();
  });

  it('should have proper accessibility structure', async () => {
    const { default: App } = await import('../App');
    
    render(<App />);
    
    // Verificar estructura básica
    expect(document.querySelector('header')).toBeInTheDocument();
    expect(document.querySelector('footer')).toBeInTheDocument();
  });
});
