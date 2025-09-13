import { assemble } from '@vonsim/assembler';
import { readFileSync } from 'fs';

// Leer el archivo de prueba
const program = readFileSync('test_pic_simple.asm', 'utf8');

console.log('Programa a ensamblar:');
console.log(program);
console.log('\n=== ENSAMBLANDO ===');

const result = assemble(program);

if (result.success) {
  console.log('\n=== RESULTADO DEL ENSAMBLADO ===');
  console.log('hasINT:', result.hasORG);
  console.log('hasORG20hAtStart:', result.hasORG20hAtStart);
  console.log('mayUsePIC:', result.mayUsePIC);
} else {
  console.log('Error en el ensamblado:', result.errors);
}
