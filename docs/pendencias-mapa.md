# Pendências do mapa turístico

Base auditada:

- `js/data/pontos-turisticos.js`
- `js/data/hospedagens.js`
- `js/data/restaurantes.js`
- `js/data/eventos.js`
- `js/data/informacoes-essenciais.js`

Critério da lista de coordenadas: entram apenas itens reais que deveriam poder virar marcador no mapa. Páginas estruturais, links institucionais, itens de navegação e rotas temáticas sem ponto único não entram como erro de localização.

## Pendentes de coordenadas

| Item | Tipo | Categoria atual | Coordenadas? | Imagem? | URL? | Ação recomendada |
| --- | --- | --- | --- | --- | --- | --- |
| Vapor Pery | Ponto turístico | História | Não | Sim | Sim | Confirmar local exato no projeto e cadastrar `lat/lng` confiáveis. |
| Hotel São Mateus | Hospedagem | Hospedagem | Não | Não | Sim | Confirmar localização exata do hotel e cadastrar coordenadas. |
| Hotel Nora | Hospedagem | Hospedagem | Não | Não | Sim | Confirmar localização exata do hotel e cadastrar coordenadas. |
| Hotel Dom Leopoldo | Hospedagem | Hospedagem | Não | Não | Sim | Confirmar localização exata do hotel e cadastrar coordenadas. |
| Pousadas Rurais | Hospedagem | Hospedagem | Não | Não | Sim | Definir ao menos uma referência geográfica ou separar por empreendimento. |
| Feira da Lua | Evento | Eventos | Não | Não | Sim | Confirmar ponto exato na Vila Pinheirinho e cadastrar coordenadas. |

## Itens informativos fora da lista de coordenadas

| Item | Tipo | Motivo |
| --- | --- | --- |
| Mapa Turístico | Serviço/navegação | Página estrutural; não representa marcador turístico próprio. |
| Roteiros | Serviço/navegação | Atalho de navegação; rotas devem ficar na seção de rotas temáticas sem ponto único. |
| Onde Ficar | Serviço/navegação | Atalho para hospedagem; não representa um empreendimento específico. |
| Previsão do Tempo | Serviço/utilitário | Informação de apoio ao visitante, sem ponto físico único. |
| Contato | Serviço/institucional | Link institucional; só deve virar marcador se houver endereço oficial confirmado. |

## Pendentes de imagem

| Item | Tipo | Categoria atual | Coordenadas? | Imagem? | URL? | Ação recomendada |
| --- | --- | --- | --- | --- | --- | --- |
| Hotel São Mateus | Hospedagem | Hospedagem | Não | Não | Sim | Adicionar imagem institucional ou foto do empreendimento já existente no projeto. |
| Hotel Nora | Hospedagem | Hospedagem | Não | Não | Sim | Adicionar imagem institucional ou foto do empreendimento já existente no projeto. |
| Hotel Dom Leopoldo | Hospedagem | Hospedagem | Não | Não | Sim | Adicionar imagem institucional ou foto do empreendimento já existente no projeto. |
| Pousadas Rurais | Hospedagem | Hospedagem | Não | Não | Sim | Definir imagem representativa segura sem inventar empreendimento específico. |
| Hotel Moro | Hospedagem | Hospedagem | Sim | Não | Sim | Adicionar imagem do empreendimento se ela já existir no acervo do portal. |
| Ancestral Gastronomia | Gastronomia | Gastronomia | Sim | Não | Sim | Adicionar foto do local ou do serviço quando houver arquivo interno confiável. |
| Marina Barra do Iguaçu | Gastronomia | Gastronomia | Sim | Não | Sim | Adicionar imagem do local ou da experiência náutica quando houver arquivo interno confiável. |
| Restaurante e Churrascaria Dallas | Gastronomia | Gastronomia | Sim | Não | Sim | Adicionar foto do local ou da operação quando houver arquivo interno confiável. |
| Parada Pinoli | Gastronomia | Gastronomia | Sim | Não | Sim | Adicionar foto da parada quando houver arquivo interno confiável. |
| AgroSamas | Evento | Eventos | Sim | Não | Sim | Associar imagem oficial do evento se ela já existir no projeto. |
| Feira Gastronômica | Evento | Eventos | Sim | Não | Sim | Usar imagem interna ligada à Rua do Mathe ou à feira, se existir. |
| Feira do Produtor | Evento | Eventos | Sim | Não | Sim | Usar imagem interna ligada à feira ou ao produtor local, se existir. |
| Roda de Mathe | Evento | Eventos | Sim | Não | Sim | Usar imagem interna do Chimarródromo ou do evento, se existir. |
| Feira da Lua | Evento | Eventos | Não | Não | Sim | Adicionar imagem quando houver arquivo interno confiável. |
| Mapa Turístico | Serviço | Serviços | Não | Não | Sim | Opcional; pode seguir com fallback visual. |
| Roteiros | Serviço | Roteiros | Não | Não | Sim | Opcional; pode seguir com fallback visual. |
| Onde Ficar | Serviço | Hospedagem | Não | Não | Sim | Opcional; pode seguir com fallback visual. |
| Previsão do Tempo | Serviço | Serviços | Não | Não | Sim | Opcional; pode seguir com fallback visual. |
| Contato | Serviço | Institucional | Não | Não | Sim | Opcional; pode seguir com fallback visual. |

## Pendentes de descrição

Sem pendências críticas nesta rodada. Todos os itens usados pelo mapa ficaram com descrição curta preenchida.

## Pendentes de URL

Sem pendências críticas de URL nesta rodada. Todos os itens usados pelo mapa ficaram com destino preenchido e sem âncora quebrada conhecida.

## Pendentes de revisão de categoria

| Item | Tipo | Categoria atual | Coordenadas? | Imagem? | URL? | Ação recomendada |
| --- | --- | --- | --- | --- | --- | --- |
| Igreja Centenária da Água Branca | Ponto turístico | Cultura | Sim | Sim | Sim | Confirmar se o posicionamento final deve ficar em `Cultura` ou `História` conforme curadoria do portal. |
| Chimarródromo | Ponto turístico | Cultura | Sim | Sim | Sim | Confirmar se o item deve permanecer em `Cultura` ou migrar para `Gastronomia` em futuras camadas. |
| Roteiros | Serviço | Roteiros | Não | Não | Sim | Definir no futuro se `Roteiros` terá camada própria ou seguirá tratado como serviço utilitário no mapa. |
| Contato | Serviço | Institucional | Não | Não | Sim | Definir se o item deve continuar como `Institucional` na base ou virar `Serviços` por consistência de navegação. |
