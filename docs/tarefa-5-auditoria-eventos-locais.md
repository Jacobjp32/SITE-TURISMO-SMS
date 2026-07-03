# Tarefa 5 — Auditoria de conexões entre eventos e locais

Data: 2026-07-03
Escopo: conexões públicas entre eventos, fichas `local.html`, mapa turístico e experiências. Sem deploy, sem commit, sem dependências, sem admin/cadastro/Firebase restrito.

## 1. Arquivos alterados

- `eventos.html` — passou a exibir `Abrir ficha` no modal público somente quando o local do evento bate com vínculo confirmado neste relatório ou quando um evento aprovado trouxer id de local confirmado.
- `js/data/eventos.js` — adicionados `localId` e `localUrl` apenas nos eventos turísticos do mapa com vínculo confirmado por ficha existente.
- `js/mapa-turistico.js` — o mapa agora reconhece `localId`/`localUrl` como fonte segura para mostrar `Abrir ficha`, validando o id contra `window.locaisData`.
- `docs/tarefa-5-auditoria-eventos-locais.md` — este relatório curado da auditoria.

## 2. Fontes de dados de eventos encontradas

- `eventos-2026.json`: agenda anual estática usada por `eventos.html` e pela home como base de próximos eventos.
- `eventos_aprovados` no Firestore: eventos aprovados lidos publicamente por `eventos.html`, pela home e pelo mapa, com fallback para fontes estáticas quando Firebase/App Check falha.
- `js/data/eventos.js`: oito eventos/experiências usados no snapshot público do mapa e busca.
- `js/data/turismo-data.js`: consolida `TURISMO_EVENTOS` com pontos, rotas, hospedagens, restaurantes e serviços.

## 3. Como a home funciona

A seção "Acontece em breve" em `index.html` busca `eventos-2026.json`, renderiza os próximos quatro eventos futuros válidos e depois tenta mesclar `eventos_aprovados`. Se o Firebase falhar, mantém a agenda estática. Os cards levam ao calendário completo, exceto quando um evento aprovado já trouxer `mapUrl`/`mapaUrl`.

## 4. Como `eventos.html` funciona

`eventos.html` carrega a agenda estática, normaliza eventos aprovados do Firestore, mescla por id/assinatura, ordena por data/hora e renderiza lista, destaques, calendário e modal. A página não cria eventos e não depende de Firebase para funcionar.

## 5. Como os eventos funcionam no mapa

O mapa consome `js/data/eventos.js` dentro de `TURISMO_DATA`, cria cards/markers para eventos com coordenadas válidas e sinaliza itens sem coordenada na lista de pendências. Eventos aprovados do Firebase podem aparecer como relacionados em fichas do mapa quando há vínculo seguro por id/nome exato.

## 6. Vínculos evento-local confirmados

Confirmados na agenda estática por nome exato do campo `local` com ficha existente:

| Local do evento | Ficha confirmada |
| --- | --- |
| Rua do Mathe | `/local?id=rua-do-mathe` |
| Igreja Matriz São Mateus | `/local?id=igreja-matriz` |
| Parque de Exposições | `/local?id=parque-exposicoes` |

Confirmados em `js/data/eventos.js`:

| Evento | Relação segura |
| --- | --- |
| AgroSamas | local confirmado: Parque de Exposições |
| Natal Ouro Verde | ficha/experiência existente: `natal-ouro-verde` |
| Polskie Smaki | local confirmado: Rua do Mathe |
| Miss São Mateus do Sul | ficha/experiência existente: `miss-sao-mateus` |
| Feira Gastronômica | local confirmado: Rua do Mathe |
| Feira do Produtor | local confirmado: Rua do Mathe |
| Roda de Mathe | local confirmado: Chimarródromo |

## 7. Melhorias seguras aplicadas

- O modal de `eventos.html` agora mostra `Abrir ficha` apenas para os vínculos confirmados nesta auditoria.
- O CTA `Como chegar` ficou restrito ao mapa/fichas, onde as coordenadas já existem no dataset carregado.
- Eventos com local vazio ou "A confirmar" exibem "Local a confirmar".
- Imagem de evento no modal ganhou `loading`, `decoding`, `width` e `height`.
- O mapa passou a aceitar `localId`/`localUrl` validados contra `locaisData`, sem transformar qualquer texto de evento em link automaticamente.

## 8. O que não foi alterado

- Não alterei fluxos de aprovação, admin, Firebase rules, cadastro ou áreas restritas.
- Não criei eventos, datas, horários, organizadores, imagens, telefones, endereços ou coordenadas.
- Não forcei vínculo para locais genéricos, comunidades, salões, igrejas sem ficha exata ou nomes ambíguos.
- Não alterei o design aprovado da home.
- Não reintroduzi chatbox/cuia.

## 9. Dados que precisam confirmação humana

Os seguintes locais da agenda aparecem sem ficha exata confirmada e não receberam CTA de ficha/mapa: `ACIASMS`, `Adolescentro`, `Angelita Casa de Carnes`, `Ao lado do CEPOM`, `Arroio da Cruz`, `Capela do Monjolos`, `CDL`, `Centro da Cidade`, `Centro do Idoso`, `CEPOM`, `Club Ideal São-Mateuense`, `Colônia Iguaçu`, `Diversas igrejas`, `Igreja da Água Branca`, comunidades rurais, salões paroquiais/comunitários, `São Mateus do Sul`, `Rua do Mathe / Praça do Rio Iguaçu` e demais locais com nome diferente das fichas atuais.

Esses casos devem ser validados editorialmente antes de receber `localId`, coordenadas ou link de mapa.

## 10. Schema.org Event

Não foi adicionado JSON-LD de `Event`. A agenda mistura dados estáticos recorrentes, eventos aprovados dinamicamente e vários locais sem endereço/coordenada/organizador completos. Adicionar schema agora exigiria inferências ou marcação incompleta, o que foi evitado.

## 11. Testes e checagens planejados

Após a alteração, executar:

- `node --check js/nav-shared.js`
- `node --check translations.js`
- `node --check js/season-theme.js`
- `node --check js/mapa-turistico.js`
- `node --check js/locais-data.js`
- `node scripts/audit-tourism-data.mjs`
- `node scripts/audit-links.mjs`
- `node scripts/audit-assets.mjs`
- `node scripts/audit-project.mjs`
- `git diff --check`

## 12. Riscos e próximos passos

- Eventos aprovados no Firebase só receberão ficha no mapa/agenda se trouxerem id compatível com `locaisData` ou nome de local exatamente igual a uma ficha existente.
- Alguns locais provavelmente têm correspondência real, mas não foram vinculados por segurança porque o nome não bate exatamente ou não há ficha pública.
- Próximo passo recomendado: curadoria humana criar uma tabela oficial `evento -> localId` para os locais frequentes, sem alterar aprovação/admin nesta etapa.
