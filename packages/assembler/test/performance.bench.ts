import { bench, describe } from 'vitest'

import { assemble } from '../src'

const complexProgram = `
ORG 20h

; Programa de ejemplo complejo para benchmarking
inicio:
    MOV AL, 0
    MOV BL, 1
    MOV CL, 10

fibonacci:
    CMP CL, 0
    JZ fin
    MOV DL, AL
    ADD AL, BL
    MOV BL, DL
    DEC CL
    JMP fibonacci

fin:
    HLT

`

const simpleProgram = `
MOV AL, 10h
MOV BL, 20h
ADD AL, BL
HLT
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
