/**
 * ANA BRILLÉ - 3D Real Jewelry Engine
 * Modelos 3D Reais (GLTF/GLB) com Shaders PBR de Joalheria, Iluminação de Estúdio HDR e Sincronização Cinematográfica
 */

class JewelryScene {
  constructor() {
    this.container = document.getElementById('webgl-container');
    this.canvas = document.getElementById('webgl-canvas');
    
    // Modelos 3D Reais
    this.models = {
      royale: 'models/custom-ring-5.glb',
      pear: 'models/ring1.glb'
    };
    this.currentModelKey = 'royale';

    // Acabamentos de Metais Nobres
    this.metalFinishes = {
      gold: {
        name: 'Ouro 18K',
        color: 0xd4af37,
        metalness: 0.98,
        roughness: 0.16,
        clearcoat: 0.3,
        clearcoatRoughness: 0.08
      },
      rose: {
        name: 'Ouro Rosé',
        color: 0xc47b6a,
        metalness: 0.98,
        roughness: 0.16,
        clearcoat: 0.3,
        clearcoatRoughness: 0.08
      },
      silver: {
        name: 'Prata / Platina',
        color: 0xd2d7df,
        metalness: 0.96,
        roughness: 0.14,
        clearcoat: 0.35,
        clearcoatRoughness: 0.06
      }
    };
    this.currentMetalKey = 'gold';

    // Parâmetros de Interação & Scroll
    this.scrollProgress = 0;
    this.targetScrollProgress = 0;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    
    // Keyframes cinematográficos sincronizados com o conteúdo da página
    this.keyframes = [
      // 0.0 - Hero: Apresentação majestosa à direita
      {
        progress: 0.0,
        camPos: { x: 0, y: 0.4, z: 5.2 },
        ringRot: { x: 0.48, y: -0.42, z: 0.05 },
        ringPos: { x: 1.25, y: -0.22, z: 0 },
        ringScale: 0.96
      },
      // 0.25 - Seção 1 (Design Futurista, card na esquerda): Anel à direita mostrando o aro
      {
        progress: 0.25,
        camPos: { x: 0, y: 0.3, z: 5.0 },
        ringRot: { x: 0.8, y: 1.1, z: -0.2 },
        ringPos: { x: 1.25, y: 0.05, z: 0 },
        ringScale: 1.15
      },
      // 0.50 - Seção 2 (Sinta-se Radiante, card na direita): Anel à esquerda mostrando as facetas superiores
      {
        progress: 0.50,
        camPos: { x: 0, y: 0.9, z: 4.8 },
        ringRot: { x: 0.2, y: 2.7, z: 0.15 },
        ringPos: { x: -1.25, y: -0.1, z: 0 },
        ringScale: 1.25
      },
      // 0.75 - Seção 3 (Feito para Você, card na esquerda): Anel à direita em visão macro 3/4
      {
        progress: 0.75,
        camPos: { x: 0, y: 0.4, z: 5.0 },
        ringRot: { x: 0.55, y: 4.3, z: -0.1 },
        ringPos: { x: 1.2, y: 0.0, z: 0 },
        ringScale: 1.18
      },
      // 1.00 - Catálogo WhatsApp: Centralizado sobre o convite do catálogo
      {
        progress: 1.00,
        camPos: { x: 0, y: 0.6, z: 5.4 },
        ringRot: { x: 0.4, y: 6.28, z: 0 },
        ringPos: { x: 0, y: 0.5, z: 0 },
        ringScale: 1.05
      }
    ];

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 50);
    this.camera.position.set(0, 0.5, 5.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    // Grupo para translações do scroll
    this.jewelryGroup = new THREE.Group();
    this.scene.add(this.jewelryGroup);

    // Configurações
    this.setupEnvironment();
    this.setupLighting();
    this.createMaterials();
    this.setupLoaders();

    // Carregar primeiro anel 3D
    this.loadRingModel(this.currentModelKey);

    // Eventos e UI
    this.bindEvents();
    this.setupUIControls();

    this.clock = new THREE.Clock();
    this.animate();
  }

  setupEnvironment() {
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    // Se aberto diretamente via duplo clique no arquivo (protocolo file://),
    // qualquer fetch externo para .hdr é bloqueado por CORS pelo navegador.
    // Usamos o estúdio fotográfico procedural de alta definição imediatamente!
    const isFileProtocol = window.location.protocol === 'file:';

    if (isFileProtocol || !THREE.RGBELoader) {
      this.createStudioFallbackEnvironment(pmremGenerator);
      return;
    }

    try {
      new THREE.RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .load(
          'models/env-metal-8.hdr',
          (texture) => {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            this.scene.environment = envMap;
            texture.dispose();
            pmremGenerator.dispose();
          },
          undefined,
          () => {
            this.createStudioFallbackEnvironment(pmremGenerator);
          }
        );
    } catch (e) {
      this.createStudioFallbackEnvironment(pmremGenerator);
    }
  }

