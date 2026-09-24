/**
 * AURA / ANA BRILLÉ - Scroll Controller & Cinematic Timeline
 * Conecta a rolagem da página à física da cena 3D e aos efeitos visuais do DOM.
 */

class ScrollController {
  constructor(sceneInstance) {
    this.scene = sceneInstance;
    this.progressBar = document.getElementById('scroll-progress');
    this.floatingPill = document.getElementById('floating-wa-pill');
    this.sections = document.querySelectorAll('.story-section');
    this.cards = document.querySelectorAll('.narrative-card, .cta-card');
    
    this.init();
  }

  init() {
    this.bindScroll();
    this.setupIntersectionObserver();
    // Cálculo inicial
    this.onScroll();
  }

  bindScroll() {
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    window.addEventListener('resize', () => this.onScroll(), { passive: true });
  }

  onScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    // Progresso normalizado de 0.0 a 1.0
    const progress = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;

    // 1. Atualizar Barra de Progresso Superior
    if (this.progressBar) {
      this.progressBar.style.width = `${(progress * 100).toFixed(1)}%`;
    }

    // 2. Transmitir para o Motor 3D
    if (this.scene) {
      this.scene.setScrollProgress(progress);
    }

    // 3. Exibir / Ocultar Pílula Flutuante de WhatsApp após scroll inicial
    if (this.floatingPill) {
      if (progress > 0.15 && progress < 0.92) {
        this.floatingPill.classList.add('visible');
      } else {
        this.floatingPill.classList.remove('visible');
      }
    }
  }

  setupIntersectionObserver() {
    // Revelação cinematográfica de cards ao entrar no campo de visão
    const observerOptions = {
      root: null,
      threshold: 0.25,
      rootMargin: '0px'
    };

    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        } else {
          // Mantém opacidade suave caso saia da tela
          entry.target.style.opacity = '0.35';
          entry.target.style.transform = 'translateY(20px)';
        }
      });
    }, observerOptions);

    this.cards.forEach(card => {
      card.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
      cardObserver.observe(card);
    });
  }
}

window.ScrollController = ScrollController;
