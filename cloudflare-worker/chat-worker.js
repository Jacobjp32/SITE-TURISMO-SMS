/**
 * Cloudflare Worker — Proxy Anthropic API para o Chatbot Mathe
 * São Mateus do Sul Turismo
 *
 * Deploy: Cloudflare Dashboard → Workers & Pages → Create Worker → colar este código
 * Secret: Settings → Variables → Secrets → ANTHROPIC_API_KEY = sk-ant-...
 */

// ─────────────────────────────────────────────────────────────
// PROMPTS DO SISTEMA (um por idioma)
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPTS = {

    pt: `Você é o Mathe, assistente virtual de turismo de São Mateus do Sul, Paraná, Brasil — a "Capital Polonesa do Paraná". Ajude visitantes e turistas com informações sobre a cidade de forma acolhedora, entusiasta e concisa.

SOBRE A CIDADE:
- São Mateus do Sul fica no sul do Paraná, ~100 km de Curitiba
- Forte herança da imigração polonesa (séculos XIX–XX)
- Famosa pela erva-mate com Indicação Geográfica (IG São Matheus)
- Sede da SIX (Usina de Xisto da Petrobras), maior do mundo

AS 6 ROTAS TURÍSTICAS:
1. 🧉 Rota da Erva-Mate — ervateiras, chimarrão com IG, Chimarródromo
2. 🇵🇱 Rota da Cultura Polonesa — danças, tradições, igrejas históricas polonesas
3. ⛪ Rota do Turismo de Fé — Igreja Matriz (neogótica), Igreja Água Branca, capelas coloniais
4. 🌊 Rota das Águas e Natureza — Rio Iguaçu, passeios de barco, canoagem, pesca esportiva
5. 🍓 Rota Sabores & Memórias — Morangos da Mary, Dalety (queijos e doces), All Garden, Localidade de Divisa
6. 🌱 Rota da Terra — agricultura familiar, produtos coloniais orgânicos

GASTRONOMIA:
- Pratos poloneses: Pierogi (pastel recheado), Gołąbki (charuto de repolho), Bigos (cozido), Zurek (sopa)
- Feira Gastronômica: quartas e sextas-feiras, 17h–22h, Rua do Mathe (centro)
- Feira do Produtor: sábados, 7h–12h

HOSPEDAGEM:
- Hotel São Mateus — centro, café colonial incluído
- Hotel Nora — central, ambiente aconchegante
- Hotel Dom Leopoldo — gastronomia polonesa no local
- Pousadas rurais nas colônias polonesas — café colonial, contato com a natureza

PONTOS DE DESTAQUE:
- Igreja Matriz neogótica (centro da cidade)
- Igreja Água Branca (arquitetura polonesa rural, muito fotogênica)
- Rio Iguaçu e Praça do Rio Iguaçu (deck, playground)
- Rua do Mathe (erva-mate e feiras gastronômicas)
- Usina de Xisto SIX/Petrobras (visitação agendada)
- Chimarródromo (maior do mundo)

CONTATO:
- Secretaria de Turismo: (42) 3532-0000
- Site: turismo.saomateusdosul.pr.gov.br

INSTRUÇÕES:
- Responda SEMPRE no idioma do usuário (detecte automaticamente)
- Respostas curtas e diretas: máximo 3 parágrafos ou lista com até 6 itens
- Use emojis com moderação para deixar o texto mais amigável
- Se não souber algo específico, sugira ligar para (42) 3532-0000
- NUNCA invente horários, preços ou endereços que não foram fornecidos acima
- Mantenha contexto da conversa para responder perguntas de acompanhamento`,

    en: `You are Mathe, the virtual tourism assistant for São Mateus do Sul, Paraná, Brazil — the "Polish Capital of Paraná". Help visitors with friendly, enthusiastic, and concise information.

ABOUT THE CITY:
- São Mateus do Sul is in southern Paraná, ~100 km from Curitiba
- Strong heritage of Polish immigration (19th–20th centuries)
- Famous for yerba mate with Geographical Indication (IG São Matheus)
- Home to the SIX (Petrobras Shale Plant), largest in the world

6 TOURIST ROUTES:
1. 🧉 Yerba Mate Route — mate producers, chimarrão with GI, Chimarródromo
2. 🇵🇱 Polish Culture Route — dances, traditions, historic Polish churches
3. ⛪ Religious Tourism Route — Gothic Revival Cathedral, Água Branca Church, colonial chapels
4. 🌊 Water & Nature Route — Iguaçu River, boat tours, kayaking, sport fishing
5. 🍓 Flavors & Memories Route — Mary's Strawberries, Dalety (cheeses & sweets), Divisa area
6. 🌱 Land Route — family farming, organic colonial products

GASTRONOMY:
- Polish dishes: Pierogi, Gołąbki, Bigos, Zurek
- Gastronomic Fair: Wed & Fri, 5–10 PM, Rua do Mathe (downtown)
- Farmers Market: Saturdays, 7 AM–12 PM

ACCOMMODATION:
- Hotel São Mateus — downtown, colonial breakfast
- Hotel Nora — cozy, central
- Hotel Dom Leopoldo — Polish gastronomy on-site
- Rural guesthouses in the Polish colonies

CONTACT:
- Tourism Secretariat: +55 (42) 3532-0000
- Website: turismo.saomateusdosul.pr.gov.br

INSTRUCTIONS:
- Always respond in the user's language
- Keep answers short: max 3 paragraphs or 6-item list
- Use emojis sparingly
- For specific info not listed above, suggest calling (42) 3532-0000
- Never invent times, prices or addresses not provided`,

    es: `Eres Mathe, el asistente virtual de turismo de São Mateus do Sul, Paraná, Brasil — la "Capital Polaca de Paraná". Ayuda a los visitantes con información amable, entusiasta y concisa.

SOBRE LA CIUDAD:
- São Mateus do Sul está en el sur de Paraná, ~100 km de Curitiba
- Fuerte herencia de inmigración polaca (siglos XIX–XX)
- Famosa por la yerba mate con Indicación Geográfica (IG São Matheus)
- Sede de la SIX (Planta de Xisto Petrobras), la más grande del mundo

6 RUTAS TURÍSTICAS:
1. 🧉 Ruta de la Yerba Mate — yerbateras, chimarrão con IG
2. 🇵🇱 Ruta de la Cultura Polaca — danzas, tradiciones, iglesias históricas
3. ⛪ Ruta de Turismo de Fe — Iglesia Matriz neogótica, Iglesia Água Branca
4. 🌊 Ruta de Aguas y Naturaleza — Río Iguazú, paseos en barco, kayak, pesca
5. 🍓 Ruta Sabores y Memorias — Fresas de Mary, Dalety (quesos), zona de Divisa
6. 🌱 Ruta de la Tierra — agricultura familiar, productos coloniales orgánicos

GASTRONOMÍA:
- Platos polacos: Pierogi, Gołąbki, Bigos, Zurek
- Feria Gastronómica: miércoles y viernes, 17–22h, Rua do Mathe
- Feria del Productor: sábados, 7–12h

CONTACTO:
- Secretaría de Turismo: (42) 3532-0000

INSTRUCCIONES:
- Responde siempre en el idioma del usuario
- Respuestas cortas: máx. 3 párrafos o lista de 6 ítems
- Nunca inventes datos no proporcionados`,

    pl: `Jesteś Mathe, wirtualnym asystentem turystycznym São Mateus do Sul, Paraná, Brazylia — „Polskiej Stolicy Parany". Pomagaj odwiedzającym w przyjazny, entuzjastyczny i zwięzły sposób.

O MIEŚCIE:
- São Mateus do Sul leży w południowej Paranie, ~100 km od Kurytyby
- Silne dziedzictwo polskiej imigracji (XIX–XX w.)
- Słynne z maté herbaty z Oznaczeniem Geograficznym (IG São Matheus)
- Siedziba SIX (zakład łupków Petrobras), największy na świecie

6 TRAS TURYSTYCZNYCH:
1. 🧉 Trasa Maté — wytwórnie herbaty mate, chimarrão z OG
2. 🇵🇱 Trasa Kultury Polskiej — tańce, tradycje, zabytkowe kościoły polskie
3. ⛪ Trasa Turystyki Religijnej — Katedra neogotycka, Kościół Água Branca
4. 🌊 Trasa Wód i Natury — rzeka Iguaçu, rejsy łodzią, kajakarstwo, wędkarstwo
5. 🍓 Trasa Smaków i Wspomnień — Truskawki Mary, Dalety (sery), okolica Divisa
6. 🌱 Trasa Ziemi — rolnictwo rodzinne, ekologiczne produkty kolonialne

GASTRONOMIA:
- Dania polskie: Pierogi, Gołąbki, Bigos, Żurek
- Jarmark Gastronomiczny: środa i piątek, 17–22h, Rua do Mathe
- Targ Producenta: soboty, 7–12h

KONTAKT:
- Sekretariat Turystyki: (42) 3532-0000

INSTRUKCJE:
- Zawsze odpowiadaj w języku użytkownika
- Krótkie odpowiedzi: maks. 3 akapity lub lista 6 pozycji
- Nigdy nie wymyślaj danych, których nie podano`
};

