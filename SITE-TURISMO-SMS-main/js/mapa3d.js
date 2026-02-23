/**
 * ============================================================
 * MAPA 3D INTERATIVO - VERSÃO 3.0
 * ============================================================
 * 
 * Mapa 3D de São Mateus do Sul usando Three.js
 * Com pontos turísticos interativos e animações
 */

const Mapa3D = {
    
    // Configurações
    config: {
        containerId: 'mapa-3d-container',
        largura: 800,
        altura: 600,
        corFundo: 0x87CEEB, // Azul céu
        corTerrain: 0x228B22, // Verde floresta
        corAgua: 0x4169E1 // Azul rio
    },
    
    // Pontos turísticos
    pontosTuristicos: [
        { id: 1, nome: 'Igreja Matriz São Mateus', lat: -25.8745, lng: -50.3827, tipo: 'religioso', cor: 0xFF6B6B },
        { id: 2, nome: 'Praça do Rio Iguaçu', lat: -25.8698, lng: -50.3785, tipo: 'lazer', cor: 0x4ECDC4 },
        { id: 3, nome: 'Rua do Mathe', lat: -25.8712, lng: -50.3801, tipo: 'gastronomia', cor: 0xFFE66D },
        { id: 4, nome: 'Museu da Erva-Mate', lat: -25.8680, lng: -50.3850, tipo: 'cultural', cor: 0x95E1D3 },
        { id: 5, nome: 'Igreja Água Branca', lat: -25.8520, lng: -50.4100, tipo: 'religioso', cor: 0xFF6B6B },
        { id: 6, nome: 'Porto Gastronômico', lat: -25.8690, lng: -50.3760, tipo: 'gastronomia', cor: 0xFFE66D },
        { id: 7, nome: 'Caixa d\'Água Cuia', lat: -25.8735, lng: -50.3815, tipo: 'monumento', cor: 0xDDA0DD },
        { id: 8, nome: 'Prefeitura Municipal', lat: -25.8728, lng: -50.3822, tipo: 'institucional', cor: 0xA8A8A8 },
        { id: 9, nome: 'Igreja do Taquaral', lat: -25.8900, lng: -50.3500, tipo: 'religioso', cor: 0xFF6B6B },
        { id: 10, nome: 'Parque da Erva-Mate', lat: -25.8650, lng: -50.3900, tipo: 'natureza', cor: 0x98D8C8 },
        { id: 11, nome: 'Mirante do Rio Iguaçu', lat: -25.8670, lng: -50.3720, tipo: 'natureza', cor: 0x98D8C8 },
        { id: 12, nome: 'Centro Cultural', lat: -25.8720, lng: -50.3830, tipo: 'cultural', cor: 0x95E1D3 }
    ],
    
    // Objetos Three.js
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    marcadores: [],
    raycaster: null,
    mouse: null,
    
    // Inicializar mapa 3D
    init: function(containerId) {
        if (containerId) this.config.containerId = containerId;
        
        const container = document.getElementById(this.config.containerId);
        if (!container) {
            console.error('Container não encontrado:', this.config.containerId);
            return;
        }
        
        // Verificar se Three.js está carregado
        if (typeof THREE === 'undefined') {
            this.carregarThreeJS().then(() => this.criarCena(container));
        } else {
            this.criarCena(container);
        }
    },
    
    // Carregar Three.js dinamicamente
    carregarThreeJS: function() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    // Criar cena 3D
    criarCena: function(container) {
        const largura = container.clientWidth || this.config.largura;
        const altura = container.clientHeight || this.config.altura;
        
        // Cena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.config.corFundo);
        this.scene.fog = new THREE.Fog(this.config.corFundo, 50, 200);
        
        // Câmera
        this.camera = new THREE.PerspectiveCamera(60, largura / altura, 0.1, 1000);
        this.camera.position.set(0, 30, 40);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(largura, altura);
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);
        
        // Raycaster para interatividade
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Iluminação
        this.criarIluminacao();
        
        // Terreno
        this.criarTerreno();
        
        // Rio Iguaçu
        this.criarRio();
        
        // Marcadores dos pontos turísticos
        this.criarMarcadores();
        
        // Prédios procedurais
        this.criarPredios();
        
        // Árvores
        this.criarArvores();
        
        // Eventos
        this.adicionarEventos(container);
        
        // Animação
        this.animar();
        
        console.log('🗺️ Mapa 3D iniciado');
    },
    
    // Criar iluminação
    criarIluminacao: function() {
        // Luz ambiente
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);
        
        // Luz direcional (sol)
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        this.scene.add(sun);
        
        // Luz hemisférica
        const hemi = new THREE.HemisphereLight(0x87CEEB, 0x228B22, 0.4);
        this.scene.add(hemi);
    },
    
    // Criar terreno
    criarTerreno: function() {
        const geometry = new THREE.PlaneGeometry(100, 100, 50, 50);
        
        // Adicionar variação de altura
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 2] = Math.random() * 0.5; // Pequena variação
        }
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshLambertMaterial({ 
            color: this.config.corTerrain,
            side: THREE.DoubleSide
        });
        
        const terreno = new THREE.Mesh(geometry, material);
        terreno.rotation.x = -Math.PI / 2;
        terreno.receiveShadow = true;
        this.scene.add(terreno);
    },
    
    // Criar Rio Iguaçu
    criarRio: function() {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-50, 0.1, 10),
            new THREE.Vector3(-30, 0.1, 8),
            new THREE.Vector3(-10, 0.1, 12),
            new THREE.Vector3(10, 0.1, 10),
            new THREE.Vector3(30, 0.1, 15),
            new THREE.Vector3(50, 0.1, 12)
        ]);
        
        const geometry = new THREE.TubeGeometry(curve, 100, 3, 8, false);
        const material = new THREE.MeshBasicMaterial({ 
            color: this.config.corAgua,
            transparent: true,
            opacity: 0.8
        });
        
        const rio = new THREE.Mesh(geometry, material);
        rio.rotation.x = Math.PI / 2;
        this.scene.add(rio);
        
        // Animação da água
        this.rio = rio;
    },
    
    // Criar marcadores dos pontos turísticos
    criarMarcadores: function() {
        this.pontosTuristicos.forEach((ponto, index) => {
            // Converter lat/lng para coordenadas 3D (simplificado)
            const x = (ponto.lng + 50.39) * 500;
            const z = (ponto.lat + 25.87) * -500;
            
            // Pin
            const pinGeometry = new THREE.ConeGeometry(0.8, 2, 8);
            const pinMaterial = new THREE.MeshLambertMaterial({ color: ponto.cor });
            const pin = new THREE.Mesh(pinGeometry, pinMaterial);
            pin.position.set(x, 1, z);
            pin.rotation.x = Math.PI;
            pin.castShadow = true;
            
            // Esfera no topo
            const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
            const sphere = new THREE.Mesh(sphereGeometry, pinMaterial);
            sphere.position.set(x, 2.5, z);
            sphere.castShadow = true;
            
            // Grupo
            const grupo = new THREE.Group();
            grupo.add(pin);
            grupo.add(sphere);
            grupo.userData = { ponto: ponto, index: index };
            
            this.scene.add(grupo);
            this.marcadores.push(grupo);
        });
    },
    
    // Criar prédios procedurais
    criarPredios: function() {
        for (let i = 0; i < 30; i++) {
            const largura = 1 + Math.random() * 2;
            const altura = 2 + Math.random() * 5;
            const profundidade = 1 + Math.random() * 2;
            
            const geometry = new THREE.BoxGeometry(largura, altura, profundidade);
            const material = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(0, 0, 0.7 + Math.random() * 0.3)
            });
            
            const predio = new THREE.Mesh(geometry, material);
            predio.position.set(
                (Math.random() - 0.5) * 60,
                altura / 2,
                (Math.random() - 0.5) * 40 - 5
            );
            predio.castShadow = true;
            predio.receiveShadow = true;
            
            this.scene.add(predio);
        }
    },
    
    // Criar árvores
    criarArvores: function() {
        for (let i = 0; i < 50; i++) {
            // Tronco
            const troncoGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
            const troncoMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const tronco = new THREE.Mesh(troncoGeometry, troncoMaterial);
            
            // Copa
            const copaGeometry = new THREE.ConeGeometry(1.5, 3, 8);
            const copaMaterial = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(0.3, 0.6, 0.3 + Math.random() * 0.2)
            });
            const copa = new THREE.Mesh(copaGeometry, copaMaterial);
            copa.position.y = 2.5;
            
            // Grupo árvore
            const arvore = new THREE.Group();
            arvore.add(tronco);
            arvore.add(copa);
            arvore.position.set(
                (Math.random() - 0.5) * 80,
                1,
                (Math.random() - 0.5) * 80
            );
            arvore.scale.setScalar(0.5 + Math.random() * 0.5);
            
            this.scene.add(arvore);
        }
    },
    
    // Adicionar eventos de mouse
    adicionarEventos: function(container) {
        const self = this;
        
        container.addEventListener('mousemove', function(event) {
            const rect = container.getBoundingClientRect();
            self.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            self.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        });
        
        container.addEventListener('click', function(event) {
            self.verificarClique();
        });
        
        // Controles de rotação simples
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        container.addEventListener('mousedown', function(e) {
            isDragging = true;
        });
        
        container.addEventListener('mouseup', function(e) {
            isDragging = false;
        });
        
        container.addEventListener('mousemove', function(e) {
            if (isDragging) {
                const deltaX = e.clientX - previousMousePosition.x;
                const deltaY = e.clientY - previousMousePosition.y;
                
                self.camera.position.x += deltaX * 0.1;
                self.camera.position.z += deltaY * 0.1;
                self.camera.lookAt(0, 0, 0);
            }
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        // Zoom com scroll
        container.addEventListener('wheel', function(e) {
            e.preventDefault();
            self.camera.position.y += e.deltaY * 0.05;
            self.camera.position.y = Math.max(10, Math.min(100, self.camera.position.y));
            self.camera.lookAt(0, 0, 0);
        });
    },
    
    // Verificar clique em marcador
    verificarClique: function() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.marcadores, true);
        
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj.parent && !obj.userData.ponto) {
                obj = obj.parent;
            }
            
            if (obj.userData.ponto) {
                this.mostrarInfoPonto(obj.userData.ponto);
            }
        }
    },
    
    // Mostrar informação do ponto turístico
    mostrarInfoPonto: function(ponto) {
        // Criar ou atualizar tooltip
        let tooltip = document.getElementById('mapa3d-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'mapa3d-tooltip';
            tooltip.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 300px;
                text-align: center;
            `;
            document.body.appendChild(tooltip);
        }
        
        tooltip.innerHTML = `
            <h3 style="color: #0a3d2e; margin-bottom: 10px;">${ponto.nome}</h3>
            <p style="color: #666; margin-bottom: 15px;">Tipo: ${ponto.tipo}</p>
            <button onclick="document.getElementById('mapa3d-tooltip').remove()" 
                    style="background: #0a3d2e; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">
                Fechar
            </button>
        `;
    },
    
    // Loop de animação
    animar: function() {
        const self = this;
        
        function loop() {
            requestAnimationFrame(loop);
            
            // Animar marcadores (pulsar)
            self.marcadores.forEach((m, i) => {
                m.position.y = Math.sin(Date.now() * 0.003 + i) * 0.3;
            });
            
            self.renderer.render(self.scene, self.camera);
        }
        
        loop();
    }
};

// Exportar
window.Mapa3D = Mapa3D;