  createStudioFallbackEnvironment(pmremGenerator) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Fundo do estúdio de joalheria de luxo: tons quentes e contrastados para realçar o ouro
    const bgGradient = ctx.createLinearGradient(0, 0, 0, 512);
    bgGradient.addColorStop(0.0, '#3a2b20'); // Teto escuro de estúdio (cria contraste no ouro)
    bgGradient.addColorStop(0.35, '#7a5e48');
    bgGradient.addColorStop(0.5, '#eddcc9');  // Linha de horizonte champagne brilhante
    bgGradient.addColorStop(0.65, '#5c4533');
    bgGradient.addColorStop(1.0, '#221710');  // Chão escuro refletor
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1024, 512);

    // Softbox Superior Difusa (Luz de topo calibrada para joias)
    const topSoftbox = ctx.createRadialGradient(512, 80, 5, 512, 80, 200);
    topSoftbox.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
    topSoftbox.addColorStop(0.5, 'rgba(255, 250, 240, 0.6)');
    topSoftbox.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = topSoftbox;
    ctx.fillRect(300, 0, 424, 180);

    // Refletor dourado na base para aquecer a parte inferior do aro
    const bottomReflector = ctx.createLinearGradient(0, 420, 0, 512);
    bottomReflector.addColorStop(0.0, 'rgba(212, 175, 55, 0.0)');
    bottomReflector.addColorStop(1.0, 'rgba(212, 175, 55, 0.45)');
    ctx.fillStyle = bottomReflector;
    ctx.fillRect(0, 420, 1024, 92);

    // Strip Light Lateral Esquerda (Realce de arestas)
    const leftStrip = ctx.createLinearGradient(120, 0, 220, 0);
    leftStrip.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
    leftStrip.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    leftStrip.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = leftStrip;
    ctx.fillRect(120, 80, 100, 360);

    // Strip Light Lateral Direita (Gleam e brilho das garras)
    const rightStrip = ctx.createLinearGradient(800, 0, 900, 0);
    rightStrip.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
    rightStrip.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    rightStrip.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = rightStrip;
    ctx.fillRect(800, 80, 100, 360);

    // Pontos de Brilho Especular (Para faíscas no diamante)
    const spots = [
      { x: 420, y: 110, r: 25 },
      { x: 600, y: 110, r: 25 },
      { x: 512, y: 60, r: 35 }
    ];
    spots.forEach(s => {
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    const envTexture = new THREE.CanvasTexture(canvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    if (pmremGenerator) {
      this.scene.environment = pmremGenerator.fromEquirectangular(envTexture).texture;
      pmremGenerator.dispose();
    } else {
      this.scene.environment = envTexture;
    }
  }

  setupLighting() {
    // Iluminação calibrada para joias fotográficas em ambiente champagne nude
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 0.55);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff3e0, 1.3);
    keyLight.position.set(4, 6, 4);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xeddcc8, 0.8);
    fillLight.position.set(-4, 2, 4);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.1);
    rimLight.position.set(0, 5, -5);
    this.scene.add(rimLight);
  }

  createMaterials() {
    const initialMetal = this.metalFinishes[this.currentMetalKey];

    // 1. Material de Metal Nobre PBR (Equilíbrio de reflexão e cor rica do ouro)
    this.metalMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(initialMetal.color),
      metalness: initialMetal.metalness,
      roughness: initialMetal.roughness,
      clearcoat: initialMetal.clearcoat,
      clearcoatRoughness: initialMetal.clearcoatRoughness,
      reflectivity: 0.85,
      envMapIntensity: 1.4
    });

    // 2. Material de Diamante Central Cristalino (Alta refração)
    this.centerGemMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.0,
      transmission: 0.96,
      thickness: 0.6,
      ior: 2.417,
      reflectivity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      envMapIntensity: 2.8,
      specularIntensity: 2.2,
      specularColor: new THREE.Color(0xffffff),
      transparent: true,
      opacity: 1.0,
      side: THREE.FrontSide
    });

    // 3. Material de Micro-Diamantes Pavé
    this.paveGemMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.01,
      roughness: 0.01,
      transmission: 0.94,
      thickness: 0.4,
      ior: 2.4,
      reflectivity: 0.9,
      clearcoat: 0.8,
      clearcoatRoughness: 0.0,
      envMapIntensity: 2.5,
      transparent: true,
      opacity: 1.0,
      side: THREE.FrontSide
    });
  }

  setupLoaders() {
    this.gltfLoader = new THREE.GLTFLoader();

    // Se o protocolo for http(s), pode carregar DRACO normalmente
    if (window.location.protocol !== 'file:' && THREE.DRACOLoader) {
      try {
        this.dracoLoader = new THREE.DRACOLoader();
        this.dracoLoader.setDecoderPath('js/draco/');
        this.gltfLoader.setDRACOLoader(this.dracoLoader);
      } catch (e) {
        console.warn('DRACOLoader não disponível:', e);
      }
    }
  }

  base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  applyModelToScene(gltf, modelKey) {
    const ringScene = gltf.scene;

    // Atribuir materiais físicos
    ringScene.traverse((child) => {
      if (child.isMesh) {
        const name = (child.name || '').toLowerCase();
        const parentName = (child.parent && child.parent.name ? child.parent.name : '').toLowerCase();

        const isGem = name.includes('gem') || 
                      name.includes('emerald') || 
                      name.includes('pear') || 
                      name.includes('diamond') || 
                      name.includes('geosphere') ||
                      parentName.includes('gem') ||
                      parentName.includes('diamond');

        const isCenterGem = name.includes('emerald') || 
                            name.includes('pear_1') ||
                            (name.includes('gem') && !name.includes('crv') && !name.includes('pave'));

        if (isCenterGem) {
          child.material = this.centerGemMaterial;
        } else if (isGem) {
          child.material = this.paveGemMaterial;
        } else {
          child.material = this.metalMaterial;
        }

        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Bounding box para centralizar perfeitamente o anel no seu centro de massa
    const box = new THREE.Box3().setFromObject(ringScene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 2.6;
    const scale = targetSize / (maxDim || 1);

    const pivotGroup = new THREE.Group();
    ringScene.position.x = -center.x;
    ringScene.position.y = -center.y;
    ringScene.position.z = -center.z;
    pivotGroup.add(ringScene);
    pivotGroup.scale.setScalar(scale);

    // Orientação customizada para o ângulo de mostruário de joalheria
    if (modelKey === 'royale') {
      pivotGroup.rotation.x = 0.55;
      pivotGroup.rotation.y = -0.4;
    } else {
      // Pear Solitaire: ângulo elegante 3/4 mostrando a coroa de gota e o aro
      pivotGroup.rotation.x = 0.45;
      pivotGroup.rotation.y = 0.65;
      pivotGroup.rotation.z = -0.15;
    }

    this.currentRingPivot = pivotGroup;
    this.jewelryGroup.add(this.currentRingPivot);

    // Iniciar imediatamente no tamanho ideal
    this.meshScale = 1.0;
    this.currentRingPivot.scale.set(1.0, 1.0, 1.0);
  }

  loadRingModel(modelKey) {
    this.currentModelKey = modelKey;

    if (this.currentRingPivot) {
      this.jewelryGroup.remove(this.currentRingPivot);
    }

    // 1. Suporte Nativo Offline e protocolo file:// (sem CORS / sem fetch de rede)
    if (window.JEWELRY_MODELS_DATA && window.JEWELRY_MODELS_DATA[modelKey]) {
      try {
        const buffer = this.base64ToArrayBuffer(window.JEWELRY_MODELS_DATA[modelKey]);
        this.gltfLoader.parse(
          buffer,
          '',
          (gltf) => {
            this.applyModelToScene(gltf, modelKey);
          },
          (err) => {
            console.warn('Erro ao processar modelo Base64 em memória:', err);
            this.loadRingModelFromFile(modelKey);
          }
        );
        return;
      } catch (e) {
        console.warn('Falha ao decodificar Base64:', e);
      }
    }

    // 2. Carregamento tradicional via URL (quando em servidor web http/https)
    this.loadRingModelFromFile(modelKey);
  }

  loadRingModelFromFile(modelKey) {
    const modelUrl = this.models[modelKey];
    if (!modelUrl) return;

    this.gltfLoader.load(
      modelUrl,
      (gltf) => {
        this.applyModelToScene(gltf, modelKey);
      },
      undefined,
      (err) => {
        console.error('Erro ao carregar modelo 3D por URL:', err);
      }
    );
  }

  setMetalFinish(metalKey) {
    const config = this.metalFinishes[metalKey];
    if (!config) return;

    this.currentMetalKey = metalKey;
    this.metalMaterial.color.set(config.color);
    this.metalMaterial.metalness = config.metalness;
    this.metalMaterial.roughness = config.roughness;
    this.metalMaterial.clearcoat = config.clearcoat;
    this.metalMaterial.clearcoatRoughness = config.clearcoatRoughness;
    this.metalMaterial.needsUpdate = true;
  }

  setupUIControls() {
    const modelBtns = document.querySelectorAll('.customizer-btn[data-model]');
    modelBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const model = btn.getAttribute('data-model');
        if (model && model !== this.currentModelKey) {
          modelBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.loadRingModel(model);
        }
      });
    });

    const metalDots = document.querySelectorAll('.color-dot[data-metal]');
    metalDots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        const metal = dot.getAttribute('data-metal');
        if (metal && metal !== this.currentMetalKey) {
          metalDots.forEach((d) => d.classList.remove('active'));
          dot.classList.add('active');
          this.setMetalFinish(metal);
        }
      });
    });
  }

  bindEvents() {
    window.addEventListener('resize', () => this.onResize(), { passive: true });

    // Parallax responsivo e tátil com mouse
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    // Toque para dispositivos móveis
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.targetX = (e.touches[0].clientX / window.innerWidth - 0.5) * 1.5;
        this.mouse.targetY = (e.touches[0].clientY / window.innerHeight - 0.5) * 1.5;
      }
    }, { passive: true });
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  setScrollProgress(progress) {
    this.targetScrollProgress = Math.max(0, Math.min(1, progress));
  }

  interpolateKeyframes(p) {
    let lower = this.keyframes[0];
    let upper = this.keyframes[this.keyframes.length - 1];

    for (let i = 0; i < this.keyframes.length - 1; i++) {
      if (p >= this.keyframes[i].progress && p <= this.keyframes[i + 1].progress) {
        lower = this.keyframes[i];
        upper = this.keyframes[i + 1];
        break;
      }
    }

    const span = upper.progress - lower.progress;
    const localP = span === 0 ? 0 : (p - lower.progress) / span;

    // Curva cúbica suave
    const t = localP * localP * (3 - 2 * localP);
    const lerp = (a, b) => a + (b - a) * t;

    return {
      camPos: {
        x: lerp(lower.camPos.x, upper.camPos.x),
        y: lerp(lower.camPos.y, upper.camPos.y),
        z: lerp(lower.camPos.z, upper.camPos.z)
      },
      ringRot: {
        x: lerp(lower.ringRot.x, upper.ringRot.x),
        y: lerp(lower.ringRot.y, upper.ringRot.y),
        z: lerp(lower.ringRot.z, upper.ringRot.z)
      },
      ringPos: {
        x: lerp(lower.ringPos.x, upper.ringPos.x),
        y: lerp(lower.ringPos.y, upper.ringPos.y),
        z: lerp(lower.ringPos.z, upper.ringPos.z)
      },
      ringScale: lerp(lower.ringScale, upper.ringScale)
    };
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const elapsedTime = this.clock.getElapsedTime();

    // Lerp suave do scroll e mouse
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.06;
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Interpolação dos keyframes do scroll
    const pose = this.interpolateKeyframes(this.scrollProgress);

    // Câmera
    this.camera.position.x = pose.camPos.x + this.mouse.x * 0.25;
    this.camera.position.y = pose.camPos.y - this.mouse.y * 0.25;
    this.camera.position.z = pose.camPos.z;
    this.camera.lookAt(0, 0.2, 0);

    // Responsividade para smartphones
    const isMobile = window.innerWidth < 768;
    const mobileScaleFactor = isMobile ? 0.75 : 1.0;
    const responsivePosX = isMobile ? (this.scrollProgress < 0.1 ? 0 : pose.ringPos.x * 0.3) : pose.ringPos.x;
    const responsivePosY = isMobile ? (this.scrollProgress < 0.1 ? pose.ringPos.y - 0.45 : pose.ringPos.y) : pose.ringPos.y;

    // Transição suave de escala na troca de modelos
    if (this.currentRingPivot) {
      if (this.meshScale < 1.0) {
        this.meshScale += (1.0 - this.meshScale) * 0.1;
      }
      const s = pose.ringScale * mobileScaleFactor * this.meshScale;
      this.currentRingPivot.scale.set(s, s, s);
    }

    // Posição com flutuação orgânica
    this.jewelryGroup.position.x = responsivePosX;
    this.jewelryGroup.position.y = responsivePosY + Math.sin(elapsedTime * 1.5) * 0.04;
    this.jewelryGroup.position.z = pose.ringPos.z;

    // Rotação suave sincronizada + leve giro contínuo + reação ao mouse
    const continuousRotY = elapsedTime * 0.2;
    this.jewelryGroup.rotation.x = pose.ringRot.x + this.mouse.y * 0.25;
    this.jewelryGroup.rotation.y = pose.ringRot.y + continuousRotY + this.mouse.x * 0.35;
    this.jewelryGroup.rotation.z = pose.ringRot.z;

    this.renderer.render(this.scene, this.camera);
  }
}

window.JewelryScene = JewelryScene;
