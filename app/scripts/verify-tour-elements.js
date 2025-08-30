#!/usr/bin/env node

/**
 * Script para verificar que todos los elementos del tour tienen sus correspondientes data-testid
 * Ejecutar con: node scripts/verify-tour-elements.js
 */

const fs = require('fs');
const path = require('path');

// Elementos que el tour busca
const tourTargets = [
  "app-container",
  "header", 
  "controls",
  "panel-editor",
  "panel-computer",
  "cpu-component",
  "memory-component",
  "settings-button",
  "panel-settings",
  "footer-links",
  "cycle-button"
];

// Archivos donde buscar los data-testid
const filesToCheck = [
  'app/src/App.tsx',
  'app/src/components/Header.tsx',
  'app/src/components/Controls.tsx',
  'app/src/components/Footer.tsx',
  'app/src/computer/cpu/CPU.tsx',
  'app/src/computer/memory/Memory.tsx'
];

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const foundTargets = [];
    
    tourTargets.forEach(target => {
      if (content.includes(`data-testid="${target}"`)) {
        foundTargets.push(target);
      }
    });
    
    return foundTargets;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

function main() {
  console.log('🔍 Verificando elementos del tour...\n');
  
  const allFound = new Set();
  const missing = [];
  
  filesToCheck.forEach(filePath => {
    const found = checkFile(filePath);
    found.forEach(target => allFound.add(target));
    
    if (found.length > 0) {
      console.log(`✅ ${filePath}:`);
      found.forEach(target => console.log(`   - ${target}`));
    }
  });
  
  // Verificar elementos faltantes
  tourTargets.forEach(target => {
    if (!allFound.has(target)) {
      missing.push(target);
    }
  });
  
  console.log('\n📊 Resumen:');
  console.log(`✅ Encontrados: ${allFound.size}/${tourTargets.length}`);
  
  if (missing.length > 0) {
    console.log(`❌ Faltantes: ${missing.length}`);
    missing.forEach(target => console.log(`   - ${target}`));
    process.exit(1);
  } else {
    console.log('🎉 ¡Todos los elementos del tour están correctamente configurados!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { tourTargets, checkFile };
