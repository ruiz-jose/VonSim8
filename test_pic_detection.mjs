import { assemble } from '@vonsim/assembler';
import { readFileSync } from 'fs';

try {
  // Leer el archivo de prueba
  const program = readFileSync('test_handshake_pic.asm', 'utf8');

  console.log('=== ENSAMBLANDO PROGRAMA HANDSHAKE CON PIC ===');
  console.log('Instrucciones relevantes:');
  console.log('- out IMR, al    ; IMR EQU 21h (0x21)');
  console.log('- out INT2, al   ; INT2 EQU 26h (0x26)');
  console.log('- out EOI, al    ; EOI EQU 20h (0x20)');
  console.log('');

  const result = assemble(program);

  if (result.success) {
    console.log('=== RESULTADO ===');
    console.log('✅ Ensamblado exitoso');
    console.log('hasORG:', result.hasORG);
    console.log('hasORG20hAtStart:', result.hasORG20hAtStart);
    console.log('🎯 mayUsePIC:', result.mayUsePIC);
    
    if (result.mayUsePIC) {
      console.log('✅ ¡PIC detectado correctamente!');
    } else {
      console.log('❌ PIC NO detectado (debería detectarse)');
    }
  } else {
    console.log('❌ Error en el ensamblado:');
    result.errors.forEach(error => {
      console.log(`- ${error.translate('es')}`);
    });
  }
} catch (error) {
  console.error('Error:', error);
}
