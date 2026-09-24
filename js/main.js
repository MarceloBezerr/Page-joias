/**
 * AURA / ANA BRILLÉ - Main Application Controller
 * Inicializa a cena 3D, scroll controller, eventos do WhatsApp e efeitos de som.
 */

document.addEventListener('DOMContentLoaded', () => {
  const config = window.STORE_CONFIG || {
    brandName: "Ana Brillé",
    brandSubtitle: "Design Futurista & Estilo",
    whatsappNumber: "5581987296954",
    whatsappMessage: "Olá! Adorei o site e quero conhecer o catálogo da Ana Brillé!"
  };

  // 1. Atualizar textos dinâmicos da marca
  const brandNameElements = document.querySelectorAll('.dynamic-brand-name');
  brandNameElements.forEach(el => {
    el.textContent = config.brandName;
  });

  const brandSubtitleElements = document.querySelectorAll('.dynamic-brand-subtitle');
  brandSubtitleElements.forEach(el => {
    el.textContent = config.brandSubtitle;
  });

  // 2. Configurar Links do WhatsApp com número e mensagem pré-definida
  const encodedMsg = encodeURIComponent(config.whatsappMessage);
  const waUrl = `https://wa.me/${config.whatsappNumber}?text=${encodedMsg}`;

  const waButtons = document.querySelectorAll('.whatsapp-link-trigger');
  waButtons.forEach(btn => {
    btn.setAttribute('href', waUrl);
    btn.setAttribute('target', '_blank');
    btn.setAttribute('rel', 'noopener noreferrer');
  });

  // 3. Inicializar a Cena 3D Three.js
  let jewelryScene = null;
  try {
    if (typeof THREE !== 'undefined' && typeof JewelryScene !== 'undefined') {
      jewelryScene = new JewelryScene();
      window.jewelryScene = jewelryScene;
    } else {
      console.warn("Three.js ou JewelryScene não carregados.");
    }
  } catch (err) {
    console.error("Erro ao inicializar Three.js:", err);
  }

  // 4. Inicializar o Controlador de Scroll
  if (jewelryScene && typeof ScrollController !== 'undefined') {
    new ScrollController(jewelryScene);
  }
});
