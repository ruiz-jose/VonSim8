           ORG 10H
           N DB 255
           M DB 2
           R DB ?

           ORG 30H
           ; AL almacena el valor del dividendo
           ; BL almacena el valor del divisor
           ; AL almacena el resto
    RESTO: CMP AL,BL
           JS RETORNO

           SUB AL,BL
           JMP RESTO

  RETORNO: RET

           ORG 20H
           MOV AL, N
           MOV BL, M
           CALL RESTO
           HLT
