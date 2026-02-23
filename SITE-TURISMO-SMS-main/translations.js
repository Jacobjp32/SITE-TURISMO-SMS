/**
 * Sistema de Traduções - Portal de Turismo São Mateus do Sul
 * Idiomas: PT (Português), EN (English), ES (Español), PL (Polski)
 */

const translations = {
    pt: {
        // === NAVEGAÇÃO ===
        'nav-inicio': 'Início',
        'nav-oquefazer': 'O Que Fazer',
        'nav-todas-atracoes': '🌿 Todas as Atrações',
        'nav-erva-mate': '🧉 Rota da Erva-Mate',
        'nav-cultura-polonesa': '🇵🇱 Cultura Polonesa',
        'nav-turismo-fe': '⛪ Turismo de Fé',
        'nav-natureza': '🌊 Náutica e Natureza',
        'nav-sabores': 'Sabores',
        'nav-gastronomia': '🍽️ Gastronomia',
        'nav-culinaria-polonesa': '🥟 Culinária Polonesa',
        'nav-feiras': '🛒 Feiras e Produtores',
        'nav-restaurantes': '🍴 Restaurantes',
        'nav-eventos': 'Eventos',
        'nav-onde-ficar': 'Onde Ficar',
        'nav-roteiros': 'Roteiros',
        'nav-sobre': 'Sobre',
        'nav-cidade': '🏛️ A Cidade',
        'nav-transparencia': '📋 Transparência',
        'nav-trade': '💼 Para o Trade',
        'nav-contato': 'Contato',

        // === HERO / MAPA ===
        'hero-title': 'São Mateus do Sul',
        'hero-map-desc': 'Explore o mapa interativo. Clique nos marcadores para descobrir os pontos turísticos.',
        'stat-pontos': 'Pontos Turísticos',
        'stat-rotas': 'Rotas Temáticas',
        'stat-estabelecimentos': 'Estabelecimentos',
        'stat-historia': 'Anos de História',
        'btn-ver-rotas': 'Ver Todas as Rotas →',
        'scroll-explorar': 'Role para explorar mais',

        // === DIORAMA ===
        'diorama-title': 'Descubra <strong>São Mateus do Sul</strong>',
        'diorama-subtitle': 'Explore os tesouros da Capital Polonesa do Paraná através de uma experiência única e autêntica',

        // === SEÇÃO ATRAÇÕES ===
        'section-atracoes': 'Principais <strong>Atrações</strong>',
        'section-atracoes-desc': 'Conheça os pontos turísticos que fazem de São Mateus do Sul um destino único',
        'atracao-igreja-matriz': 'Igreja Matriz',
        'atracao-igreja-matriz-desc': 'Arquitetura neogótica preservada há mais de século.',
        'atracao-rio-iguacu': 'Rio Iguaçu',
        'atracao-rio-iguacu-desc': 'Paisagens de tirar o fôlego e passeios de barco.',
        'atracao-praca-rio': 'Praça do Rio',
        'atracao-praca-rio-desc': 'Deck, playground e contemplação da natureza.',
        'atracao-igreja-agua-branca': 'Igreja Água Branca',
        'atracao-igreja-agua-branca-desc': 'Joia da arquitetura polonesa rural.',
        'atracao-centro-historico': 'Centro Histórico',
        'atracao-centro-historico-desc': 'Elegância do início do século XX.',
        'atracao-rota-mate': 'Rota do Mate',
        'atracao-rota-mate-desc': 'Capital da erva-mate.',

        // === SEÇÃO GASTRONOMIA ===
        'label-sabores': 'Sabores Autênticos',
        'section-gastronomia': 'Gastronomia <strong>Polonesa</strong>',
        'section-gastronomia-desc': 'A culinária de São Mateus do Sul é uma viagem à Polônia através do paladar. Receitas centenárias preservadas por gerações de imigrantes.',
        'gastro-pierogi': 'Pierogi',
        'gastro-pierogi-desc': 'Pastéis poloneses recheados com batata, queijo, carne ou repolho. Tradição que atravessou o Atlântico e conquistou o Paraná.',
        'gastro-golabki': 'Gołąbki',
        'gastro-golabki-desc': 'Repolho recheado com carne e arroz, cozido no molho de tomate. Prato reconfortante das famílias polonesas em dias especiais.',
        'gastro-paes': 'Pães de Fermentação Natural',
        'gastro-paes-desc': 'Pães artesanais com massa madre, seguindo técnicas polonesas centenárias. Crocantes por fora, macios por dentro.',
        'gastro-queijos': 'Queijos Artesanais',
        'gastro-queijos-desc': 'Queijos produzidos em pequenas propriedades rurais. Defumados, temperados, maturados - sabores únicos da nossa terra.',
        'gastro-chimarrao': 'Chimarrão com IG',
        'gastro-chimarrao-desc': 'Erva-mate nativa com Indicação Geográfica. O ritual do chimarrão é parte da nossa identidade cultural.',
        'gastro-doces': 'Doces e Geleias',
        'gastro-doces-desc': 'Doces caseiros de frutas da estação. Geleias artesanais, bolos tradicionais e o famoso bolo de rolo polonês.',
        'btn-restaurantes': 'Descubra os Restaurantes →',

        // === SEÇÃO SOBRE ===
        'badge-capital-polonesa': '🇵🇱 Capital Polonesa do Paraná',
        'sobre-titulo': 'São Mateus do Sul: Onde a <strong>Tradição</strong> Encontra o <strong>Futuro</strong>',
        'sobre-subtitulo': 'Banhada pelo lendário Rio Iguaçu, nossa cidade é o encontro harmonioso entre a cultura polonesa centenária, a força da erva-mate nativa e a inovação tecnológica do xisto.',
        'sobre-fundacao': 'Fundação',
        'sobre-anos-historia': 'Anos de História',
        'sobre-ouro-verde': 'Ouro Verde',
        'sobre-alma-polonesa': 'Alma Polonesa',
        'label-essencia': 'Nossa Essência',
        'pilares-titulo': 'Três Pilares que <strong>Definem</strong> Nossa História',
        'pilares-desc': 'De um simples pouso de tropeiros ao título de Capital Polonesa do Paraná, cada capítulo moldou a cidade única que somos hoje.',

        // === SEÇÃO EVENTOS ===
        'label-calendario': 'Calendário 2026',
        'section-eventos': 'Próximos Eventos',
        'section-eventos-desc': 'Festas, feiras e celebrações da Capital Polonesa',
        'btn-ver-calendario': 'Ver Calendário Completo →',
        'loading-eventos': 'Carregando eventos...',
        'section-eventos-semanais': '📅 Eventos Semanais Fixos',
        'evento-feira-gastro': 'Feira Gastronômica',
        'evento-feira-gastro-horario': 'Qua e Sex • 17h-22h',
        'evento-feira-produtor': 'Feira do Produtor',
        'evento-feira-produtor-horario': 'Sábados • 7h-12h',
        'evento-roda-mathe': 'Roda de Mathe',
        'evento-roda-mathe-horario': '1º Domingo • 9h',
        'evento-feira-lua': 'Feira da Lua',
        'evento-feira-lua-horario': '2ª Terça • 17h-22h',

        // === SEÇÃO ONDE FICAR ===
        'label-hospedagem': 'Hospedagem',
        'section-onde-ficar': 'Onde Ficar',
        'section-onde-ficar-desc': 'Conforto e hospitalidade polonesa para sua estadia',

        // === SEÇÃO CONTATO ===
        'section-contato': 'Entre em <strong>Contato</strong>',
        'contato-telefone': 'Telefone',
        'contato-email': 'Email',
        'contato-localizacao': 'Localização',
        'contato-endereco': 'São Mateus do Sul, Paraná, Brasil',

        // === FOOTER ===
        'footer-direitos': '© 2026 Prefeitura Municipal de São Mateus do Sul',
        'footer-turismo': 'Secretaria Municipal de Turismo',

        // === BOTÕES GERAIS ===
        'btn-ver-mais': 'Ver mais',
        'btn-saiba-mais': 'Saiba mais',
        'btn-explorar': 'Explorar',

        // === PILARES ===
        'pilar1-badge': 'Origens',
        'pilar1-titulo': 'Raízes no Rio Iguaçu',
        'pilar1-desc': 'Tudo começou às margens do majestoso Rio Iguaçu. Inicialmente um pouso estratégico para tropeiros e tropas militares rumo a Guarapuava, o rio transformou-se na artéria vital da nossa cidade através do ciclo da navegação a vapor.',
        'pilar1-destaque1': '<strong>Vapor Pery:</strong> Símbolo histórico que navegou o Iguaçu, conectando nossa região ao desenvolvimento do Paraná.',
        'pilar2-badge': 'Identidade',
        'pilar2-titulo': 'Alma Polonesa',
        'pilar2-desc': 'Somos, por lei estadual, a <strong>Capital Polonesa do Paraná</strong>. A grande maioria da nossa população descende dos corajosos imigrantes poloneses que cruzaram o Atlântico no século XIX em busca de uma nova vida.',
        'pilar3-badge': 'Prosperidade',
        'pilar3-titulo': 'Terra de Riquezas',
        'pilar3-desc': 'Nossa força econômica vem da terra. Do "Ouro Verde" da erva-mate nativa às reservas de xisto betuminoso, São Mateus do Sul une tradição agrícola com inovação tecnológica de ponta.',

        // === SEÇÃO CONTATO ===
        'contato-label': 'Entre em Contato',
        'contato-titulo': 'Planeje Sua <strong>Visita</strong>',
        'contato-intro': 'Estamos prontos para recebê-lo e tornar sua experiência inesquecível.',
        'contato-telefone': 'Telefone',
        'contato-depto': 'Departamento de Cultura e Turismo',
        'contato-email': 'Email',
        'contato-envie': 'Envie sua mensagem',
        'contato-localizacao': 'Localização',
        'contato-chale': 'Chalé da Cultura e Turismo/Produtor',
        'contato-horario': 'Horário',
        'contato-atendimento': 'Atendimento ao Turista',
        'contato-horario-texto': 'Segunda a Sexta: 8h - 17h<br>Sábado: 9h - 13h',
        'contato-redes': 'Siga-nos nas Redes Sociais',

        // === FORMULÁRIO ===
        'form-titulo': 'Envie sua Mensagem',
        'form-nome': 'Nome *',
        'form-email': 'Email *',
        'form-telefone': 'Telefone',
        'form-assunto': 'Assunto *',
        'form-selecione': 'Selecione...',
        'form-info-turismo': 'Informações Turísticas',
        'form-eventos': 'Eventos e Festas',
        'form-hospedagem': 'Hospedagem',
        'form-gastronomia': 'Gastronomia',
        'form-grupos': 'Visitas em Grupo',
        'form-trade': 'Trade Turístico',
        'form-outro': 'Outro Assunto',
        'form-mensagem': 'Mensagem *',
        'form-newsletter': 'Desejo receber novidades sobre eventos e turismo',
        'form-enviar': 'Enviar Mensagem →',

        // === FOOTER ===
        'footer-direitos': '© 2026 Prefeitura Municipal de São Mateus do Sul',
        'footer-turismo': 'Secretaria Municipal de Turismo'
    },

    en: {
        // === NAVIGATION ===
        'nav-inicio': 'Home',
        'nav-oquefazer': 'What to Do',
        'nav-todas-atracoes': '🌿 All Attractions',
        'nav-erva-mate': '🧉 Yerba Mate Route',
        'nav-cultura-polonesa': '🇵🇱 Polish Culture',
        'nav-turismo-fe': '⛪ Faith Tourism',
        'nav-natureza': '🌊 Nature & Nautical',
        'nav-sabores': 'Flavors',
        'nav-gastronomia': '🍽️ Gastronomy',
        'nav-culinaria-polonesa': '🥟 Polish Cuisine',
        'nav-feiras': '🛒 Fairs & Producers',
        'nav-restaurantes': '🍴 Restaurants',
        'nav-eventos': 'Events',
        'nav-onde-ficar': 'Where to Stay',
        'nav-roteiros': 'Itineraries',
        'nav-sobre': 'About',
        'nav-cidade': '🏛️ The City',
        'nav-transparencia': '📋 Transparency',
        'nav-trade': '💼 For Trade',
        'nav-contato': 'Contact',

        // === HERO / MAP ===
        'hero-title': 'São Mateus do Sul',
        'hero-map-desc': 'Explore the interactive map. Click on markers to discover tourist attractions.',
        'stat-pontos': 'Tourist Sites',
        'stat-rotas': 'Themed Routes',
        'stat-estabelecimentos': 'Establishments',
        'stat-historia': 'Years of History',
        'btn-ver-rotas': 'See All Routes →',
        'scroll-explorar': 'Scroll to explore more',

        // === DIORAMA ===
        'diorama-title': 'Discover <strong>São Mateus do Sul</strong>',
        'diorama-subtitle': 'Explore the treasures of the Polish Capital of Paraná through a unique and authentic experience',

        // === ATTRACTIONS SECTION ===
        'section-atracoes': 'Main <strong>Attractions</strong>',
        'section-atracoes-desc': 'Discover the tourist spots that make São Mateus do Sul a unique destination',
        'atracao-igreja-matriz': 'Main Church',
        'atracao-igreja-matriz-desc': 'Neo-gothic architecture preserved for over a century.',
        'atracao-rio-iguacu': 'Iguaçu River',
        'atracao-rio-iguacu-desc': 'Breathtaking landscapes and boat rides.',
        'atracao-praca-rio': 'River Square',
        'atracao-praca-rio-desc': 'Deck, playground and nature contemplation.',
        'atracao-igreja-agua-branca': 'Água Branca Church',
        'atracao-igreja-agua-branca-desc': 'A jewel of rural Polish architecture.',
        'atracao-centro-historico': 'Historic Center',
        'atracao-centro-historico-desc': 'Early 20th century elegance.',
        'atracao-rota-mate': 'Mate Route',
        'atracao-rota-mate-desc': 'Capital of yerba mate.',

        // === GASTRONOMY SECTION ===
        'label-sabores': 'Authentic Flavors',
        'section-gastronomia': '<strong>Polish</strong> Gastronomy',
        'section-gastronomia-desc': 'The cuisine of São Mateus do Sul is a journey to Poland through taste. Century-old recipes preserved by generations of immigrants.',
        'gastro-pierogi': 'Pierogi',
        'gastro-pierogi-desc': 'Polish dumplings filled with potato, cheese, meat or cabbage. A tradition that crossed the Atlantic and conquered Paraná.',
        'gastro-golabki': 'Gołąbki',
        'gastro-golabki-desc': 'Cabbage rolls stuffed with meat and rice, cooked in tomato sauce. A comforting dish for Polish families on special days.',
        'gastro-paes': 'Sourdough Breads',
        'gastro-paes-desc': 'Artisan breads with sourdough, following century-old Polish techniques. Crispy outside, soft inside.',
        'gastro-queijos': 'Artisan Cheeses',
        'gastro-queijos-desc': 'Cheeses produced on small rural properties. Smoked, seasoned, aged - unique flavors from our land.',
        'gastro-chimarrao': 'Chimarrão with GI',
        'gastro-chimarrao-desc': 'Native yerba mate with Geographical Indication. The chimarrão ritual is part of our cultural identity.',
        'gastro-doces': 'Sweets and Jams',
        'gastro-doces-desc': 'Homemade sweets from seasonal fruits. Artisan jams, traditional cakes and the famous Polish roll cake.',
        'btn-restaurantes': 'Discover Restaurants →',

        // === ABOUT SECTION ===
        'badge-capital-polonesa': '🇵🇱 Polish Capital of Paraná',
        'sobre-titulo': 'São Mateus do Sul: Where <strong>Tradition</strong> Meets the <strong>Future</strong>',
        'sobre-subtitulo': 'Bathed by the legendary Iguaçu River, our city is the harmonious meeting of century-old Polish culture, the strength of native yerba mate and shale technology innovation.',
        'sobre-fundacao': 'Foundation',
        'sobre-anos-historia': 'Years of History',
        'sobre-ouro-verde': 'Green Gold',
        'sobre-alma-polonesa': 'Polish Soul',
        'label-essencia': 'Our Essence',
        'pilares-titulo': 'Three Pillars that <strong>Define</strong> Our History',
        'pilares-desc': 'From a simple drovers\' stop to the title of Polish Capital of Paraná, each chapter shaped the unique city we are today.',

        // === EVENTS SECTION ===
        'label-calendario': 'Calendar 2026',
        'section-eventos': 'Upcoming Events',
        'section-eventos-desc': 'Festivals, fairs and celebrations of the Polish Capital',
        'btn-ver-calendario': 'View Full Calendar →',
        'loading-eventos': 'Loading events...',
        'section-eventos-semanais': '📅 Weekly Fixed Events',
        'evento-feira-gastro': 'Gastronomic Fair',
        'evento-feira-gastro-horario': 'Wed & Fri • 5pm-10pm',
        'evento-feira-produtor': 'Farmers Market',
        'evento-feira-produtor-horario': 'Saturdays • 7am-12pm',
        'evento-roda-mathe': 'Mate Circle',
        'evento-roda-mathe-horario': '1st Sunday • 9am',
        'evento-feira-lua': 'Moon Fair',
        'evento-feira-lua-horario': '2nd Tuesday • 5pm-10pm',

        // === WHERE TO STAY SECTION ===
        'label-hospedagem': 'Accommodation',
        'section-onde-ficar': 'Where to Stay',
        'section-onde-ficar-desc': 'Comfort and Polish hospitality for your stay',

        // === CONTACT SECTION ===
        'section-contato': 'Get in <strong>Touch</strong>',
        'contato-telefone': 'Phone',
        'contato-email': 'Email',
        'contato-localizacao': 'Location',
        'contato-endereco': 'São Mateus do Sul, Paraná, Brazil',

        // === FOOTER ===
        'footer-direitos': '© 2026 Municipality of São Mateus do Sul',
        'footer-turismo': 'Municipal Tourism Department',

        // === GENERAL BUTTONS ===
        'btn-ver-mais': 'See more',
        'btn-saiba-mais': 'Learn more',
        'btn-explorar': 'Explore',

        // === PILLARS ===
        'pilar1-badge': 'Origins',
        'pilar1-titulo': 'Roots in the Iguaçu River',
        'pilar1-desc': 'It all began on the banks of the majestic Iguaçu River. Initially a strategic stop for drovers and military troops heading to Guarapuava, the river became the vital artery of our city through the steamboat navigation cycle.',
        'pilar1-destaque1': '<strong>Steamboat Pery:</strong> Historical symbol that navigated the Iguaçu, connecting our region to the development of Paraná.',
        'pilar2-badge': 'Identity',
        'pilar2-titulo': 'Polish Soul',
        'pilar2-desc': 'We are, by state law, the <strong>Polish Capital of Paraná</strong>. The vast majority of our population descends from the courageous Polish immigrants who crossed the Atlantic in the 19th century in search of a new life.',
        'pilar3-badge': 'Prosperity',
        'pilar3-titulo': 'Land of Riches',
        'pilar3-desc': 'Our economic strength comes from the land. From the "Green Gold" of native yerba mate to the oil shale reserves, São Mateus do Sul combines agricultural tradition with cutting-edge technological innovation.',

        // === CONTACT SECTION ===
        'contato-label': 'Get in Touch',
        'contato-titulo': 'Plan Your <strong>Visit</strong>',
        'contato-intro': 'We are ready to welcome you and make your experience unforgettable.',
        'contato-telefone': 'Phone',
        'contato-depto': 'Culture and Tourism Department',
        'contato-email': 'Email',
        'contato-envie': 'Send your message',
        'contato-localizacao': 'Location',
        'contato-chale': 'Culture and Tourism Chalet',
        'contato-horario': 'Hours',
        'contato-atendimento': 'Tourist Information',
        'contato-horario-texto': 'Monday to Friday: 8am - 5pm<br>Saturday: 9am - 1pm',
        'contato-redes': 'Follow us on Social Media',

        // === FORM ===
        'form-titulo': 'Send us a Message',
        'form-nome': 'Name *',
        'form-email': 'Email *',
        'form-telefone': 'Phone',
        'form-assunto': 'Subject *',
        'form-selecione': 'Select...',
        'form-info-turismo': 'Tourist Information',
        'form-eventos': 'Events and Festivals',
        'form-hospedagem': 'Accommodation',
        'form-gastronomia': 'Gastronomy',
        'form-grupos': 'Group Visits',
        'form-trade': 'Tourism Trade',
        'form-outro': 'Other Subject',
        'form-mensagem': 'Message *',
        'form-newsletter': 'I want to receive news about events and tourism',
        'form-enviar': 'Send Message →',

        // === FOOTER ===
        'footer-direitos': '© 2026 Municipality of São Mateus do Sul',
        'footer-turismo': 'Municipal Tourism Department'
    },

    es: {
        // === NAVEGACIÓN ===
        'nav-inicio': 'Inicio',
        'nav-oquefazer': 'Qué Hacer',
        'nav-todas-atracoes': '🌿 Todas las Atracciones',
        'nav-erva-mate': '🧉 Ruta de la Yerba Mate',
        'nav-cultura-polonesa': '🇵🇱 Cultura Polaca',
        'nav-turismo-fe': '⛪ Turismo de Fe',
        'nav-natureza': '🌊 Náutica y Naturaleza',
        'nav-sabores': 'Sabores',
        'nav-gastronomia': '🍽️ Gastronomía',
        'nav-culinaria-polonesa': '🥟 Cocina Polaca',
        'nav-feiras': '🛒 Ferias y Productores',
        'nav-restaurantes': '🍴 Restaurantes',
        'nav-eventos': 'Eventos',
        'nav-onde-ficar': 'Dónde Alojarse',
        'nav-roteiros': 'Itinerarios',
        'nav-sobre': 'Acerca de',
        'nav-cidade': '🏛️ La Ciudad',
        'nav-transparencia': '📋 Transparencia',
        'nav-trade': '💼 Para el Comercio',
        'nav-contato': 'Contacto',

        // === HERO / MAPA ===
        'hero-title': 'São Mateus do Sul',
        'hero-map-desc': 'Explora el mapa interactivo. Haz clic en los marcadores para descubrir los puntos turísticos.',
        'stat-pontos': 'Puntos Turísticos',
        'stat-rotas': 'Rutas Temáticas',
        'stat-estabelecimentos': 'Establecimientos',
        'stat-historia': 'Años de Historia',
        'btn-ver-rotas': 'Ver Todas las Rutas →',
        'scroll-explorar': 'Desplázate para explorar más',

        // === DIORAMA ===
        'diorama-title': 'Descubre <strong>São Mateus do Sul</strong>',
        'diorama-subtitle': 'Explora los tesoros de la Capital Polaca de Paraná a través de una experiencia única y auténtica',

        // === SECCIÓN ATRACCIONES ===
        'section-atracoes': 'Principales <strong>Atracciones</strong>',
        'section-atracoes-desc': 'Conoce los puntos turísticos que hacen de São Mateus do Sul un destino único',
        'atracao-igreja-matriz': 'Iglesia Matriz',
        'atracao-igreja-matriz-desc': 'Arquitectura neogótica preservada por más de un siglo.',
        'atracao-rio-iguacu': 'Río Iguazú',
        'atracao-rio-iguacu-desc': 'Paisajes impresionantes y paseos en barco.',
        'atracao-praca-rio': 'Plaza del Río',
        'atracao-praca-rio-desc': 'Deck, parque infantil y contemplación de la naturaleza.',
        'atracao-igreja-agua-branca': 'Iglesia Água Branca',
        'atracao-igreja-agua-branca-desc': 'Joya de la arquitectura polaca rural.',
        'atracao-centro-historico': 'Centro Histórico',
        'atracao-centro-historico-desc': 'Elegancia de principios del siglo XX.',
        'atracao-rota-mate': 'Ruta del Mate',
        'atracao-rota-mate-desc': 'Capital de la yerba mate.',

        // === SECCIÓN GASTRONOMÍA ===
        'label-sabores': 'Sabores Auténticos',
        'section-gastronomia': 'Gastronomía <strong>Polaca</strong>',
        'section-gastronomia-desc': 'La cocina de São Mateus do Sul es un viaje a Polonia a través del paladar. Recetas centenarias preservadas por generaciones de inmigrantes.',
        'gastro-pierogi': 'Pierogi',
        'gastro-pierogi-desc': 'Empanadillas polacas rellenas de papa, queso, carne o repollo. Tradición que cruzó el Atlántico y conquistó Paraná.',
        'gastro-golabki': 'Gołąbki',
        'gastro-golabki-desc': 'Repollo relleno de carne y arroz, cocido en salsa de tomate. Plato reconfortante para las familias polacas en días especiales.',
        'gastro-paes': 'Panes de Masa Madre',
        'gastro-paes-desc': 'Panes artesanales con masa madre, siguiendo técnicas polacas centenarias. Crujientes por fuera, suaves por dentro.',
        'gastro-queijos': 'Quesos Artesanales',
        'gastro-queijos-desc': 'Quesos producidos en pequeñas propiedades rurales. Ahumados, condimentados, madurados - sabores únicos de nuestra tierra.',
        'gastro-chimarrao': 'Chimarrão con IG',
        'gastro-chimarrao-desc': 'Yerba mate nativa con Indicación Geográfica. El ritual del chimarrão es parte de nuestra identidad cultural.',
        'gastro-doces': 'Dulces y Mermeladas',
        'gastro-doces-desc': 'Dulces caseros de frutas de temporada. Mermeladas artesanales, pasteles tradicionales y el famoso brazo gitano polaco.',
        'btn-restaurantes': 'Descubre los Restaurantes →',

        // === SECCIÓN SOBRE ===
        'badge-capital-polonesa': '🇵🇱 Capital Polaca de Paraná',
        'sobre-titulo': 'São Mateus do Sul: Donde la <strong>Tradición</strong> Encuentra el <strong>Futuro</strong>',
        'sobre-subtitulo': 'Bañada por el legendario Río Iguazú, nuestra ciudad es el encuentro armonioso entre la cultura polaca centenaria, la fuerza de la yerba mate nativa y la innovación tecnológica del esquisto.',
        'sobre-fundacao': 'Fundación',
        'sobre-anos-historia': 'Años de Historia',
        'sobre-ouro-verde': 'Oro Verde',
        'sobre-alma-polonesa': 'Alma Polaca',
        'label-essencia': 'Nuestra Esencia',
        'pilares-titulo': 'Tres Pilares que <strong>Definen</strong> Nuestra Historia',
        'pilares-desc': 'De una simple parada de arrieros al título de Capital Polaca de Paraná, cada capítulo moldeó la ciudad única que somos hoy.',

        // === SECCIÓN EVENTOS ===
        'label-calendario': 'Calendario 2026',
        'section-eventos': 'Próximos Eventos',
        'section-eventos-desc': 'Fiestas, ferias y celebraciones de la Capital Polaca',
        'btn-ver-calendario': 'Ver Calendario Completo →',
        'loading-eventos': 'Cargando eventos...',
        'section-eventos-semanais': '📅 Eventos Semanales Fijos',
        'evento-feira-gastro': 'Feria Gastronómica',
        'evento-feira-gastro-horario': 'Mié y Vie • 17h-22h',
        'evento-feira-produtor': 'Feria del Productor',
        'evento-feira-produtor-horario': 'Sábados • 7h-12h',
        'evento-roda-mathe': 'Rueda de Mate',
        'evento-roda-mathe-horario': '1er Domingo • 9h',
        'evento-feira-lua': 'Feria de la Luna',
        'evento-feira-lua-horario': '2do Martes • 17h-22h',

        // === SECCIÓN DONDE ALOJARSE ===
        'label-hospedagem': 'Hospedaje',
        'section-onde-ficar': 'Dónde Alojarse',
        'section-onde-ficar-desc': 'Comodidad y hospitalidad polaca para tu estadía',

        // === SECCIÓN CONTACTO ===
        'section-contato': 'Ponte en <strong>Contacto</strong>',
        'contato-telefone': 'Teléfono',
        'contato-email': 'Correo',
        'contato-localizacao': 'Ubicación',
        'contato-endereco': 'São Mateus do Sul, Paraná, Brasil',

        // === FOOTER ===
        'footer-direitos': '© 2026 Municipalidad de São Mateus do Sul',
        'footer-turismo': 'Secretaría Municipal de Turismo',

        // === BOTONES GENERALES ===
        'btn-ver-mais': 'Ver más',
        'btn-saiba-mais': 'Saber más',
        'btn-explorar': 'Explorar',

        // === PILARES ===
        'pilar1-badge': 'Orígenes',
        'pilar1-titulo': 'Raíces en el Río Iguazú',
        'pilar1-desc': 'Todo comenzó a orillas del majestuoso Río Iguazú. Inicialmente una parada estratégica para arrieros y tropas militares rumbo a Guarapuava, el río se transformó en la arteria vital de nuestra ciudad a través del ciclo de navegación a vapor.',
        'pilar1-destaque1': '<strong>Vapor Pery:</strong> Símbolo histórico que navegó el Iguazú, conectando nuestra región al desarrollo de Paraná.',
        'pilar2-badge': 'Identidad',
        'pilar2-titulo': 'Alma Polaca',
        'pilar2-desc': 'Somos, por ley estatal, la <strong>Capital Polaca de Paraná</strong>. La gran mayoría de nuestra población desciende de los valientes inmigrantes polacos que cruzaron el Atlántico en el siglo XIX en busca de una nueva vida.',
        'pilar3-badge': 'Prosperidad',
        'pilar3-titulo': 'Tierra de Riquezas',
        'pilar3-desc': 'Nuestra fuerza económica viene de la tierra. Del "Oro Verde" de la yerba mate nativa a las reservas de esquisto, São Mateus do Sul une tradición agrícola con innovación tecnológica de punta.',

        // === SECCIÓN CONTACTO ===
        'contato-label': 'Contacto',
        'contato-titulo': 'Planifica tu <strong>Visita</strong>',
        'contato-intro': 'Estamos listos para recibirte y hacer tu experiencia inolvidable.',
        'contato-telefone': 'Teléfono',
        'contato-depto': 'Departamento de Cultura y Turismo',
        'contato-email': 'Correo',
        'contato-envie': 'Envía tu mensaje',
        'contato-localizacao': 'Ubicación',
        'contato-chale': 'Chalet de Cultura y Turismo',
        'contato-horario': 'Horario',
        'contato-atendimento': 'Atención al Turista',
        'contato-horario-texto': 'Lunes a Viernes: 8h - 17h<br>Sábado: 9h - 13h',
        'contato-redes': 'Síguenos en Redes Sociales',

        // === FORMULARIO ===
        'form-titulo': 'Envía tu Mensaje',
        'form-nome': 'Nombre *',
        'form-email': 'Correo *',
        'form-telefone': 'Teléfono',
        'form-assunto': 'Asunto *',
        'form-selecione': 'Selecciona...',
        'form-info-turismo': 'Información Turística',
        'form-eventos': 'Eventos y Fiestas',
        'form-hospedagem': 'Alojamiento',
        'form-gastronomia': 'Gastronomía',
        'form-grupos': 'Visitas en Grupo',
        'form-trade': 'Comercio Turístico',
        'form-outro': 'Otro Asunto',
        'form-mensagem': 'Mensaje *',
        'form-newsletter': 'Deseo recibir novedades sobre eventos y turismo',
        'form-enviar': 'Enviar Mensaje →',

        // === FOOTER ===
        'footer-direitos': '© 2026 Municipalidad de São Mateus do Sul',
        'footer-turismo': 'Secretaría Municipal de Turismo'
    },

    pl: {
        // === NAWIGACJA ===
        'nav-inicio': 'Strona główna',
        'nav-oquefazer': 'Co robić',
        'nav-todas-atracoes': '🌿 Wszystkie atrakcje',
        'nav-erva-mate': '🧉 Szlak Yerba Mate',
        'nav-cultura-polonesa': '🇵🇱 Kultura polska',
        'nav-turismo-fe': '⛪ Turystyka religijna',
        'nav-natureza': '🌊 Przyroda i żeglarstwo',
        'nav-sabores': 'Smaki',
        'nav-gastronomia': '🍽️ Gastronomia',
        'nav-culinaria-polonesa': '🥟 Kuchnia polska',
        'nav-feiras': '🛒 Targi i producenci',
        'nav-restaurantes': '🍴 Restauracje',
        'nav-eventos': 'Wydarzenia',
        'nav-onde-ficar': 'Gdzie się zatrzymać',
        'nav-roteiros': 'Trasy',
        'nav-sobre': 'O nas',
        'nav-cidade': '🏛️ Miasto',
        'nav-transparencia': '📋 Przejrzystość',
        'nav-trade': '💼 Dla biznesu',
        'nav-contato': 'Kontakt',

        // === HERO / MAPA ===
        'hero-title': 'São Mateus do Sul',
        'hero-map-desc': 'Poznaj interaktywną mapę. Kliknij na znaczniki, aby odkryć atrakcje turystyczne.',
        'stat-pontos': 'Punkty turystyczne',
        'stat-rotas': 'Szlaki tematyczne',
        'stat-estabelecimentos': 'Obiekty',
        'stat-historia': 'Lat historii',
        'btn-ver-rotas': 'Zobacz wszystkie szlaki →',
        'scroll-explorar': 'Przewiń, aby odkryć więcej',

        // === DIORAMA ===
        'diorama-title': 'Odkryj <strong>São Mateus do Sul</strong>',
        'diorama-subtitle': 'Odkryj skarby Polskiej Stolicy Parany poprzez wyjątkowe i autentyczne doświadczenie',

        // === SEKCJA ATRAKCJE ===
        'section-atracoes': 'Główne <strong>Atrakcje</strong>',
        'section-atracoes-desc': 'Poznaj miejsca turystyczne, które czynią São Mateus do Sul wyjątkowym celem podróży',
        'atracao-igreja-matriz': 'Kościół Główny',
        'atracao-igreja-matriz-desc': 'Architektura neogotycka zachowana od ponad wieku.',
        'atracao-rio-iguacu': 'Rzeka Iguaçu',
        'atracao-rio-iguacu-desc': 'Zapierające dech krajobrazy i rejsy łodzią.',
        'atracao-praca-rio': 'Plac Rzeczny',
        'atracao-praca-rio-desc': 'Pomost, plac zabaw i kontemplacja natury.',
        'atracao-igreja-agua-branca': 'Kościół Água Branca',
        'atracao-igreja-agua-branca-desc': 'Perła polskiej architektury wiejskiej.',
        'atracao-centro-historico': 'Centrum Historyczne',
        'atracao-centro-historico-desc': 'Elegancja początku XX wieku.',
        'atracao-rota-mate': 'Szlak Mate',
        'atracao-rota-mate-desc': 'Stolica yerba mate.',

        // === SEKCJA GASTRONOMIA ===
        'label-sabores': 'Autentyczne smaki',
        'section-gastronomia': 'Gastronomia <strong>Polska</strong>',
        'section-gastronomia-desc': 'Kuchnia São Mateus do Sul to podróż do Polski poprzez smak. Stuletnie przepisy zachowane przez pokolenia imigrantów.',
        'gastro-pierogi': 'Pierogi',
        'gastro-pierogi-desc': 'Polskie pierogi z nadzieniem z ziemniaków, sera, mięsa lub kapusty. Tradycja, która przekroczyła Atlantyk i podbiła Paranę.',
        'gastro-golabki': 'Gołąbki',
        'gastro-golabki-desc': 'Kapusta nadziewana mięsem i ryżem, gotowana w sosie pomidorowym. Pocieszające danie polskich rodzin w szczególne dni.',
        'gastro-paes': 'Chleby na zakwasie',
        'gastro-paes-desc': 'Rzemieślnicze chleby na zakwasie, według stuletniej polskiej techniki. Chrupiące na zewnątrz, miękkie w środku.',
        'gastro-queijos': 'Sery rzemieślnicze',
        'gastro-queijos-desc': 'Sery produkowane w małych gospodarstwach wiejskich. Wędzone, przyprawiane, dojrzewające - unikalne smaki naszej ziemi.',
        'gastro-chimarrao': 'Chimarrão z IG',
        'gastro-chimarrao-desc': 'Rodzima yerba mate z Oznaczeniem Geograficznym. Rytuał chimarrão jest częścią naszej tożsamości kulturowej.',
        'gastro-doces': 'Słodycze i dżemy',
        'gastro-doces-desc': 'Domowe słodycze z sezonowych owoców. Rzemieślnicze dżemy, tradycyjne ciasta i słynna polska rolada.',
        'btn-restaurantes': 'Odkryj restauracje →',

        // === SEKCJA O NAS ===
        'badge-capital-polonesa': '🇵🇱 Polska Stolica Parany',
        'sobre-titulo': 'São Mateus do Sul: Gdzie <strong>Tradycja</strong> Spotyka <strong>Przyszłość</strong>',
        'sobre-subtitulo': 'Obmywane przez legendarną rzekę Iguaçu, nasze miasto to harmonijne spotkanie stulecia polskiej kultury, siły rodzimej yerba mate i innowacji technologicznej łupków.',
        'sobre-fundacao': 'Założenie',
        'sobre-anos-historia': 'Lat historii',
        'sobre-ouro-verde': 'Zielone złoto',
        'sobre-alma-polonesa': 'Polska dusza',
        'label-essencia': 'Nasza istota',
        'pilares-titulo': 'Trzy filary, które <strong>definiują</strong> naszą historię',
        'pilares-desc': 'Od prostego przystanku dla pasterzy do tytułu Polskiej Stolicy Parany, każdy rozdział ukształtował unikalne miasto, jakim dziś jesteśmy.',

        // === SEKCJA WYDARZENIA ===
        'label-calendario': 'Kalendarz 2026',
        'section-eventos': 'Nadchodzące wydarzenia',
        'section-eventos-desc': 'Festiwale, targi i uroczystości Polskiej Stolicy',
        'btn-ver-calendario': 'Zobacz pełny kalendarz →',
        'loading-eventos': 'Ładowanie wydarzeń...',
        'section-eventos-semanais': '📅 Stałe wydarzenia tygodniowe',
        'evento-feira-gastro': 'Targ gastronomiczny',
        'evento-feira-gastro-horario': 'Śr i Pt • 17h-22h',
        'evento-feira-produtor': 'Targ producenta',
        'evento-feira-produtor-horario': 'Soboty • 7h-12h',
        'evento-roda-mathe': 'Koło Mate',
        'evento-roda-mathe-horario': '1. niedziela • 9h',
        'evento-feira-lua': 'Targ Księżycowy',
        'evento-feira-lua-horario': '2. wtorek • 17h-22h',

        // === SEKCJA GDZIE SIĘ ZATRZYMAĆ ===
        'label-hospedagem': 'Zakwaterowanie',
        'section-onde-ficar': 'Gdzie się zatrzymać',
        'section-onde-ficar-desc': 'Komfort i polska gościnność dla Twojego pobytu',

        // === SEKCJA KONTAKT ===
        'section-contato': 'Skontaktuj <strong>się</strong>',
        'contato-telefone': 'Telefon',
        'contato-email': 'Email',
        'contato-localizacao': 'Lokalizacja',
        'contato-endereco': 'São Mateus do Sul, Parana, Brazylia',

        // === FOOTER ===
        'footer-direitos': '© 2026 Gmina São Mateus do Sul',
        'footer-turismo': 'Miejski Wydział Turystyki',

        // === OGÓLNE PRZYCISKI ===
        'btn-ver-mais': 'Zobacz więcej',
        'btn-saiba-mais': 'Dowiedz się więcej',
        'btn-explorar': 'Odkryj',

        // === FILARY ===
        'pilar1-badge': 'Początki',
        'pilar1-titulo': 'Korzenie w rzece Iguaçu',
        'pilar1-desc': 'Wszystko zaczęło się nad brzegami majestatycznej rzeki Iguaçu. Początkowo strategiczny przystanek dla pasterzy i wojsk zmierzających do Guarapuavy, rzeka stała się życiową arterią naszego miasta dzięki cyklowi żeglugi parowej.',
        'pilar1-destaque1': '<strong>Parowiec Pery:</strong> Historyczny symbol, który pływał po Iguaçu, łącząc nasz region z rozwojem Parany.',
        'pilar2-badge': 'Tożsamość',
        'pilar2-titulo': 'Polska dusza',
        'pilar2-desc': 'Jesteśmy, na mocy prawa stanowego, <strong>Polską Stolicą Parany</strong>. Zdecydowana większość naszej populacji pochodzi od odważnych polskich imigrantów, którzy w XIX wieku przekroczyli Atlantyk w poszukiwaniu nowego życia.',
        'pilar3-badge': 'Dobrobyt',
        'pilar3-titulo': 'Ziemia bogactw',
        'pilar3-desc': 'Nasza siła ekonomiczna pochodzi z ziemi. Od "Zielonego złota" rodzimej yerba mate po złoża łupków, São Mateus do Sul łączy tradycję rolniczą z najnowocześniejszą innowacją technologiczną.',

        // === SEKCJA KONTAKT ===
        'contato-label': 'Kontakt',
        'contato-titulo': 'Zaplanuj swoją <strong>wizytę</strong>',
        'contato-intro': 'Jesteśmy gotowi Cię przyjąć i uczynić Twoje doświadczenie niezapomnianym.',
        'contato-telefone': 'Telefon',
        'contato-depto': 'Wydział Kultury i Turystyki',
        'contato-email': 'Email',
        'contato-envie': 'Wyślij wiadomość',
        'contato-localizacao': 'Lokalizacja',
        'contato-chale': 'Domek Kultury i Turystyki',
        'contato-horario': 'Godziny',
        'contato-atendimento': 'Informacja turystyczna',
        'contato-horario-texto': 'Poniedziałek - Piątek: 8:00 - 17:00<br>Sobota: 9:00 - 13:00',
        'contato-redes': 'Śledź nas w mediach społecznościowych',

        // === FORMULARZ ===
        'form-titulo': 'Wyślij wiadomość',
        'form-nome': 'Imię *',
        'form-email': 'Email *',
        'form-telefone': 'Telefon',
        'form-assunto': 'Temat *',
        'form-selecione': 'Wybierz...',
        'form-info-turismo': 'Informacje turystyczne',
        'form-eventos': 'Wydarzenia i festiwale',
        'form-hospedagem': 'Zakwaterowanie',
        'form-gastronomia': 'Gastronomia',
        'form-grupos': 'Wizyty grupowe',
        'form-trade': 'Branża turystyczna',
        'form-outro': 'Inny temat',
        'form-mensagem': 'Wiadomość *',
        'form-newsletter': 'Chcę otrzymywać informacje o wydarzeniach i turystyce',
        'form-enviar': 'Wyślij wiadomość →',

        // === FOOTER ===
        'footer-direitos': '© 2026 Gmina São Mateus do Sul',
        'footer-turismo': 'Miejski Wydział Turystyki'
    }
};

