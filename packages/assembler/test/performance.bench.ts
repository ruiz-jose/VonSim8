import { bench, describe } from 'vitest'
import { assemble } from '../src'

const complexProgram = `
ORG 1000h

; Programa de ejemplo complejo para benchmarking
inicio:
    MOV AX, 0
    MOV BX, 1
    MOV CX, 10

fibonacci:
    CMP CX, 0
    JZ fin
    MOV DX, AX
    ADD AX, BX
    MOV BX, DX
    DEC CX
    JMP fibonacci

fin:
    HLT
    END
`

const simpleProgram = `
MOV AX, 10h
MOV BX, 20h
ADD AX, BX
END
`

describe('Assembler Performance', () => {
  bench('assemble simple program', () => {
    assemble(simpleProgram)
  })

  bench('assemble complex program', () => {
    assemble(complexProgram)
  })

  bench('assemble with errors', () => {
    assemble('INVALID_INSTRUCTION\nEND')
  })
})