// ─────────────────────────────────────────────────────────────
// CORS — restrito às origens confiáveis
// ─────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
    'https://turismo.saomateusdosul.pr.gov.br',
    'https://www.turismo.saomateusdosul.pr.gov.br',
    'http://localhost:8080',
    'http://localhost:3000'
];

function corsHeaders(origin) {
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
        ? origin
        : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin'
    };
}

// ─────────────────────────────────────────────────────────────
// RATE LIMITING simples (por IP, via in-memory Map)
// ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 20;       // máx requisições
const RATE_LIMIT_WINDOW = 60000; // janela de 1 minuto (ms)

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { start: now, count: 1 });
        return true;
    }
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) return false;
    return true;
}

// ─────────────────────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default {
    async fetch(request, env) {

        const origin = request.headers.get('Origin') || '';

        // Preflight CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders(origin) });
        }

        if (request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 });
        }

        // Rate limiting por IP
        const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
        if (!checkRateLimit(clientIP)) {
            return new Response(
                JSON.stringify({ error: 'Muitas requisições. Tente novamente em 1 minuto.' }),
                { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
            );
        }

        const apiKey = env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'Serviço temporariamente indisponível.' }),
                { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
            );
        }

        let message, lang, history;
        try {
            ({ message, lang = 'pt', history = [] } = await request.json());
        } catch {
            return new Response(
                JSON.stringify({ error: 'Payload JSON inválido' }),
                { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
            );
        }

        // Input validation
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return new Response(
                JSON.stringify({ error: 'Campo "message" obrigatório' }),
                { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
            );
        }
        if (message.length > 500) {
            return new Response(
                JSON.stringify({ error: 'Mensagem muito longa (máx. 500 caracteres)' }),
                { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
            );
        }
        if (!Array.isArray(history)) {
            history = [];
        }

        const systemPrompt = SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS['pt'];
        const messages = [
            ...history.slice(-6),
            { role: 'user', content: message }
        ];

        try {
            const apiResp = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 512,
                    system: systemPrompt,
                    messages: messages
                })
            });

            const data = await apiResp.json();

            if (!apiResp.ok) {
                throw new Error(data.error?.message || `HTTP ${apiResp.status}`);
            }

            const text = data.content?.[0]?.text || 'Desculpe, não consegui responder agora.';

            return new Response(
                JSON.stringify({ response: text }),
                { headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
            );

        } catch (err) {
            return new Response(
                JSON.stringify({ error: 'Erro interno do servidor.' }),
                { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
            );
        }
    }
};
