        ; Programa de prueba para saltos condicionales
        ; Este programa prueba JZ y JC para verificar que la animación MBR→ri
        ; solo se ejecute cuando la condición es verdadera
        
        ; Configurar flags para pruebas
        mov al, 0       ; AL = 0, esto establecerá ZF = 1
        cmp al, 0       ; Comparar AL con 0, ZF = 1
        
        ; Test 1: JZ con ZF = 1 (debe saltar)
        jz salto1       ; Debe saltar y mostrar animación MBR→ri→IP
        
        ; Si llegamos aquí, algo salió mal
        hlt
        
salto1: mov al, 1       ; AL = 1, esto establecerá ZF = 0
        cmp al, 0       ; Comparar AL con 0, ZF = 0
        
        ; Test 2: JZ con ZF = 0 (no debe saltar)
        jz salto2       ; No debe saltar, no debe mostrar animación MBR→ri→IP
        
        ; Test 3: JC con CF = 0 (no debe saltar)
        clc             ; Clear carry flag
        jc salto3       ; No debe saltar, no debe mostrar animación MBR→ri→IP
        
        ; Test 4: JC con CF = 1 (debe saltar)
        stc             ; Set carry flag
        jc salto3       ; Debe saltar y mostrar animación MBR→ri→IP
        
        ; Si llegamos aquí, algo salió mal
        hlt
        
salto2: ; Este punto no debería alcanzarse
        hlt
        
salto3: ; Este punto debería alcanzarse solo en el test 4
        hlt
        