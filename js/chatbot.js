/**
 * ============================================================
 * CHATBOT MATHE — v4.0 MULTILÍNGUE
 * Idiomas: PT | EN | ES | PL
 * Detecta o idioma ativo do portal (localStorage 'smsLang')
 * ============================================================
 */

(function () {
    'use strict';

    // ──────────────────────────────────────────────────────────
    // TEXTOS DA INTERFACE (labels, placeholder, status)
    // ──────────────────────────────────────────────────────────
    var UI = {
        pt: {
            status:      'Online',
            placeholder: 'Digite sua pergunta...',
            inicial:     'Olá! Sou o Mathe, assistente virtual do Turismo de São Mateus do Sul. 🌿 Como posso ajudar?',
            sugestoes:   ['🏛️ O que fazer', '🍽️ Onde comer', '📅 Eventos', '📞 Contato'],
            sugestaoMsg: ['O que fazer',    'Restaurantes',   'Eventos',   'Contato'],
            default:     'Não entendi bem. 🤔\n\nPosso ajudar com:\n• Atrações e rotas\n• Galeria de fotos\n• Gastronomia polonesa\n• Eventos 2026\n• Hospedagem\n• Como chegar\n• Contato da Secretaria'
        },
        en: {
            status:      'Online',
            placeholder: 'Type your question...',
            inicial:     'Hello! I\'m Mathe, the virtual assistant for São Mateus do Sul Tourism. 🌿 How can I help?',
            sugestoes:   ['🏛️ What to do', '🍽️ Where to eat', '📅 Events', '📞 Contact'],
            sugestaoMsg: ['What to do',    'Restaurants',     'Events',   'Contact'],
            default:     'I didn\'t quite understand. 🤔\n\nI can help with:\n• Attractions and routes\n• Photo gallery\n• Polish gastronomy\n• 2026 events\n• Accommodation\n• How to get here\n• Tourism Secretariat contact'
        },
        es: {
            status:      'En línea',
            placeholder: 'Escribe tu pregunta...',
            inicial:     '¡Hola! Soy Mathe, el asistente virtual del Turismo de São Mateus do Sul. 🌿 ¿En qué puedo ayudarte?',
            sugestoes:   ['🏛️ Qué hacer', '🍽️ Dónde comer', '📅 Eventos', '📞 Contacto'],
            sugestaoMsg: ['Qué hacer',    'Restaurantes',     'Eventos',   'Contacto'],
            default:     'No entendí bien. 🤔\n\nPuedo ayudarte con:\n• Atracciones y rutas\n• Galería de fotos\n• Gastronomía polaca\n• Eventos 2026\n• Alojamiento\n• Cómo llegar\n• Contacto de la Secretaría'
        },
        pl: {
            status:      'Online',
            placeholder: 'Wpisz swoje pytanie...',
            inicial:     'Cześć! Jestem Mathe, wirtualny asystent Turystyki São Mateus do Sul. 🌿 Jak mogę pomóc?',
            sugestoes:   ['🏛️ Co robić', '🍽️ Gdzie jeść', '📅 Wydarzenia', '📞 Kontakt'],
            sugestaoMsg: ['Co robić',    'Restauracje',    'Wydarzenia',   'Kontakt'],
            default:     'Nie zrozumiałem dobrze. 🤔\n\nMogę pomóc w sprawach:\n• Atrakcje i szlaki\n• Galeria zdjęć\n• Polska gastronomia\n• Wydarzenia 2026\n• Zakwaterowanie\n• Jak dojechać\n• Kontakt z Sekretariatem'
        }
    };

    // ──────────────────────────────────────────────────────────
    // RESPOSTAS POR IDIOMA
    // Chave = palavras-gatilho (lowercase, sem acento)
    // ──────────────────────────────────────────────────────────
    var RESPOSTAS = {

        pt: {
            // Saudações
            'ola':              'Olá! Seja bem-vindo ao Portal de Turismo de São Mateus do Sul! 🌿 Como posso ajudar?',
            'oi':               'Oi! Que bom ter você aqui! O que gostaria de saber sobre nossa cidade?',
            'bom dia':          'Bom dia! ☀️ Pronto para conhecer a Capital Polonesa do Paraná?',
            'boa tarde':        'Boa tarde! 🌤️ Em que posso ajudar?',
            'boa noite':        'Boa noite! 🌙 Mesmo à noite, estou aqui para ajudar!',
            'tudo bem':         'Tudo ótimo por aqui! 😊 Em que posso te ajudar sobre São Mateus do Sul?',
            'obrigado':         'Disponha! 🌿 Se tiver mais dúvidas sobre nossa cidade, é só perguntar!',
            'obrigada':         'Disponha! 🌿 Se tiver mais dúvidas sobre nossa cidade, é só perguntar!',
            'valeu':            'Boa visita! 🌿 Qualquer dúvida, é só chamar!',
            // Recomendações e dúvidas gerais
            'recomenda':        'Minhas principais recomendações para São Mateus do Sul: 🌟\n\n1. 🧉 Rota da Erva-Mate — visita às ervateiras e chimarrão com IG\n2. ⛪ Igreja Água Branca — a mais fotográfica da região\n3. 🌊 Passeio de barco no Rio Iguaçu\n4. 🥟 Almoço polonês típico (Pierogi e Gołąbki)\n5. 🏪 Feira do Produtor aos sábados, 7h-12h\n\nQuer detalhes de alguma dessas opções?',
            'principal':        'Os pontos principais de São Mateus do Sul: 🌟\n\n• Igreja Matriz (centro da cidade)\n• Rio Iguaçu (passeios de barco)\n• Rua do Mathe (erva-mate e gastronomia)\n• Igreja Água Branca (arquitetura polonesa rural)\n• Praça do Rio Iguaçu\n\nQual desses te interessa mais?',
            'principais':       'Os destaques de São Mateus do Sul são: 🌟\n\n• 🧉 Erva-mate com IG São Matheus\n• ⛪ Igrejas polonesas históricas\n• 🌊 Rio Iguaçu e passeios náuticos\n• 🥟 Gastronomia polonesa (Pierogi, Gołąbki)\n• 🏪 Feira Gastronômica (qua e sex, 17h-22h)\n\nQuer saber mais sobre algum?',
            'dica':             'Dicas para sua visita a São Mateus do Sul: 💡\n\n• Visite às sextas para pegar a Feira Gastronômica (17h-22h)\n• Reserve sábado cedo para a Feira do Produtor (7h-12h)\n• Inclua a Igreja Água Branca no roteiro — é única!\n• Experimente o chimarrão com erva-mate local (IG)\n• Consulte o calendário de eventos para não perder festas',
            'dicas':            'Dicas para sua visita a São Mateus do Sul: 💡\n\n• Visite às sextas para pegar a Feira Gastronômica (17h-22h)\n• Reserve sábado cedo para a Feira do Produtor (7h-12h)\n• Inclua a Igreja Água Branca no roteiro — é única!\n• Experimente o chimarrão com erva-mate local (IG)\n• Consulte o calendário de eventos para não perder festas',
            'o que visitar':    'Sugestão de roteiro em São Mateus do Sul: 🗺️\n\n🌅 Manhã: Feira do Produtor (sáb) + Igreja Matriz\n🌞 Tarde: Igreja Água Branca + Rota da Erva-Mate\n🌙 Noite: Feira Gastronômica na Rua do Mathe\n\nPosso detalhar qualquer parte!',
            'vale a pena':      'Sim! São Mateus do Sul é um destino único no Paraná. 🌟\n\nA combinação de cultura polonesa viva, erva-mate premiada, igrejas centenárias e o Rio Iguaçu fazem da cidade uma experiência autêntica — bem diferente do turismo convencional.',
            'quais opcoes':     'Posso te ajudar com: 🗺️\n\n🧉 Rotas turísticas (6 no total)\n🏨 Hospedagem (hotéis e pousadas rurais)\n🍽️ Gastronomia polonesa e feiras\n⛪ Pontos históricos e igrejas\n🌊 Natureza e Rio Iguaçu\n📅 Eventos e festas 2026\n\nO que você quer saber?',
            // Natureza e trilhas
            'natureza':         'Opções de natureza em São Mateus do Sul: 🌿\n\n🌊 Rio Iguaçu — passeios de barco e canoagem\n🌳 Praça do Rio Iguaçu — deck e contemplação\n🚶 Trilhas nas colônias rurais\n🐟 Pesca esportiva\n🌄 Paisagens da zona rural polonesa\n\nA Rota das Águas é a mais indicada para quem busca contato com a natureza!',
            'trilha':           'As trilhas de São Mateus do Sul passam pelas colônias rurais polonesas — paisagens incríveis! 🌿\n\nA Rota das Águas e a Rota da Terra incluem caminhos rurais com contato direto com a natureza. Para detalhes de percursos, entre em contato: (42) 3532-0000.',
            'trilhas':          'As trilhas de São Mateus do Sul passam pelas colônias rurais polonesas — paisagens incríveis! 🌿\n\nA Rota das Águas e a Rota da Terra incluem caminhos rurais com contato direto com a natureza. Para detalhes de percursos, entre em contato: (42) 3532-0000.',
            'rio':              'O Rio Iguaçu é o cartão postal de São Mateus do Sul! 🌊\n\n• Passeios de barco\n• Canoagem\n• Pesca esportiva\n• Praça do Rio Iguaçu (deck, playground)\n• Vista panorâmica da ponte de entrada\n\nUm dos programas mais procurados pelos visitantes!',
            'barco':            'Passeios de barco no Rio Iguaçu! 🚢\nUm dos passeios mais procurados. Para reservas e horários, entre em contato: (42) 3532-0000.',
            'pesca':            'O Rio Iguaçu é excelente para pesca esportiva! 🎣\nConsulte regulamentações e períodos permitidos na Secretaria de Turismo: (42) 3532-0000.',
            // Pousadas e hospedagem com natureza
            'pousada':          'Temos pousadas rurais nas colônias polonesas! 🏡\n\n• Café colonial incluso\n• Contato direto com a natureza\n• Paisagens rurais da imigração polonesa\n• Tranquilidade longe do centro\n\nConsulte a página "Onde Ficar" ou ligue: (42) 3532-0000 para indicações.',
            'hotel':            'Opções de hospedagem em São Mateus do Sul: 🏨\n\n🏨 Hotel São Mateus — centro, café colonial\n🏨 Hotel Nora — aconchegante, central\n🏨 Hotel Dom Leopoldo — gastronomia polonesa\n🏡 Pousadas Rurais — contato com a natureza\n\nVisite a página "Onde Ficar" para contatos e detalhes!',
            'hospedagem':       'Temos hotéis no centro e pousadas rurais nas colônias! 🏨\nConsulte a página "Onde Ficar" para ver todas as opções.',
            'onde dormir':      'Opções de hospedagem: 🏨\n\n🏨 Hotéis no centro (São Mateus, Nora, Dom Leopoldo)\n🏡 Pousadas rurais nas colônias polonesas\n\nVisite a página "Onde Ficar" ou ligue: (42) 3532-0000.',
            'onde ficar':       'Opções de hospedagem: 🏨\n\n🏨 Hotéis no centro (São Mateus, Nora, Dom Leopoldo)\n🏡 Pousadas rurais nas colônias polonesas\n\nVisite a página "Onde Ficar" ou ligue: (42) 3532-0000.',
            'acomodacao':       'Temos hotéis no centro e pousadas rurais! 🏨 Consulte a página "Onde Ficar" para detalhes.',
            // Atrações
            'atracoes':         'São Mateus do Sul tem muitas atrações! 🏛️\n\n• Igreja Matriz neogótica\n• Rio Iguaçu (barco, canoagem)\n• Rua do Mathe (erva-mate)\n• Igrejas polonesas históricas\n• Praça do Rio Iguaçu\n• Usina de Xisto (SIX/Petrobras)',
            'atracao':          'Os principais pontos turísticos: 🏛️\n\n⛪ Igreja Matriz — neogótica, centro\n🌊 Rio Iguaçu — passeios de barco\n🌿 Rua do Mathe — erva-mate e feiras\n⛪ Igreja Água Branca — arquitetura polonesa\n🏛️ Centro Histórico — século XX',
            'pontos turisticos':'Pontos turísticos de São Mateus do Sul: 🏛️\n\n⛪ Igreja Matriz\n🌊 Rio Iguaçu\n🌿 Rua do Mathe\n⛪ Igreja Água Branca\n🏛️ Centro Histórico\n⚡ Usina de Xisto (SIX)\n🧉 Chimarródromo\n\nQuer saber mais sobre algum deles?',
            'o que fazer':      'Temos 6 rotas turísticas! 🗺️\n\n🧉 Rota da Erva-Mate\n🇵🇱 Cultura Polonesa\n⛪ Turismo de Fé\n🌊 Rota das Águas e Natureza\n🍓 Sabores & Memórias\n🌱 Rota da Terra\n\nQual delas combina com o que você procura?',
            'rota':             'Nossas 6 rotas turísticas: 🗺️\n\n🧉 Erva-Mate (IG São Matheus)\n🇵🇱 Cultura Polonesa\n⛪ Turismo de Fé\n🌊 Rota das Águas\n🍓 Sabores & Memórias\n🌱 Rota da Terra\n\nQuer detalhes de alguma rota específica?',
            'rotas':            'Nossas 6 rotas turísticas: 🗺️\n\n🧉 Erva-Mate (IG São Matheus)\n🇵🇱 Cultura Polonesa\n⛪ Turismo de Fé\n🌊 Rota das Águas\n🍓 Sabores & Memórias\n🌱 Rota da Terra\n\nQuer detalhes de alguma rota específica?',
            'rota das aguas':   'Rota das Águas — natureza e Rio Iguaçu! 🌊\n\n• Passeios de barco\n• Canoagem e pesca\n• Praça do Rio Iguaçu\n• Paisagens preservadas às margens do rio\n\nIdeal para quem busca natureza e ecoturismo!',
            'sabores':          'Rota Sabores & Memórias — turismo rural! 🍓\n\n• Morangos da Mary (colheita própria)\n• Dalety — queijos e doces artesanais\n• All Garden — produtos coloniais\n• Nova Esperança — vivência rural\n• Cabana Campo de Telha\n\nTodos na Localidade de Divisa.',
            'sabores e memorias':'Rota Sabores & Memórias — turismo rural! 🍓\n\n• Morangos da Mary (colheita própria)\n• Dalety — queijos e doces artesanais\n• All Garden — produtos coloniais\n• Nova Esperança — vivência rural\n• Cabana Campo de Telha\n\nTodos na Localidade de Divisa.',
            'rota da terra':    'Rota da Terra — agricultura familiar e produtos coloniais! 🌱\nVisitas a propriedades rurais, produtos orgânicos e contato com a vida no campo.',
            // Erva-mate
            'erva':             'Nossa erva-mate tem Indicação Geográfica (IG São Matheus)! 🧉\nVisite a Rua do Mathe, o Chimarródromo e as ervateiras da região.',
            'mate':             'A erva-mate de São Mateus tem Indicação Geográfica! 🧉\nVisite a Rua do Mathe, o Chimarródromo e as ervateiras.',
            'chimarrao':        'O Chimarródromo fica na Praça do Rio Iguaçu e acontece todo 1º domingo do mês! 🧉 Degustação gratuita.',
            'ervateira':        'Ervateiras na Rota da Erva-Mate: 🧉\n\n• Ervateira Rei Verde — Fluviópolis\n• Parada do Chimarrão — Fluviópolis\n• Ervateira Taquaral — Taquaral do Bugre\n• Vivenda do Mate — Faxinal do Ilhéus\n• Viveiro Santana — Lajeadinho\n\nTodas com erva-mate de Indicação Geográfica!',
            // Cultura polonesa
            'polones':          'Somos a Capital Polonesa do Paraná! 🇵🇱\n\n• Igrejas centenárias dos imigrantes\n• Gastronomia: Pierogi, Gołąbki, Borscht\n• Baile do Pierogi (Abril) e Polskie Smaki (Agosto)\n• Mês Polonês — agosto inteiro de eventos!',
            'polonesa':         'Somos a Capital Polonesa do Paraná! 🇵🇱\n\n• Igrejas centenárias dos imigrantes\n• Gastronomia: Pierogi, Gołąbki, Borscht\n• Baile do Pierogi (Abril) e Polskie Smaki (Agosto)\n• Mês Polonês — agosto inteiro de eventos!',
            'cultura':          'A cultura polonesa de São Mateus do Sul é viva e autêntica! 🇵🇱\n\n• Igrejas e capelas centenárias\n• Gastronomia típica preservada\n• Grupos folclóricos (Karolinka)\n• Festas tradicionais o ano todo\n• Arquitetura rural de madeira',
            'polskie':          'A 7ª Polskie Smaki será em 29/08/2026! 🇵🇱\nDesfile na Av. Ozy Mendonça, comidas polonesas na Rua do Mathe e Concurso Papa Pierogi.',
            'pierogi':          'O Baile do Pierogi é em 25/04/2026 no CEPOM! 🥟\nAbertura da Vodka Polonesa, escolha da rainha e o tradicional pierogi ao molho.',
            'xisto':            'A Usina de Xisto (SIX) da Petrobras é um dos pontos de turismo industrial de São Mateus do Sul! ⚡\nUma das mais avançadas unidades de processamento de xisto betuminoso do mundo. Consulte visitas: (42) 3532-0000.',
            // Gastronomia
            'restaurante':      'Nossa gastronomia mistura tradições polonesas e coloniais! 🍽️\n\n🥟 Pierogi — pastel polonês recheado\n🥬 Gołąbki — repolho recheado\n🧀 Queijos artesanais defumados\n🍞 Pães coloniais de fermentação natural\n🍓 Morangos frescos\n🧉 Chimarrão com erva-mate IG\n\nVisite a página "Sabores" para restaurantes e feiras!',
            'restaurantes':     'Para comer bem em São Mateus do Sul: 🍽️\n\n• Restaurantes com culinária polonesa no centro\n• Feira Gastronômica na Rua do Mathe (qua e sex, 17h-22h)\n• Feira do Produtor (sáb, 7h-12h)\n• Café colonial nas pousadas rurais\n\nConsulte a página "Sabores" para lista completa!',
            'onde comer':       'Opções para comer em São Mateus do Sul: 🍽️\n\n• Restaurantes com culinária polonesa no centro\n• Feira Gastronômica — qua e sex, 17h-22h, Rua do Mathe\n• Café colonial nas pousadas rurais\n\nExperimente o Pierogi e o Gołąbki — são os pratos mais típicos!',
            'comida':           'Pratos típicos de São Mateus do Sul: 🍽️\n\n🥟 Pierogi (pastel polonês)\n🥬 Gołąbki (repolho recheado)\n🍞 Pão colonial\n🧀 Queijo artesanal\n🍰 Doces e geleias coloniais\n🧉 Chimarrão com erva-mate IG\n\nTudo isso na Feira Gastronômica ou nos restaurantes locais!',
            'cafe colonial':    'Café colonial disponível nas pousadas rurais e alguns restaurantes de São Mateus do Sul! ☕\nBuche, bolo, queijo artesanal, pão colonial, geleias — uma experiência completa.',
            'feira':            'Feiras de São Mateus do Sul: 🏪\n\n🍽️ Feira Gastronômica — qua e sex, 17h-22h, Rua do Mathe\n🥬 Feira do Produtor — sábados, 7h-12h, Rua do Mathe\n🌙 Feira da Lua — 2ª terça, 17h-22h, Vila Pinheirinho\n\nAmbas gratuitas e com produtos locais!',
            'gastronom':        'Gastronomia de São Mateus do Sul: 🍽️\n\nFeira Gastronômica: qua e sex, 17h-22h.\nFeira do Produtor: sáb, 7h-12h.\nAmbas na Rua do Mathe!\n\nDa culinária polonesa (Pierogi, Gołąbki) ao café colonial.',
            'morango':          'Morangos frescos na Rota Sabores & Memórias! 🍓\nVisita ao Morangos da Mary na Localidade de Divisa — colheita própria!\nSáb/Dom 14h30-18h; Seg-Sex com agendamento. Tel: (42) 99820-6671.',
            'morangos':         'Morangos frescos na Rota Sabores & Memórias! 🍓\nVisita ao Morangos da Mary na Localidade de Divisa — colheita própria!\nSáb/Dom 14h30-18h; Seg-Sex com agendamento. Tel: (42) 99820-6671.',
            // Eventos
            'eventos':          'Calendário 2026 com mais de 280 eventos! 📅\n\n• Baile do Pierogi — 25/04\n• Mês Polonês — Agosto\n• Polskie Smaki — 29/08\n• V AgroSamas — 18-21/09\n• Natal Ouro Verde — Dez\n\nVisite a página Eventos para o calendário completo!',
            'evento':           'Próximos eventos em São Mateus do Sul: 📅\n\n• Baile do Pierogi — 25/04/2026\n• Festival do Cordeiro — 07-09/08/2026\n• Polskie Smaki — 29/08/2026\n• V AgroSamas — 18-21/09/2026\n• Natal Ouro Verde — Dez/2026\n\nVisite a página Eventos para ver todos!',
            'festa':            'Principais festas de São Mateus do Sul: 🎉\n\n🥟 Baile do Pierogi — abril\n🐑 Festival do Cordeiro — agosto\n🇵🇱 Polskie Smaki — agosto\n🚜 V AgroSamas — setembro\n🎄 Natal Ouro Verde — dezembro\n\nTodas com entrada gratuita!',
            'festas':           'Principais festas de São Mateus do Sul: 🎉\n\n🥟 Baile do Pierogi — abril\n🐑 Festival do Cordeiro — agosto\n🇵🇱 Polskie Smaki — agosto\n🚜 V AgroSamas — setembro\n🎄 Natal Ouro Verde — dezembro\n\nTodas com entrada gratuita!',
            'agrosamas':        'V AgroSamas 2026: 18 a 21 de setembro! 🌿\nShows nacionais, gastronomia, exposição agropecuária. Entrada gratuita!',
            'natal':            'Natal Ouro Verde: 6 a 20/12/2026! 🎄\nDesfiles, shows, chegada do Papai Noel e feira gastronômica.',
            'mes polones':      'Mês Polonês em agosto! 🇵🇱\nBaile Polonês (01/08), Festival do Cordeiro (07-09/08), Polskie Smaki (29/08) e muito mais!',
            'agosto':           'Agosto é o mês polonês de São Mateus do Sul! 🇵🇱\n\n• 01/08 — Baile Polonês\n• 07-09/08 — Festival do Cordeiro\n• 29/08 — Polskie Smaki (gastronomia e folclore)\n\nO mês mais agitado da cidade!',
            'setembro':         'Em setembro temos o V AgroSamas (18-21/09)! 🚜\nO maior evento do município — shows nacionais, feira gastronômica, exposição agropecuária. Entrada gratuita!',
            'dezembro':         'Em dezembro temos o Natal Ouro Verde (6-20/12)! 🎄\nDesfiles temáticos, shows, chegada do Papai Noel e feira gastronômica.',
            'cordeiro':         'Festival do Cordeiro: 7 a 9/08/2026! 🐑\nGastronomia de cordeiro, shows nativistas e exposição de ovinos.',
            // Contato
            'contato':          '📞 (42) 3532-0000\n📧 turismo@saomateusdosul.pr.gov.br\n📍 Chalé da Cultura — Praça do Rio Iguaçu\n⏰ Seg-Sex: 8h-17h | Sáb: 9h-13h',
            'telefone':         '📞 Secretaria de Turismo: (42) 3532-0000',
            'email':            '📧 turismo@saomateusdosul.pr.gov.br',
            'secretaria':       '📞 Secretaria de Cultura e Turismo: (42) 3532-0000\n📧 turismo@saomateusdosul.pr.gov.br\n⏰ Seg-Sex: 8h-17h | Sáb: 9h-13h',
            'falar':            '📞 Para falar com a Secretaria de Turismo: (42) 3532-0000\n⏰ Seg-Sex: 8h-17h | Sáb: 9h-13h',
            // Como chegar
            'como chegar':      '📍 São Mateus do Sul:\n• 150 km de Curitiba (BR-376, ~2h)\n• 60 km de União da Vitória\nAeroporto mais próximo: Afonso Pena (Curitiba).',
            'como ir':          '📍 São Mateus do Sul fica a 150 km de Curitiba pela BR-376, aproximadamente 2 horas de carro. Aeroporto mais próximo: Afonso Pena (Curitiba).',
            'curitiba':         'De Curitiba: ~150 km pela BR-376, aproximadamente 2 horas de carro! 🚗',
            'onibus':           'Para chegar de ônibus: há linhas regulares saindo de Curitiba e União da Vitória com destino a São Mateus do Sul. Consulte as rodoviárias locais para horários atualizados.',
            'distancia':        'Distâncias até São Mateus do Sul: 📍\n\n• Curitiba: ~150 km (BR-376, ~2h)\n• União da Vitória: ~60 km\n• Ponta Grossa: ~150 km\n• Irati: ~60 km',
            // Galeria
            'galeria':          'Nossa Galeria tem fotos e vídeos incríveis! 📸\n\n🏠 Patrimônio (Igreja Água Branca)\n🌊 Natureza\n🍽️ Gastronomia\n🎭 Eventos\n🎨 Arte & História\n🎥 Vídeos das rotas\n\nAcesse Galeria no menu!',
            'foto':             'Galeria completa de fotos e vídeos no menu! 📸',
            'fotos':            'Galeria completa de fotos e vídeos no menu! 📸\nEm alta: Igreja Água Branca, Rio Iguaçu e gastronomia polonesa.',
            // Igrejas
            'agua branca':      'A Igreja Água Branca é uma joia da arquitetura polonesa rural! ⛪\nConstruída pelos imigrantes no séc. XIX — um dos pontos mais fotográficos da região.',
            'igreja':           'Igrejas históricas de São Mateus do Sul: ⛪\n\n• Igreja Matriz — neogótica, centro da cidade\n• Igreja Água Branca — arquitetura polonesa rural\n• Capelas nas colônias\n• Santuário N. Sra. Częstochowa',
            'fe':               'Turismo de Fé em São Mateus do Sul: ⛪\n\n• Igreja Matriz (centro)\n• Igreja Água Branca (Localidade de Água Branca)\n• Capelas rurais nas colônias polonesas\n• Santuário N. Sra. Częstochowa\n\nA Rota Turismo de Fé cobre todos esses pontos!',
            'turismo de fe':    'Turismo de Fé em São Mateus do Sul: ⛪\n\n• Igreja Matriz (centro)\n• Igreja Água Branca\n• Capelas rurais nas colônias polonesas\n• Santuário N. Sra. Częstochowa\n\nA Rota Turismo de Fé cobre todos esses pontos!',
            // Reservas e roteiro
            'reserva':          'Para reservar atividades e passeios: 📝\n\nPasseios no Rio Iguaçu, visitas guiadas, degustações de erva-mate.\nLigue: (42) 3532-0000 ou acesse o portal do usuário!',
            'roteiro':          'Sugestão de roteiro para 1 dia em São Mateus do Sul: 🗺️\n\n🌅 Manhã: Igreja Matriz + Centro Histórico\n🌞 Tarde: Rota da Erva-Mate ou Igreja Água Branca\n🌙 Noite: Feira Gastronômica na Rua do Mathe (qua/sex)\n\nPara mais dias, posso sugerir as 6 rotas completas!',
            'roteiros':         'Sugestão de roteiro para 1 dia em São Mateus do Sul: 🗺️\n\n🌅 Manhã: Igreja Matriz + Centro Histórico\n🌞 Tarde: Rota da Erva-Mate ou Igreja Água Branca\n🌙 Noite: Feira Gastronômica na Rua do Mathe (qua/sex)\n\nPara mais dias, posso sugerir as 6 rotas completas!',
            'fim de semana':    'Sugestão de fim de semana em São Mateus do Sul: 🗓️\n\n🟩 Sábado:\n• Feira do Produtor (7h-12h, Rua do Mathe)\n• Rota da Erva-Mate\n• Igreja Água Branca\n\n🟦 Domingo:\n• Igreja Matriz\n• Passeio de barco no Rio Iguaçu\n• Chimarródromo (1º domingo do mês)\n\nQuer mais detalhes?',
            'programacao':      'O que programar em São Mateus do Sul: 📋\n\n• Feira do Produtor (sáb, 7h-12h)\n• Feira Gastronômica (qua e sex, 17h-22h)\n• Passeio no Rio Iguaçu\n• Visita às ervateiras e igrejas\n\nConsulte o calendário de eventos para datas especiais!',
        },

        en: {
            // Greetings
            'hello':      'Hello! Welcome to São Mateus do Sul Tourism Portal! 🌿 How can I help?',
            'hi':         'Hi! Great to have you here! What would you like to know about our city?',
            'good morning':'Good morning! ☀️ Ready to explore the Polish Capital of Paraná?',
            'good afternoon':'Good afternoon! 🌤️ How can I help you?',
            'good evening':'Good evening! 🌙 I\'m here to help even at night!',
            // Attractions
            'attraction': 'São Mateus do Sul has amazing attractions! 🏛️\n\n• Neo-Gothic Church (city center)\n• Iguaçu River (boat tours, kayaking)\n• Rua do Mathe (yerba mate, food)\n• Historic Polish churches\n• Iguaçu River Square',
            'what to do': 'We have 6 tourist routes! 🗺️\n\n🧉 Yerba Mate Route\n🇵🇱 Polish Culture\n⛪ Religious Tourism\n🌊 Nautical & Nature\n🍓 Flavors & Memories\n🌱 Earth Route\n\nVisit "Things to Do" for details!',
            'route':      '6 tourist routes:\n\n🧉 Yerba Mate (GI São Matheus)\n🇵🇱 Polish Culture\n⛪ Religious Tourism\n🌊 Waters Route\n🍓 Flavors & Memories\n🌱 Earth Route',
            // Yerba mate
            'yerba':      'Our yerba mate has a Geographic Indication (GI São Matheus)! 🧉\nVisit Rua do Mathe, the Chimarródromo and local mate producers.',
            'mate':       'São Mateus yerba mate has a Geographic Indication! 🧉\nVisit Rua do Mathe and local producers.',
            // Polish culture
            'polish':     'We are the Polish Capital of Paraná! 🇵🇱\n\n• Century-old immigrant churches\n• Food: Pierogi, Golabki, Borscht\n• Pierogi Ball (April) & Polskie Smaki (August)\n• Polish Month — the entire month of August!',
            'polskie':    '7th Polskie Smaki: August 29, 2026! 🇵🇱\nFolklore parade, Polish food and Papa Pierogi Contest.',
            'pierogi':    'Pierogi Ball: April 25, 2026 at CEPOM! 🥟\nTraditional Polish vodka opening and pierogi dinner.',
            // Food
            'restaurant': 'Our gastronomy blends Polish and local traditions! 🍽️\n\n🥟 Pierogi\n🥬 Golabki\n🧀 Artisan cheeses\n🍞 Colonial bread\n🍓 Fresh strawberries\n🧉 GI Yerba Mate',
            'food':       'Traditional dishes: Pierogi, Golabki, Borscht, Makowiec, artisan cheese and colonial coffee! 🍽️',
            'market':     'Food Market: Wed & Fri, 5–10 PM. 🏪\nFarmers Market: Saturdays, 7 AM–12 PM.\nBoth at Rua do Mathe!',
            // Accommodation
            'hotel':      'We have hotels, rural guesthouses and cottages! 🏨\nCheck the "Where to Stay" page for details.',
            'accommodation':'Check the "Where to Stay" page for all lodging options! 🏨',
            // Events
            'events':     '2026 Calendar with 280+ events! 📅\n\n• Pierogi Ball — Apr 25\n• Polish Month — August\n• Polskie Smaki — Aug 29\n• V AgroSamas — Sep 18-21\n• Christmas Ouro Verde — Dec',
            'agrosamas':  'V AgroSamas 2026: September 18–21! 🌿\nNational shows, food fair, agribusiness expo. Free entry!',
            'christmas':  'Ouro Verde Christmas: Dec 6–20, 2026! 🎄\nParades, shows, Santa Claus arrival and food fair.',
            // Contact
            'contact':    '📞 +55 (42) 3532-0000\n📧 turismo@saomateusdosul.pr.gov.br\n📍 Culture Cottage — Iguaçu River Square\n⏰ Mon–Fri: 8 AM–5 PM | Sat: 9 AM–1 PM',
            'phone':      '📞 Tourism Secretariat: +55 (42) 3532-0000',
            // How to get there
            'how to get': '📍 São Mateus do Sul:\n• 150 km from Curitiba (BR-376, ~2h drive)\n• 60 km from União da Vitória\nNearest airport: Afonso Pena (Curitiba).',
            'curitiba':   'From Curitiba: ~150 km via BR-376, about 2 hours by car! 🚗',
            // Gallery
            'gallery':    'Our Gallery has amazing photos and videos! 📸\n\n🏠 Heritage (Igreja Água Branca)\n🌊 Nature\n🍽️ Gastronomy\n🎭 Events\n🎨 Art & History\n🎥 Route videos\n\nAccess Gallery in the menu!',
            // Church
            'church':     'Historic churches:\n\n• Igreja Matriz — neo-Gothic, city center\n• Igreja Água Branca — rural Polish architecture\n• Colony chapels\n• N. Lady of Częstochowa Shrine ⛪',
            // Booking
            'book':       'Book tourism activities on our portal! 📝\n\nRiver tours, guided visits, tastings. Or call: +55 (42) 3532-0000',
        },

        es: {
            // Saludos
            'hola':       '¡Hola! ¡Bienvenido al Portal de Turismo de São Mateus do Sul! 🌿 ¿En qué puedo ayudarte?',
            'buenos dias':'¡Buenos días! ☀️ ¿Listo para conocer la Capital Polaca de Paraná?',
            'buenas tardes':'¡Buenas tardes! 🌤️ ¿En qué puedo ayudarte?',
            'buenas noches':'¡Buenas noches! 🌙 ¡Estoy aquí para ayudarte incluso de noche!',
            // Atracciones
            'atraccion':  '¡São Mateus do Sul tiene muchas atracciones! 🏛️\n\n• Iglesia Matriz neogótica\n• Río Iguaçu (paseos en bote)\n• Rua do Mathe (mate, gastronomía)\n• Iglesias polacas históricas\n• Plaza del Río Iguaçu',
            'que hacer':  '¡Tenemos 6 rutas turísticas! 🗺️\n\n🧉 Ruta del Mate\n🇵🇱 Cultura Polaca\n⛪ Turismo Religioso\n🌊 Náutica y Naturaleza\n🍓 Sabores y Memorias\n🌱 Ruta de la Tierra',
            'ruta':       '6 rutas turísticas:\n\n🧉 Yerba Mate (IG São Matheus)\n🇵🇱 Cultura Polaca\n⛪ Turismo Religioso\n🌊 Ruta de las Aguas\n🍓 Sabores y Memorias\n🌱 Ruta de la Tierra',
            // Yerba mate
            'yerba':      '¡Nuestra yerba mate tiene Indicación Geográfica! 🧉\nVisita la Rua do Mathe, el Chimarródromo y los productores locales.',
            'mate':       '¡La yerba mate de São Mateus tiene IG! 🧉\nVisita la Rua do Mathe y los productores.',
            // Cultura polaca
            'polaca':     '¡Somos la Capital Polaca de Paraná! 🇵🇱\n\n• Iglesias centenarias de inmigrantes\n• Gastronomía: Pierogi, Golabki, Borscht\n• Baile del Pierogi (Abril) y Polskie Smaki (Agosto)\n• ¡Mes Polaco — agosto entero de eventos!',
            'polskie':    '7ª Polskie Smaki: 29/08/2026! 🇵🇱\nDesfile folclórico, comida polaca y Concurso Papa Pierogi.',
            'pierogi':    'Baile del Pierogi: 25/04/2026 en CEPOM! 🥟\nApertura con Vodka Polaca y cena tradicional de pierogi.',
            // Gastronomía
            'restaurante':'¡Nuestra gastronomía mezcla tradiciones polacas y locales! 🍽️\n\n🥟 Pierogi\n🥬 Golabki\n🧀 Quesos artesanales\n🍞 Pan colonial\n🍓 Fresas frescas\n🧉 Mate con IG',
            'comida':     'Platos típicos: Pierogi, Golabki, Borscht, Makowiec, quesos artesanales y café colonial! 🍽️',
            'feria':      'Feria Gastronómica: miércoles y viernes, 17-22h. 🏪\nFeria del Productor: sábados, 7-12h.\n¡Ambas en la Rua do Mathe!',
            // Alojamiento
            'hotel':      '¡Tenemos hoteles, posadas rurales y cabañas! 🏨\nConsulta la página "Dónde Alojarse".',
            'alojamiento':'Consulta la página "Dónde Alojarse" para todas las opciones! 🏨',
            // Eventos
            'eventos':    '¡Calendario 2026 con más de 280 eventos! 📅\n\n• Baile del Pierogi — 25/04\n• Mes Polaco — Agosto\n• Polskie Smaki — 29/08\n• V AgroSamas — 18-21/09\n• Navidad Ouro Verde — Dic',
            'agrosamas':  'V AgroSamas 2026: 18 al 21 de septiembre! 🌿\n¡Shows nacionales, feria gastronómica, exposición agropecuaria. ¡Entrada gratuita!',
            'navidad':    '¡Navidad Ouro Verde: 6 al 20/12/2026! 🎄\nDesfiles, shows, llegada de Papá Noel y feria gastronómica.',
            // Contacto
            'contacto':   '📞 +55 (42) 3532-0000\n📧 turismo@saomateusdosul.pr.gov.br\n📍 Cabaña de la Cultura — Plaza del Río Iguaçu\n⏰ Lun-Vie: 8-17h | Sáb: 9-13h',
            'telefono':   '📞 Secretaría de Turismo: +55 (42) 3532-0000',
            // Cómo llegar
            'como llegar':'📍 São Mateus do Sul:\n• 150 km de Curitiba (BR-376, ~2h)\n• 60 km de União da Vitória\nAeropuerto más cercano: Afonso Pena (Curitiba).',
            // Galería
            'galeria':    '¡Nuestra Galería tiene fotos y videos increíbles! 📸\n\n🏠 Patrimonio (Igreja Água Branca)\n🌊 Naturaleza\n🍽️ Gastronomía\n🎭 Eventos\n🎨 Arte & Historia\n🎥 Videos de las rutas\n\n¡Accede a Galería en el menú!',
            // Iglesia
            'iglesia':    'Iglesias históricas:\n\n• Igreja Matriz — neogótica, centro\n• Igreja Água Branca — arquitectura polaca rural\n• Capillas en las colonias ⛪',
            // Reservas
            'reserva':    '¡Reserva actividades turísticas en el portal! 📝\n\nPaseos en el río, visitas guiadas, degustaciones. O llama: +55 (42) 3532-0000',
        },

        pl: {
            // Pozdrowienia
            'czesc':      'Cześć! Witaj w Portalu Turystycznym São Mateus do Sul! 🌿 Jak mogę pomóc?',
            'dzien dobry':'Dzień dobry! ☀️ Gotowy/a odkryć Polską Stolicę Paraná?',
            'dobry wieczor':'Dobry wieczór! 🌙 Jestem tutaj, by pomagać nawet wieczorem!',
            // Atrakcje
            'atrakcje':   'São Mateus do Sul ma wiele atrakcji! 🏛️\n\n• Neogotyckí Kościół Parafialny\n• Rzeka Iguaçu (rejsy, kajaki)\n• Rua do Mathe (yerba mate)\n• Historyczne polskie kościoły\n• Plac Rzeki Iguaçu',
            'co robic':   'Mamy 6 szlaków turystycznych! 🗺️\n\n🧉 Szlak Yerba Mate\n🇵🇱 Kultura Polska\n⛪ Turystyka Religijna\n🌊 Żeglarstwo i Natura\n🍓 Smaki i Wspomnienia\n🌱 Szlak Ziemi',
            'szlak':      '6 szlaków turystycznych:\n\n🧉 Yerba Mate (IG São Matheus)\n🇵🇱 Kultura Polska\n⛪ Turystyka Religijna\n🌊 Szlak Wód\n🍓 Smaki i Wspomnienia\n🌱 Szlak Ziemi',
            // Yerba mate
            'yerba':      'Nasza yerba mate ma Oznaczenie Geograficzne (IG São Matheus)! 🧉\nOdwiedź Rua do Mathe, Chimarródromo i lokalne ervateiras.',
            'mate':       'Yerba mate z São Mateus ma Oznaczenie Geograficzne! 🧉\nOdwiedź Rua do Mathe i producentów.',
            'chimarrao':  'Chimarródromo na Placu Rzeki Iguaçu — degustacja w każdą pierwszą niedzielę miesiąca! 🧉',
            // Kultura polska
            'polska':     'Jesteśmy Polską Stolicą Paraná! 🇵🇱\n\n• Stuletnie kościoły imigrantów\n• Kuchnia: Pierogi, Gołąbki, Barszcz\n• Bal Pierogowy (kwiecień) i Polskie Smaki (sierpień)\n• Miesiąc Polski — cały sierpień pełen wydarzeń!',
            'polskie':    '7. Polskie Smaki: 29/08/2026! 🇵🇱\nParada folklorystyczna, polskie jedzenie i Konkurs Papa Pierogi.',
            'pierogi':    'Bal Pierogowy: 25/04/2026 w CEPOM! 🥟\nOtwarcie z Wódką Polską i tradycyjne pierogi z sosem.',
            // Gastronomia
            'restauracja':'Nasza gastronomia łączy polskie i lokalne tradycje! 🍽️\n\n🥟 Pierogi\n🥬 Gołąbki\n🧀 Rzemieślnicze sery\n🍞 Chleb kolonialny\n🍓 Świeże truskawki\n🧉 Yerba mate z IG',
            'jedzenie':   'Tradycyjne dania: Pierogi, Gołąbki, Barszcz, Makowiec, sery rzemieślnicze i kawa kolonialna! 🍽️',
            'targ':       'Targ Gastronomiczny: środa i piątek, 17-22h. 🏪\nTarg Producentów: soboty, 7-12h.\nOba na Rua do Mathe!',
            // Zakwaterowanie
            'hotel':      'Mamy hotele, wiejskie pensjonaty i domki! 🏨\nSprawdź stronę "Gdzie Spać".',
            'nocleg':     'Sprawdź stronę "Gdzie Spać", aby zobaczyć wszystkie opcje noclegowe! 🏨',
            // Wydarzenia
            'wydarzenia': 'Kalendarz 2026 z ponad 280 wydarzeniami! 📅\n\n• Bal Pierogowy — 25/04\n• Miesiąc Polski — sierpień\n• Polskie Smaki — 29/08\n• V AgroSamas — 18-21/09\n• Boże Narodzenie Ouro Verde — grudzień',
            'agrosamas':  'V AgroSamas 2026: 18-21 września! 🌿\nNarodowe pokazy, targ gastronomiczny, targi rolnicze. Wstęp wolny!',
            'swięta':     'Boże Narodzenie Ouro Verde: 6-20/12/2026! 🎄\nParady, pokazy, przybycie Świętego Mikołaja i targ gastronomiczny.',
            // Kontakt
            'kontakt':    '📞 +55 (42) 3532-0000\n📧 turismo@saomateusdosul.pr.gov.br\n📍 Chata Kultury — Plac Rzeki Iguaçu\n⏰ Pon-Pt: 8-17h | Sob: 9-13h',
            'telefon':    '📞 Sekretariat Turystyki: +55 (42) 3532-0000',
            // Jak dojechać
            'jak dojechac':'📍 São Mateus do Sul:\n• 150 km od Kurytyby (BR-376, ~2h)\n• 60 km od União da Vitória\nNajbliższe lotnisko: Afonso Pena (Kurytyba).',
            'kurytyba':   'Z Kurytyby: ~150 km drogą BR-376, około 2 godziny jazdy samochodem! 🚗',
            // Galeria
            'galeria':    'Nasza Galeria ma niesamowite zdjęcia i filmy! 📸\n\n🏠 Dziedzictwo (Igreja Água Branca)\n🌊 Natura\n🍽️ Gastronomia\n🎭 Wydarzenia\n🎨 Sztuka & Historia\n🎥 Filmy ze szlaków\n\nOtwórz Galerię w menu!',
            // Kościół
            'kosciol':    'Historyczne kościoły:\n\n• Igreja Matriz — neogotycka, centrum miasta\n• Igreja Água Branca — polska architektura wiejska\n• Kaplice w koloniach\n• Sanktuarium N.M.P. Częstochowskiej ⛪',
            // Rezerwacje
            'rezerwacja': 'Zarezerwuj atrakcje turystyczne przez portal! 📝\n\nRejsy rzeczne, wycieczki z przewodnikiem, degustacje. Lub zadzwoń: +55 (42) 3532-0000',
        }
    };

    // ──────────────────────────────────────────────────────────
    // CHATBOT
    // ──────────────────────────────────────────────────────────
    var Chatbot = {

        config: {
            nome:       'Mathe',
            avatar:     '🧉',
            corPrimaria:'#0a3d2e'
        },

        isOpen:        false,
        isInitialized: false,

        getLang: function () {
            // Tenta 'sms-lang' (chave do seletor de idiomas do portal) e 'smsLang' como fallback
            var lang = (localStorage.getItem('sms-lang') || localStorage.getItem('smsLang') || 'pt').toLowerCase();
            if (!UI[lang]) lang = 'pt';
            return lang;
        },

        getUI: function () { return UI[this.getLang()]; },
        getRespostas: function () { return RESPOSTAS[this.getLang()]; },

        normalizar: function (txt) {
            return txt.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9\s]/g, ' ')
                .trim();
        },

        encontrarResposta: function (msg) {
            var msgNorm = this.normalizar(msg);
            var respostas = this.getRespostas();
            for (var chave in respostas) {
                if (this.normalizar(chave) !== '' && msgNorm.indexOf(this.normalizar(chave)) !== -1) {
                    return respostas[chave];
                }
            }
            return this.getUI().default;
        },

        init: function () {
            if (this.isInitialized) return;
            try {
                this.renderWidget();
                this.bindEvents();
                this.isInitialized = true;
            } catch (e) {
                console.error('Chatbot erro:', e);
            }
        },

        renderWidget: function () {
            var old = document.getElementById('chatbot-widget');
            if (old) old.remove();

            var ui  = this.getUI();
            var cor = this.config.corPrimaria;
            var w   = document.createElement('div');
            w.id    = 'chatbot-widget';
            w.innerHTML =
                '<button class="chatbot-trigger" id="chatbot-trigger" type="button">' +
                    '<span class="chatbot-avatar">' + this.config.avatar + '</span>' +
                    '<span class="chatbot-badge">1</span>' +
                '</button>' +
                '<div class="chatbot-window" id="chatbot-window">' +
                    '<div class="chatbot-header">' +
                        '<div class="chatbot-header-info">' +
                            '<span>' + this.config.avatar + '</span>' +
                            '<div><strong>' + this.config.nome + '</strong>' +
                            '<span class="chatbot-status" id="chatbot-status">' + ui.status + '</span></div>' +
                        '</div>' +
                        '<button class="chatbot-close" id="chatbot-close" type="button">×</button>' +
                    '</div>' +
                    '<div class="chatbot-messages" id="chatbot-messages"></div>' +
                    '<div class="chatbot-suggestions" id="chatbot-suggestions"></div>' +
                    '<form class="chatbot-input" id="chatbot-form">' +
                        '<input type="text" id="chatbot-input-field" placeholder="' + ui.placeholder + '">' +
                        '<button type="submit">➤</button>' +
                    '</form>' +
                '</div>';

            document.body.appendChild(w);
            this.injetarEstilos(cor);
            this.renderSugestoes();

            var self = this;
            setTimeout(function () {
                self.adicionarMensagem(self.getUI().inicial, 'bot');
            }, 1000);
        },

        renderSugestoes: function () {
            var ui   = this.getUI();
            var cont = document.getElementById('chatbot-suggestions');
            if (!cont) return;
            cont.innerHTML = '';
            ui.sugestoes.forEach(function (label, i) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.textContent = label;
                btn.setAttribute('data-msg', ui.sugestaoMsg[i]);
                cont.appendChild(btn);
            });
        },

        atualizarIdioma: function () {
            var ui = this.getUI();
            var status = document.getElementById('chatbot-status');
            var input  = document.getElementById('chatbot-input-field');
            if (status) status.textContent = ui.status;
            if (input)  input.placeholder  = ui.placeholder;
            this.renderSugestoes();
        },

        injetarEstilos: function (cor) {
            var old = document.getElementById('chatbot-styles');
            if (old) old.remove();
            var s = document.createElement('style');
            s.id  = 'chatbot-styles';
            s.textContent =
                '#chatbot-widget{position:fixed;bottom:20px;right:20px;z-index:999999;font-family:Raleway,sans-serif}' +
                '#chatbot-widget .chatbot-trigger{width:65px;height:65px;border-radius:50%;background:' + cor + ';border:none;cursor:pointer;box-shadow:0 4px 25px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;transition:transform .3s}' +
                '#chatbot-widget .chatbot-trigger:hover{transform:scale(1.1)}' +
                '#chatbot-widget .chatbot-avatar{font-size:2.2rem}' +
                '#chatbot-widget .chatbot-badge{position:absolute;top:-5px;right:-5px;background:#e74c3c;color:#fff;width:24px;height:24px;border-radius:50%;font-size:12px;font-weight:bold;display:flex;align-items:center;justify-content:center;border:2px solid #fff}' +
                '#chatbot-widget .chatbot-window{position:absolute;bottom:80px;right:0;width:360px;height:500px;background:#fff;border-radius:20px;box-shadow:0 15px 50px rgba(0,0,0,.3);display:none;flex-direction:column;overflow:hidden}' +
                '#chatbot-widget .chatbot-window.active{display:flex;animation:chatUp .3s ease}' +
                '@keyframes chatUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}' +
                '#chatbot-widget .chatbot-header{background:' + cor + ';color:#fff;padding:1rem;display:flex;justify-content:space-between;align-items:center}' +
                '#chatbot-widget .chatbot-header-info{display:flex;align-items:center;gap:.75rem;font-size:1.6rem}' +
                '#chatbot-widget .chatbot-header strong{display:block}' +
                '#chatbot-widget .chatbot-status{font-size:.75rem;opacity:.9}' +
                '#chatbot-widget .chatbot-close{background:rgba(255,255,255,.2);border:none;color:#fff;width:32px;height:32px;border-radius:50%;font-size:1.5rem;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
                '#chatbot-widget .chatbot-close:hover{background:rgba(255,255,255,.3)}' +
                '#chatbot-widget .chatbot-messages{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.75rem;background:#f8f9fa}' +
                '#chatbot-widget .chatbot-msg{max-width:85%;padding:.85rem 1rem;border-radius:18px;line-height:1.5;font-size:.9rem;white-space:pre-line}' +
                '#chatbot-widget .chatbot-msg.bot{background:#fff;align-self:flex-start;border-bottom-left-radius:5px;box-shadow:0 1px 3px rgba(0,0,0,.1)}' +
                '#chatbot-widget .chatbot-msg.user{background:' + cor + ';color:#fff;align-self:flex-end;border-bottom-right-radius:5px}' +
                '#chatbot-widget .chatbot-suggestions{padding:.75rem 1rem;display:flex;flex-wrap:wrap;gap:.5rem;border-top:1px solid #eee;background:#fff}' +
                '#chatbot-widget .chatbot-suggestions button{background:#f0f2f5;border:none;padding:.5rem .9rem;border-radius:20px;font-size:.8rem;cursor:pointer;transition:all .2s}' +
                '#chatbot-widget .chatbot-suggestions button:hover{background:' + cor + ';color:#fff}' +
                '#chatbot-widget .chatbot-input{display:flex;padding:.75rem;gap:.5rem;border-top:1px solid #eee;background:#fff}' +
                '#chatbot-widget .chatbot-input input{flex:1;border:2px solid #e0e0e0;border-radius:25px;padding:.7rem 1rem;font-size:.9rem;outline:none}' +
                '#chatbot-widget .chatbot-input input:focus{border-color:' + cor + '}' +
                '#chatbot-widget .chatbot-input button[type="submit"]{background:' + cor + ';color:#fff;border:none;width:44px;height:44px;border-radius:50%;cursor:pointer;font-size:1.1rem}' +
                '@media(max-width:500px){#chatbot-widget .chatbot-window{width:calc(100vw - 30px);height:65vh}}' +
                '@media(max-width:500px){#chatbot-widget{bottom:80px;right:12px}}' +
                '#chatbot-widget .chatbot-trigger{position:relative}';
            document.head.appendChild(s);
        },

        bindEvents: function () {
            var self = this;

            document.getElementById('chatbot-trigger').onclick = function (e) {
                e.preventDefault(); e.stopPropagation();
                self.toggle();
            };
            document.getElementById('chatbot-close').onclick = function (e) {
                e.preventDefault(); self.fechar();
            };
            document.getElementById('chatbot-form').onsubmit = function (e) {
                e.preventDefault(); self.enviarMensagem();
            };
            document.getElementById('chatbot-suggestions').onclick = function (e) {
                if (e.target.tagName === 'BUTTON') {
                    var msg = e.target.getAttribute('data-msg');
                    if (msg) self.processarMensagem(msg);
                }
            };

            // Detectar troca de idioma pelo portal
            window.addEventListener('storage', function (e) {
                if (e.key === 'sms-lang' || e.key === 'smsLang') self.atualizarIdioma();
            });
            // Fallback: observar mudança no botão de idioma do portal
            document.addEventListener('click', function (e) {
                if (e.target.classList.contains('lang-option') || e.target.classList.contains('sms-lang-opt')) {
                    setTimeout(function () { self.atualizarIdioma(); }, 100);
                }
            });
        },

        toggle:  function () { this.isOpen ? this.fechar() : this.abrir(); },

        abrir: function () {
            var w = document.getElementById('chatbot-window');
            var b = document.querySelector('#chatbot-widget .chatbot-badge');
            if (w) { w.classList.add('active'); this.isOpen = true; }
            if (b) b.style.display = 'none';
        },

        fechar: function () {
            var w = document.getElementById('chatbot-window');
            if (w) { w.classList.remove('active'); this.isOpen = false; }
        },

        enviarMensagem: function () {
            var input = document.getElementById('chatbot-input-field');
            if (!input) return;
            var msg = input.value.trim();
            if (!msg) return;
            this.processarMensagem(msg);
            input.value = '';
        },

        processarMensagem: function (msg) {
            var self = this;
            this.adicionarMensagem(msg, 'user');
            setTimeout(function () {
                self.adicionarMensagem(self.encontrarResposta(msg), 'bot');
            }, 400 + Math.random() * 400);
        },

        adicionarMensagem: function (texto, tipo) {
            var c = document.getElementById('chatbot-messages');
            if (!c) return;
            var m = document.createElement('div');
            m.className = 'chatbot-msg ' + tipo;
            m.textContent = texto;
            c.appendChild(m);
            c.scrollTop = c.scrollHeight;
        }
    };

    window.Chatbot = Chatbot;

    function init() {
        if (document.getElementById('chatbot-widget')) return;
        Chatbot.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    setTimeout(function () { if (!Chatbot.isInitialized) init(); }, 1500);
    setTimeout(function () { if (!Chatbot.isInitialized) init(); }, 3000);

})();