// Função para aplicar traduções
function applyTranslations(lang) {
    const trans = translations[lang];
    if (!trans) return;

    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.getAttribute('data-lang-key');
        if (trans[key]) {
            el.innerHTML = trans[key];
        }
    });

    // Atualizar lang do HTML
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
    
    console.log(`✅ Traduções aplicadas: ${lang} (${document.querySelectorAll('[data-lang-key]').length} elementos)`);
}

// Exportar para uso global
window.translations = translations;
window.applyTranslations = applyTranslations;

// Traduções adicionais para páginas secundárias
const pageTranslations = {
    pt: {
        // O Que Fazer
        'page-oquefazer-titulo': 'O Que <strong>Fazer</strong>',
        'page-oquefazer-subtitulo': 'Descubra as experiências que fazem de São Mateus do Sul um destino único',
        'rota-ervamate-titulo': '🧉 Rota da Erva-Mate',
        'rota-ervamate-desc': 'Conheça a tradição centenária do mate com selo de Indicação Geográfica',
        'rota-polonesa-titulo': '🇵🇱 Rota da Cultura Polonesa',
        'rota-polonesa-desc': 'Herança dos imigrantes: arquitetura, gastronomia e festas',
        'rota-fe-titulo': '⛪ Turismo de Fé',
        'rota-fe-desc': 'Templos centenários e capelas das colônias rurais',
        'rota-natureza-titulo': '🌊 Náutica e Natureza',
        'rota-natureza-desc': 'Passeios pelo Rio Iguaçu e Mata Atlântica',
        
        // Sabores
        'page-sabores-titulo': 'Sabores de <strong>São Mateus</strong>',
        'page-sabores-subtitulo': 'Uma viagem gastronômica pela herança polonesa e produção local',
        
        // Eventos
        'page-eventos-titulo': 'Calendário de <strong>Eventos 2026</strong>',
        'page-eventos-subtitulo': 'Festas, feiras e celebrações da Capital Polonesa do Paraná',
        'filtro-todos': 'Todos',
        'filtro-cultural': 'Cultural',
        'filtro-religioso': 'Religioso',
        'filtro-feira': 'Feiras',
        'filtro-esporte': 'Esportes',
        
        // Onde Ficar
        'page-ondeficar-titulo': 'Onde <strong>Ficar</strong>',
        'page-ondeficar-subtitulo': 'Hospedagens com conforto e hospitalidade polonesa',
        
        // Galeria
        'page-galeria-titulo': 'Galeria',
        'page-galeria-subtitulo': 'Explore através de imagens as belezas e a cultura de São Mateus do Sul',
        
        // Para o Trade
        'page-trade-titulo': 'Para o <strong>Trade</strong>',
        'page-trade-subtitulo': 'Informações e recursos para profissionais do turismo',
        
        // Transparência
        'page-transparencia-titulo': 'Transparência',
        'page-transparencia-subtitulo': 'Informações sobre COMTUR, FUMTUR e políticas de turismo',
        
        // Comum
        'btn-voltar': '← Voltar',
        'btn-reservar': 'Reservar',
        'btn-ver-detalhes': 'Ver detalhes',
        'btn-saiba-mais': 'Saiba mais →'
    },
    en: {
        'page-oquefazer-titulo': 'What to <strong>Do</strong>',
        'page-oquefazer-subtitulo': 'Discover the experiences that make São Mateus do Sul a unique destination',
        'rota-ervamate-titulo': '🧉 Yerba Mate Route',
        'rota-ervamate-desc': 'Discover the century-old mate tradition with Geographical Indication seal',
        'rota-polonesa-titulo': '🇵🇱 Polish Culture Route',
        'rota-polonesa-desc': 'Immigrant heritage: architecture, gastronomy and festivals',
        'rota-fe-titulo': '⛪ Faith Tourism',
        'rota-fe-desc': 'Century-old temples and rural colony chapels',
        'rota-natureza-titulo': '🌊 Nautical & Nature',
        'rota-natureza-desc': 'Tours on the Iguaçu River and Atlantic Forest',
        
        'page-sabores-titulo': 'Flavors of <strong>São Mateus</strong>',
        'page-sabores-subtitulo': 'A gastronomic journey through Polish heritage and local production',
        
        'page-eventos-titulo': '<strong>Events</strong> Calendar 2026',
        'page-eventos-subtitulo': 'Festivals, fairs and celebrations of the Polish Capital of Paraná',
        'filtro-todos': 'All',
        'filtro-cultural': 'Cultural',
        'filtro-religioso': 'Religious',
        'filtro-feira': 'Fairs',
        'filtro-esporte': 'Sports',
        
        'page-ondeficar-titulo': 'Where to <strong>Stay</strong>',
        'page-ondeficar-subtitulo': 'Accommodations with comfort and Polish hospitality',
        
        'page-galeria-titulo': 'Gallery',
        'page-galeria-subtitulo': 'Explore through images the beauties and culture of São Mateus do Sul',
        
        'page-trade-titulo': 'For <strong>Trade</strong>',
        'page-trade-subtitulo': 'Information and resources for tourism professionals',
        
        'page-transparencia-titulo': 'Transparency',
        'page-transparencia-subtitulo': 'Information about COMTUR, FUMTUR and tourism policies',
        
        'btn-voltar': '← Back',
        'btn-reservar': 'Book',
        'btn-ver-detalhes': 'See details',
        'btn-saiba-mais': 'Learn more →'
    },
    es: {
        'page-oquefazer-titulo': 'Qué <strong>Hacer</strong>',
        'page-oquefazer-subtitulo': 'Descubre las experiencias que hacen de São Mateus do Sul un destino único',
        'rota-ervamate-titulo': '🧉 Ruta de la Yerba Mate',
        'rota-ervamate-desc': 'Conoce la tradición centenaria del mate con sello de Indicación Geográfica',
        'rota-polonesa-titulo': '🇵🇱 Ruta de la Cultura Polaca',
        'rota-polonesa-desc': 'Herencia de los inmigrantes: arquitectura, gastronomía y fiestas',
        'rota-fe-titulo': '⛪ Turismo de Fe',
        'rota-fe-desc': 'Templos centenarios y capillas de las colonias rurales',
        'rota-natureza-titulo': '🌊 Náutica y Naturaleza',
        'rota-natureza-desc': 'Paseos por el Río Iguazú y Mata Atlántica',
        
        'page-sabores-titulo': 'Sabores de <strong>São Mateus</strong>',
        'page-sabores-subtitulo': 'Un viaje gastronómico por la herencia polaca y producción local',
        
        'page-eventos-titulo': 'Calendario de <strong>Eventos 2026</strong>',
        'page-eventos-subtitulo': 'Fiestas, ferias y celebraciones de la Capital Polaca de Paraná',
        'filtro-todos': 'Todos',
        'filtro-cultural': 'Cultural',
        'filtro-religioso': 'Religioso',
        'filtro-feira': 'Ferias',
        'filtro-esporte': 'Deportes',
        
        'page-ondeficar-titulo': 'Dónde <strong>Alojarse</strong>',
        'page-ondeficar-subtitulo': 'Hospedajes con comodidad y hospitalidad polaca',
        
        'page-galeria-titulo': 'Galería',
        'page-galeria-subtitulo': 'Explora a través de imágenes las bellezas y la cultura de São Mateus do Sul',
        
        'page-trade-titulo': 'Para el <strong>Comercio</strong>',
        'page-trade-subtitulo': 'Información y recursos para profesionales del turismo',
        
        'page-transparencia-titulo': 'Transparencia',
        'page-transparencia-subtitulo': 'Información sobre COMTUR, FUMTUR y políticas de turismo',
        
        'btn-voltar': '← Volver',
        'btn-reservar': 'Reservar',
        'btn-ver-detalhes': 'Ver detalles',
        'btn-saiba-mais': 'Saber más →'
    },
    pl: {
        'page-oquefazer-titulo': 'Co <strong>robić</strong>',
        'page-oquefazer-subtitulo': 'Odkryj doświadczenia, które czynią São Mateus do Sul wyjątkowym miejscem',
        'rota-ervamate-titulo': '🧉 Szlak Yerba Mate',
        'rota-ervamate-desc': 'Poznaj stuletnia tradycję mate z pieczęcią Oznaczenia Geograficznego',
        'rota-polonesa-titulo': '🇵🇱 Szlak Kultury Polskiej',
        'rota-polonesa-desc': 'Dziedzictwo imigrantów: architektura, gastronomia i festiwale',
        'rota-fe-titulo': '⛪ Turystyka religijna',
        'rota-fe-desc': 'Stuletnie świątynie i kaplice wiejskich kolonii',
        'rota-natureza-titulo': '🌊 Żeglarstwo i Przyroda',
        'rota-natureza-desc': 'Wycieczki po rzece Iguaçu i Mata Atlântica',
        
        'page-sabores-titulo': 'Smaki <strong>São Mateus</strong>',
        'page-sabores-subtitulo': 'Podróż gastronomiczna przez polskie dziedzictwo i lokalną produkcję',
        
        'page-eventos-titulo': 'Kalendarz <strong>wydarzeń 2026</strong>',
        'page-eventos-subtitulo': 'Festiwale, targi i uroczystości Polskiej Stolicy Parany',
        'filtro-todos': 'Wszystkie',
        'filtro-cultural': 'Kulturalne',
        'filtro-religioso': 'Religijne',
        'filtro-feira': 'Targi',
        'filtro-esporte': 'Sportowe',
        
        'page-ondeficar-titulo': 'Gdzie się <strong>zatrzymać</strong>',
        'page-ondeficar-subtitulo': 'Zakwaterowanie z komfortem i polską gościnnością',
        
        'page-galeria-titulo': 'Galeria',
        'page-galeria-subtitulo': 'Odkryj przez obrazy piękno i kulturę São Mateus do Sul',
        
        'page-trade-titulo': 'Dla <strong>biznesu</strong>',
        'page-trade-subtitulo': 'Informacje i zasoby dla profesjonalistów turystyki',
        
        'page-transparencia-titulo': 'Przejrzystość',
        'page-transparencia-subtitulo': 'Informacje o COMTUR, FUMTUR i politykach turystycznych',
        
        'btn-voltar': '← Wstecz',
        'btn-reservar': 'Rezerwuj',
        'btn-ver-detalhes': 'Zobacz szczegóły',
        'btn-saiba-mais': 'Dowiedz się więcej →'
    }
};

// Mesclar traduções de páginas com traduções principais
Object.keys(pageTranslations).forEach(function(lang) {
    if (translations[lang]) {
        Object.assign(translations[lang], pageTranslations[lang]);
    }
});

// Função para inicializar idioma em páginas secundárias
function initPageLanguage() {
    var savedLang = localStorage.getItem('sms-lang') || 'pt';
    applyTranslations(savedLang);
    
    // Atualizar seletor se existir
    var currentLangBtn = document.getElementById('currentLang');
    if (currentLangBtn) {
        var flagEl = currentLangBtn.querySelector('.flag');
        var codeEl = currentLangBtn.querySelector('.lang-code');
        var flags = { pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸', pl: '🇵🇱' };
        if (flagEl) flagEl.textContent = flags[savedLang] || '🇧🇷';
        if (codeEl) codeEl.textContent = savedLang.toUpperCase();
    }
}

// Auto-inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageLanguage);
} else {
    initPageLanguage();
}
