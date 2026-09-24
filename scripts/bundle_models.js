const fs = require('fs');
const path = require('path');

const royaleB64 = fs.readFileSync(path.join(__dirname, '..', 'models', 'royale_opt.glb')).toString('base64');
const pearB64 = fs.readFileSync(path.join(__dirname, '..', 'models', 'pear_uncompressed.glb')).toString('base64');

const content = `/**
 * ANA BRILLE - 3D Models in Base64 format
 * Suporte 100% nativo offline e protocolo file:// sem bloqueios de CORS
 */
window.JEWELRY_MODELS_DATA = {
  royale: "${royaleB64}",
  pear: "${pearB64}"
};
`;

fs.writeFileSync(path.join(__dirname, '..', 'js', 'models_data.js'), content, 'utf8');
console.log('Successfully generated js/models_data.js! Size:', fs.statSync(path.join(__dirname, '..', 'js', 'models_data.js')).size);
