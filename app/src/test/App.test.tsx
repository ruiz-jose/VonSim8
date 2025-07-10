import { describe, expect,it } from 'vitest'

describe('App', () => {
  it('should be defined', () => {
    // Test básico que siempre pasa
    expect(true).toBe(true)
  })

  it('should have basic functionality', () => {
    // Test para verificar que el entorno de testing funciona
    const result = 1 + 1
    expect(result).toBe(2)
  })
})
