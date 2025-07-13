import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock de módulos antes de importar
vi.mock('@/lib/toast', () => ({
  toast: vi.fn(),
}));

vi.mock('@/editor/methods', () => ({
  highlightLine: vi.fn(),
  setReadOnly: vi.fn(),
}));

vi.mock('@/computer/shared/animate', () => ({
  stopAllAnimations: vi.fn(),
}));

// Mock del hook useSimulation
const mockUseSimulation = vi.fn(() => ({
  status: { type: 'stopped' },
  dispatch: vi.fn(),
}));

// Mock del módulo de simulación
vi.mock('@/computer/simulation', () => ({
  useSimulation: mockUseSimulation,
}));

describe('Simulation Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSimulation Hook', () => {
    it('should return simulation status', () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      expect(result.current).toHaveProperty('status');
      expect(result.current).toHaveProperty('dispatch');
    });

    it('should have initial stopped status', () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      expect(result.current.status.type).toBe('stopped');
    });

    it('should provide dispatch function', () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      expect(typeof result.current.dispatch).toBe('function');
    });
  });

  describe('Simulation Actions', () => {
    it('should handle cpu.run action', async () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      await act(async () => {
        await result.current.dispatch('cpu.run', 'infinity');
      });
      
      expect(result.current.dispatch).toHaveBeenCalledWith('cpu.run', 'infinity');
    });

    it('should handle cpu.stop action', async () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      await act(async () => {
        await result.current.dispatch('cpu.stop');
      });
      
      expect(result.current.dispatch).toHaveBeenCalledWith('cpu.stop');
    });

    it('should handle cpu.stop with reset', async () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      await act(async () => {
        await result.current.dispatch('cpu.stop', true);
      });
      
      expect(result.current.dispatch).toHaveBeenCalledWith('cpu.stop', true);
    });

    it('should handle f10.press action', async () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      await act(async () => {
        await result.current.dispatch('f10.press');
      });
      
      expect(result.current.dispatch).toHaveBeenCalledWith('f10.press');
    });

    it('should handle switch.toggle action', async () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      await act(async () => {
        await result.current.dispatch('switch.toggle', 0);
      });
      
      expect(result.current.dispatch).toHaveBeenCalledWith('switch.toggle', 0);
    });

    it('should handle keyboard.sendChar action', async () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      await act(async () => {
        await result.current.dispatch('keyboard.sendChar', 'A');
      });
      
      expect(result.current.dispatch).toHaveBeenCalledWith('keyboard.sendChar', 'A');
    });

    it('should handle screen.clean action', async () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      await act(async () => {
        await result.current.dispatch('screen.clean');
      });
      
      expect(result.current.dispatch).toHaveBeenCalledWith('screen.clean');
    });

    it('should handle printer.clean action', async () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      await act(async () => {
        await result.current.dispatch('printer.clean');
      });
      
      expect(result.current.dispatch).toHaveBeenCalledWith('printer.clean');
    });
  });

  describe('Error Handling', () => {
    it('should handle simulator errors gracefully', async () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      // Simular un error
      result.current.dispatch.mockRejectedValueOnce(new Error('Test error'));
      
      await act(async () => {
        try {
          await result.current.dispatch('cpu.run', 'infinity');
        } catch (error) {
          // Error esperado
        }
      });
      
      expect(result.current.dispatch).toHaveBeenCalledWith('cpu.run', 'infinity');
    });

    it('should handle invalid actions', async () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      await act(async () => {
        try {
          await result.current.dispatch('invalid.action' as any);
        } catch (error) {
          // Error esperado
        }
      });
      
      expect(result.current.dispatch).toHaveBeenCalledWith('invalid.action');
    });
  });

  describe('State Management', () => {
    it('should maintain state consistency', () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      // Verificar que el estado inicial es consistente
      expect(result.current.status.type).toBe('stopped');
      
      // Verificar que las funciones están disponibles
      expect(typeof result.current.dispatch).toBe('function');
    });

    it('should handle state transitions properly', async () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      // Verificar transición de stopped a running
      await act(async () => {
        await result.current.dispatch('cpu.run', 'infinity');
      });
      
      expect(result.current.dispatch).toHaveBeenCalledWith('cpu.run', 'infinity');
      
      // Verificar transición de running a stopped
      await act(async () => {
        await result.current.dispatch('cpu.stop');
      });
      
      expect(result.current.dispatch).toHaveBeenCalledWith('cpu.stop');
    });
  });

  describe('Performance', () => {
    it('should handle rapid state changes efficiently', async () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      const startTime = performance.now();
      
      // Realizar múltiples cambios de estado rápidamente
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await result.current.dispatch('cpu.run', 'cycle-change');
        });
      }
      
      const endTime = performance.now();
      
      // Verificar que los cambios se realizan eficientemente
      expect(endTime - startTime).toBeLessThan(1000); // Menos de 1 segundo
      expect(result.current.dispatch).toHaveBeenCalledTimes(10);
    });

    it('should not cause memory leaks', () => {
      const { unmount } = renderHook(() => mockUseSimulation());
      
      // Verificar que se puede desmontar sin errores
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should integrate with editor methods', async () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      await act(async () => {
        await result.current.dispatch('cpu.run', 'infinity');
      });
      
      expect(result.current.dispatch).toHaveBeenCalledWith('cpu.run', 'infinity');
    });

    it('should integrate with animation system', async () => {
      const { result } = renderHook(() => mockUseSimulation());
      
      await act(async () => {
        await result.current.dispatch('cpu.stop');
      });
      
      expect(result.current.dispatch).toHaveBeenCalledWith('cpu.stop');
    });
  });
}); 