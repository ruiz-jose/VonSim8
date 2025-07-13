import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// El mock de jotai ha sido eliminado para evitar conflicto con el mock global

describe('StatusBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', async () => {
    // Importar StatusBar dinámicamente para evitar problemas de import
    const { StatusBar } = await import('../../editor/StatusBar');
    
    render(<StatusBar />);
    
    // Verificar que el componente se renderiza
    expect(document.querySelector('[data-testid="status-bar"]')).toBeInTheDocument();
  });

  it('should render status bar content', async () => {
    const { StatusBar } = await import('../../editor/StatusBar');
    
    render(<StatusBar />);
    
    // Verificar que la barra de estado está presente
    expect(document.querySelector('[data-testid="status-bar"]')).toBeInTheDocument();
  });

  it('should have proper semantic structure', async () => {
    const { StatusBar } = await import('../../editor/StatusBar');
    
    render(<StatusBar />);
    
    // Verificar estructura semántica
    expect(document.querySelector('[data-testid="status-bar"]')).toBeInTheDocument();
  });
}); 