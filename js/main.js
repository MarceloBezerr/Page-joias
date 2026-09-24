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

  // 5. Efeito Sonoro Futurista Sutil (Web Audio API)
  setupAudioEffects();
});

/**
 * Cria tons harmônicos de cristal/joalheria futurista via Web Audio API
 * Sem precisar baixar arquivos externos de áudio.
 */
function setupAudioEffects() {
  const audioToggle = document.getElementById('audio-toggle');
  let audioEnabled = false;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playCrystalChime(freq = 880, duration = 0.6) {
    if (!audioEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Ignora restrições do navegador
    }
  }

  if (audioToggle) {
    audioToggle.addEventListener('click', () => {
      initAudio();
      audioEnabled = !audioEnabled;
      audioToggle.classList.toggle('active', audioEnabled);
      
      const icon = audioToggle.querySelector('svg');
      if (audioEnabled) {
        audioToggle.style.color = '#e5b95c';
        audioToggle.style.borderColor = 'rgba(229, 185, 92, 0.6)';
        playCrystalChime(1046.5, 0.8); // Som de ativação cristalina
      } else {
        audioToggle.style.color = '';
        audioToggle.style.borderColor = '';
      }
    });

    // Interações com som nos botões principais se o áudio estiver ativado
    document.querySelectorAll('.whatsapp-catalog-btn, .narrative-card').forEach(item => {
      item.addEventListener('mouseenter', () => {
        if (audioEnabled) {
          playCrystalChime(1318.5, 0.3); // E nota aguda cristalina
        }
      });
    });
  }
}
