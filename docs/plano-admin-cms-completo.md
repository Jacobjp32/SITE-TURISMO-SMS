# Plano — Admin CMS completo do Portal de Turismo

> Rodada **somente de análise e planejamento**. Nenhum código foi alterado, nada foi
> commitado, e nenhuma regra (Firestore/Storage), auth, role ou rota foi tocada.
> Documento gerado em 2026-06-25 a partir de inspeção arquitetural do projeto.

Publicação pública: arquivos estáticos HTML/CSS/JS no repositório GitHub, com dados
dinâmicos via Firebase (Firestore + Storage) quando necessário.

Documentos relacionados já existentes (não duplicar, cruzar referência):
`docs/estrutura-dados.md`, `docs/atualizacao-empreendimentos.md`,
`docs/plano-portal-cadastros.md`, `docs/plano-vinculo-empreendimentos.md`,
`docs/plano-firestore-storage-rules.md`, `docs/seasonal-assets.md`,
`docs/mapa-turistico.md`, `docs/pendencias-mapa.md`.

---

## 0. Estado do worktree no início

Worktree **não estava limpo** ao iniciar. Pendências (não alteradas por esta rodada):

- Deletados (não staged): `css/index.css`, `translations.js`, 7 PDFs/DOCX em
  `docs/comtur/`, ~10 imagens em `images/WEBP/`.
- Untracked: `images/empreendimentos/ervateira rei verde/`.
- Observação: `css/index.css` e `translations.js` aparecem como *deleted* no git mas
  os arquivos físicos existem em disco com data de hoje (provável recriação após
  remoção). Resolver/validar antes de qualquer commit futuro. **Não** usar
  `git reset`/`git restore` sem decisão explícita.

---

## 1. Diagnóstico do painel admin atual

### 1.1 Arquivos e responsabilidades

| Arquivo | Papel |
| --- | --- |
| `admin-firebase.html` (127 KB) | Shell do painel: sidebar, seções, dashboard, tabelas inline, lógica de aprovações/vínculos/usuários embutida em `<script>` no próprio HTML |
| `js/firebase-auth.js` (1645 linhas) | Camada de negócio: auth, roles, eventos (pendentes/aprovados), estabelecimentos, claims, managers, update-requests, stats |
| `js/admin-content-cms.js` (1421 linhas) | CMS de conteúdo: eventos aprovados, notícias, biblioteca de mídia (CRUD + upload + uso) |

### 1.2 Módulos hoje (sidebar `admin-firebase.html`)

`Dashboard (home)` · `Aprovações` · `Solicitações de vínculo` · `Gerenciar Vínculos`
· `Usuários` · `Eventos` · `Notícias` · `Mídia`

### 1.3 Funções que JÁ existem (sólidas)

- **Auth/roles**: `user` / `moderator` / `admin`, com `ativo != false`.
  `isAdmin()` / `isModerator()` no cliente e espelhados nas rules.
- **Aprovações de eventos**: fluxo `eventos_pendentes` → `eventos_aprovados`
  (approve/reject, com `reviewedBy`, `reviewNotes`).
- **Vínculos de empreendimento**: `establishment_claims` → `establishment_managers`,
  com criação/edição/desativação/reativação e deduplicação por doc id determinístico.
- **Update requests** (`establishment_update_requests`): lojista propõe alteração de
  campos do próprio empreendimento; admin revisa (approved/rejected/changes_requested).
- **CMS de eventos** (`admin-content-cms.js`): editar, publicar/despublicar, destacar,
  duplicar, prévia, capa (URL / upload / biblioteca), galeria com fallback.
- **CMS de notícias**: CRUD + importação de notícias estáticas de `noticias.html`.
- **Biblioteca de mídia** (`media_library`): upload p/ `cms-media/{uid}/`, edição,
  cópia de URL, mapa de uso (eventos/notícias), exclusão com aviso se em uso.
- **Usuários**: listar, mudar role, ativar/desativar.
- **Stats** no dashboard: usuários, eventos pendentes/aprovados, estabelecimentos.

### 1.4 Funções incompletas / limitações

- **Sem CRUD de empreendimentos**: o conteúdo dos empreendimentos vive em JS estático
  (`js/rotas-data.js`, `js/locais-data.js`, `js/data/*.js`). O admin só gerencia
  *vínculos* e *update-requests*, não cria/edita o cadastro-fonte. Editar um
  empreendimento ainda exige Codex/Claude no código.
- **Sem módulo de Banners/Pop-ups**: campanhas como AgroSamas dependem de flag manual
  em `config.js` (`CONFIG.agrosamas.bannerAtivo`) + dismissal por `localStorage`.
- **Sem Configurações do site editáveis**: `config.js` (telefones, redes, banner, feature
  flags) é arquivo de código.
- **Sem controle de Sazonal/Clima pelo admin**: `js/season-theme.js` resolve estação por
  `localStorage`/data; intensidade e assets são hardcoded no manifest interno.
- **Sem Rotas/Galeria editáveis**: rotas em `js/data/rotas.js` + `js/rotas-data.js`;
  galeria em `galeria.html`.
- **Biblioteca de mídia limitada**: só imagem (JPG/PNG/WEBP até 5 MB). Sem vídeo, sem
  URL externa de vídeo, sem categorização por uso, sem filtros, sem detecção de “pesada”
  além do tamanho, sem vínculo formal além de eventos/notícias.
- **Sem logs/auditoria central**: há `updatedBy`/`reviewedBy` por documento, mas nenhuma
  coleção de auditoria consultável.
- **Acoplamento**: muita lógica de UI e de dados está inline em `admin-firebase.html`
  (strings HTML concatenadas com `onclick="..."`), e `admin-content-cms.js` mistura
  data-access, render e validação no mesmo objeto. Dificulta adicionar módulos novos.

### 1.5 Permissões atuais (resumo)

- **Escrita de conteúdo público** (`noticias`, `media_library`): `isAdmin()`.
- **Eventos/estabelecimentos aprovados, claims, managers, update-requests**:
  `isModerator()` (admin OU moderator).
- **Gestão de usuários/roles**: `isAdmin()`.
- **Storage `cms-media/{uid}`**: escrita só `isAdmin()` e `uid == auth.uid`.

> Não há ainda distinção formal “admin master” vs “admin comum” — `admin` é o topo.
> Um eventual “master” pode ser modelado depois sem mexer em rules nesta fase
> (ex.: campo `role` adicional ou flag), mas está **fora** do escopo desta rodada.

---

## 2. Arquitetura recomendada

### 2.1 Princípios

1. **Static-first com fallback**: o site público continua servindo HTML/CSS/JS do
   GitHub. Firestore vira *fonte editável opcional*. Toda página lê Firestore primeiro
   e cai para o JS estático se Firestore falhar/estiver vazio. Nunca quebrar offline.
2. **Modularização do admin**: extrair cada módulo para `js/admin/<modulo>.js` com um
   contrato comum (`load`, `render`, `openModal`, `save`, `remove`), registrados num
   roteador leve. `admin-firebase.html` vira só shell + navegação.
3. **Camada de leitura pública unificada**: um `js/content-store.js` que cada página usa
   para buscar “coleção X com fallback estático Y”, com cache e timeout curto.
4. **Sem rules nesta fase**: o desenho abaixo lista as collections/paths necessários,
   mas a habilitação real depende de uma rodada futura específica de rules.

### 2.2 Forma dos módulos novos (contrato sugerido)

```
window.AdminModule.register({
  id: 'empreendimentos',
  label: 'Empreendimentos',
  icon: '🏪',
  collection: 'empreendimentos',
  permission: 'admin',            // ou 'moderator'
  load(), render(container), openModal(id), save(form), remove(id)
});
```

O shell apenas itera os módulos registrados para montar a sidebar e as seções —
adicionar módulo = adicionar 1 arquivo, sem editar o HTML gigante.

---

## 3. Módulos necessários para o Admin completo

Legenda — Complexidade: B(aixa)/M(édia)/A(lta). Prioridade: P1 (fundação) … P4 (futuro).

### 3.1 Dashboard master
- **Objetivo**: visão geral + atalhos + saúde do conteúdo (pendências, mídia órfã, banners ativos, rascunhos).
- **Campos**: nenhum (agrega outras collections).
- **Collection**: — (lê várias). **Storage**: —. **Permissão**: admin.
- **Telas/ações**: cards de contagem, lista de pendências, “mídia sem uso”, “banners ativos hoje”.
- **Riscos**: leituras múltiplas → custo. **Complexidade**: B. **Prioridade**: P1.

### 3.2 Banners / Pop-ups
- **Objetivo**: campanhas (Caminhada dos Tropeiros, Miss Paraná, Família Acolhedora, futuras).
- **Campos**: `titulo`, `descricao`, `imagem`(url/storage), `cta`(texto+link), `tipo`(banner|popup),
  `paginas`(lista de rotas/“home”/“todas”), `prioridade`(int), `dataInicio`, `dataFim`,
  `frequencia`(sempre|sessao|dia), `umaVezPorSessao`(bool), `status`(rascunho|publicado),
  `posicao`(topo|hero|rodapé|modal), `criadoEm/atualizadoEm/atualizadoPor`.
- **Collection**: `banners`. **Storage**: `cms-media/{uid}/...` (reaproveita).
- **Permissão**: admin (write), leitura pública.
- **Telas/ações**: lista, criar/editar, preview no admin, publicar/despublicar, agendar.
- **Riscos**: pop-up intrusivo; conflito de prioridade; cache. **Complexidade**: M. **Prioridade**: P1/P2.

### 3.3 Biblioteca de Mídia (evolução)
- **Objetivo**: repositório único de imagens/vídeos/URLs reutilizável por todos os módulos.
- **Campos** (estende `media_library`): `title`, `url`, `tipo`(imagem|video|url_externa),
  `uso`(galeria|video|empreendimento|noticia|evento|banner|popup|sazonal|mascote),
  `categoria`, `alt`, `storagePath`, `contentType`, `size`, `width/height`, `vinculos`(lista
  de refs), `createdAt/updatedAt/updatedBy`.
- **Collection**: `media_library`. **Storage**: `cms-media/{uid}/...` (+ subpasta por tipo).
- **Permissão**: admin (write), leitura pública.
- **Telas/ações**: grade com filtro por tipo/uso, “não utilizada”, “pesada”, preview,
  editar, excluir com proteção se em uso.
- **Riscos**: exclusão de mídia em uso; vídeos grandes; custo de Storage. **Complexidade**: M/A. **Prioridade**: P2.

### 3.4 Empreendimentos (CRUD — o módulo mais estratégico)
- **Objetivo**: tornar o cadastro-fonte editável pelo admin, hoje preso em JS estático.
- **Campos**: `nome`, `slug`, `categoria`, `rotaRelacionada`, `tags[]`, `descricaoCurta`,
  `descricaoCompleta`, `telefone`, `whatsapp`, `instagram`, `site`, `endereco`, `localidade`,
  `coordenadas{lat,lng}`, `googleMapsUrl`, `horario`, `imagemPrincipal`, `galeria[]`,
  `status`(publicado|rascunho|oculto), `destaque`(bool), `pendenciaLocalizacao`(bool),
  `legacySource`/`legacyId` (rastro de migração).
- **Collection**: `empreendimentos`. **Storage**: `cms-media/{uid}/...`.
- **Permissão**: admin (write); leitura pública.
- **Telas/ações**: lista filtrável, criar/editar, definir coordenadas (mapa), publicar,
  destacar, marcar pendência. **Riscos**: quebrar mapa/rotas; divergência com legado;
  slugs duplicados. **Complexidade**: A. **Prioridade**: P2/P3 (núcleo do projeto).

### 3.5 Eventos (consolidar)
- **Objetivo**: já existe; unificar com a UI modular e adicionar recorrência/períodos.
- **Collection**: `eventos_aprovados` (+ `eventos_pendentes`). **Storage**: `cms-media/`.
- **Permissão**: moderator. **Complexidade**: B (já pronto). **Prioridade**: P1 (migrar de inline para módulo).

### 3.6 Notícias (consolidar)
- **Collection**: `noticias`. **Permissão**: admin. **Complexidade**: B. **Prioridade**: P1.

### 3.7 Rotas
- **Objetivo**: editar rotas temáticas (hoje `js/data/rotas.js` + `rotas-data.js`).
- **Campos**: `id`, `nome`, `categoria`, `descricao`, `cor`, `icone`, `url`, `tags[]`,
  `empreendimentos[]`(refs), `status`. **Collection**: `rotas`. **Permissão**: admin.
- **Riscos**: integra com mapa. **Complexidade**: M. **Prioridade**: P3.

### 3.8 Galeria
- **Objetivo**: gerir `galeria.html` por dados.
- **Campos**: `titulo`, `imagem`(ref mídia), `categoria`, `ordem`, `status`.
- **Collection**: `galeria`. **Permissão**: admin. **Complexidade**: B. **Prioridade**: P3.

### 3.9 Configurações do site
- **Objetivo**: mover `config.js` editável (telefones, redes, e-mail, feature flags, banner legacy).
- **Campos**: documento único com mapas `site`, `redesSociais`, `funcionalidades`, etc.
- **Collection**: `site_config` (doc `geral`). **Permissão**: admin (master).
- **Riscos**: chaves sensíveis (Maps/Firebase) NÃO migram — ficam em código. **Complexidade**: M. **Prioridade**: P2.

### 3.10 Aparência sazonal / clima
- **Objetivo**: admin define estação publicada, intensidade e assets por estação/clima.
- **Campos**: `modo`(auto|fixo), `estacaoFixa`, `intensidade`(discreta|media|destaque),
  `assets`{por estação}, `assetsClima`, `publicado`(bool).
- **Collection**: `site_config` (doc `seasonal`). **Storage**: `images/seasonal/...` (estático) ou `cms-media/`.
- **Permissão**: admin. **Complexidade**: M. **Prioridade**: P4.

### 3.11 Mascote interativo
- **Objetivo**: mascote flutuante (público) + assistente (admin), com estados por página.
- **Campos**: `ativo`(bool), `intensidade`(discreta|media|destaque), `asset`(ref), `tipo`(png|webp|lottie|css),
  `mensagensPorPagina`{rota→balão}, `acoes`[]. **Collection**: `site_config` (doc `mascote`).
- **Permissão**: admin. **Complexidade**: M/A. **Prioridade**: P4.

### 3.12 Usuários / vínculos (consolidar)
- **Collections**: `usuarios`, `establishment_claims`, `establishment_managers`,
  `establishment_update_requests`. **Permissão**: admin/moderator. **Complexidade**: B (já pronto). **Prioridade**: P1.

### 3.13 Logs / auditoria
- **Objetivo**: registrar quem mudou o quê (publicação indevida, exclusões).
- **Campos**: `acao`, `entidade`, `entidadeId`, `usuarioUid`, `usuarioEmail`, `diffResumo`, `criadoEm`.
- **Collection**: `audit_logs` (append-only). **Permissão**: leitura admin; escrita pelo app no momento da ação.
- **Riscos**: volume/custo; precisa de rules específicas (fase futura). **Complexidade**: M. **Prioridade**: P3.

---

## 4. Collections Firestore propostas

| Collection | Existe? | Leitura | Escrita (alvo) | Observação |
| --- | --- | --- | --- | --- |
| `usuarios` | ✅ | self/admin | admin | — |
| `eventos_pendentes` | ✅ | owner/mod | regras de criação | — |
| `eventos_aprovados` | ✅ | pública | moderator | — |
| `estabelecimentos_pendentes` | ✅ | owner/mod | criação | — |
| `estabelecimentos_aprovados` | ✅ | pública | moderator | — |
| `establishment_claims` | ✅ | owner/mod | criação restrita | — |
| `establishment_managers` | ✅ | owner/mod | moderator | — |
| `establishment_update_requests` | ✅ | owner/mod | criação restrita | — |
| `noticias` | ✅ | pública | admin | — |
| `media_library` | ✅ | pública | admin | estender campos |
| `reservas` | ✅ | admin | criação restrita | — |
| `empreendimentos` | 🆕 | pública | admin | fonte editável (migração) |
| `banners` | 🆕 | pública | admin | campanhas/pop-ups |
| `rotas` | 🆕 | pública | admin | rotas temáticas |
| `galeria` | 🆕 | pública | admin | galeria por dados |
| `site_config` | 🆕 | pública | admin | docs: `geral`, `seasonal`, `mascote` |
| `audit_logs` | 🆕 | admin | app na ação | append-only |

> **Importante**: a criação real das novas collections funciona em runtime, mas a
> **escrita** depende de regras Firestore que hoje terminam em `allow read, write: if false`
> (catch-all). Habilitar `empreendimentos`, `banners`, `rotas`, `galeria`, `site_config`,
> `audit_logs` exige uma rodada futura de rules — **fora do escopo desta análise**.

---

## 5. Storage paths propostos

| Path | Existe? | Uso |
| --- | --- | --- |
| `cms-media/{uid}/{fileName}` | ✅ | mídia do CMS (imagens) — admin write |
| `submissions/events/{uid}/...` | ✅ | uploads de eventos pendentes |
| `submissions/establishments/{uid}/...` | ✅ | uploads de estabelecimentos |
| `submissions/establishment-updates/{uid}/...` | ✅ | uploads de update-requests |
| `cms-media/{uid}/empreendimentos/...` | 🆕(subpasta) | imagens de empreendimentos |
| `cms-media/{uid}/banners/...` | 🆕(subpasta) | imagens de campanhas |
| `cms-media/{uid}/video/...` | 🆕 | vídeos (avaliar limite/custo) |

Assets sazonais e do mascote podem permanecer **estáticos** em `images/seasonal/` e
`images/` (servidos pelo GitHub), com o admin apenas escolhendo qual usar — evita custo
de Storage e mantém o fallback sem 404 já implementado em `season-theme.js`.

> Storage rules atuais só permitem `image/(jpeg|jpg|png|webp)` até 5 MB. Vídeo e novas
> subpastas exigem rules futuras — **fora do escopo**.

---

## 6. Estratégia de migração sem quebrar fallback

Padrão para **todo** conteúdo migrável (empreendimentos, rotas, galeria, banners, config):

1. **Manter o JS estático como fallback** (`js/rotas-data.js`, `js/locais-data.js`,
   `js/data/*.js`, `config.js`). Nada é removido.
2. **Criar a collection Firestore como fonte editável** com os mesmos campos + `legacyId`.
3. **Camada de leitura pública** (`js/content-store.js`): cada página tenta Firestore
   (timeout curto, ex. 3–5 s) e, em falha/vazio, usa o snapshot estático. Deduplicar por
   `slug`/`legacyId` quando ambos existirem (Firestore vence).
4. **Seed inicial** via importador no admin (como `importStaticNews` já faz para
   notícias): ler `window.ROTAS_LEGADO_ESTABLISHMENTS` / `window.locaisData` e gravar em
   `empreendimentos` sem sobrescrever o que já existe.
5. **Mapa/rotas intactos**: `mapa-turistico.js` continua lendo `window.TURISMO_DATA`. A
   migração só acrescenta uma etapa que *mescla* itens do Firestore no snapshot antes do
   render (mesma lógica de `turismo-data-adapter.js`). Itens sem `lat/lng` permanecem
   válidos para busca/lista, sem marcador (comportamento atual preservado).
6. **Migração gradual por categoria**, validando o mapa a cada passo
   (`docs/pendencias-mapa.md` como checklist).

Resultado: o site nunca depende exclusivamente do Firestore; admin passa a editar; Codex/
Claude saem do caminho para conteúdo.

---

## 7. Proposta — Banners / Pop-ups

Substituir o padrão atual (`CONFIG.agrosamas.bannerAtivo` + `localStorage`) por
collection `banners` administrável.

**Modelo de documento (`banners/{id}`):**
```
{
  id, titulo, descricao,
  imagem: { url, storagePath, alt },
  cta: { texto, link },
  tipo: 'banner' | 'popup',
  posicao: 'topo' | 'hero' | 'rodape' | 'modal',
  paginas: ['home'] | ['todas'] | ['/eventos.html', ...],
  prioridade: 0..100,
  dataInicio, dataFim,            // janela de exibição
  frequencia: 'sempre' | 'sessao' | 'dia',
  umaVezPorSessao: bool,
  status: 'rascunho' | 'publicado',
  criadoEm, atualizadoEm, atualizadoPor
}
```

**Exibição pública** (`js/banners.js`, novo): na carga da página, busca banners
`status=publicado` cuja janela `dataInicio..dataFim` cubra hoje e cujo `paginas` inclua a
rota atual; ordena por `prioridade`; respeita `umaVezPorSessao` via `sessionStorage`.
Fallback: se Firestore indisponível, nenhum banner é forçado (ou usa o flag legacy do
`config.js` enquanto a migração não termina).

**Admin**: lista com status/janela, criar/editar, **preview** (render do banner/pop-up
no modal), publicar/despublicar, agendar. Imagens pela Biblioteca de Mídia.

Campanhas-alvo imediatas: Caminhada dos Tropeiros, Miss Paraná, Família Acolhedora,
AgroSamas (migrar do `config.js`).

---

## 8. Proposta — Biblioteca de Mídia

Evoluir `media_library` + `admin-content-cms.js` (módulo `loadMedia`):

- **Tipos**: imagem (upload), vídeo (upload — avaliar custo, ou só URL), URL externa
  (YouTube/Vimeo/imagem hospedada).
- **Metadados de uso**: campo `uso` (galeria/video/empreendimento/noticia/evento/banner/
  popup/sazonal/mascote) + `categoria` + `alt` + `width/height` + `size`.
- **Vínculos**: lista `vinculos: [{tipo, id}]` mantida ao usar a mídia (hoje o uso é
  *inferido* só de eventos/notícias por `buildMediaUsageMap`). Manter a inferência como
  complemento.
- **Filtros**: por tipo, por uso, “não utilizada” (sem vínculo e sem inferência),
  “pesada” (`size` acima de limite, ex. > 1 MB).
- **Ações**: preview, editar, excluir **com proteção** se em uso (já existe aviso; tornar
  bloqueio configurável).
- **Reuso**: todos os módulos (banners, empreendimentos, galeria, sazonal) selecionam
  mídia daqui em vez de colar URLs soltas.

---

## 9. Proposta — Empreendimentos

**Distribuição hoje** (confirmado na inspeção):
- `js/rotas-data.js` → `window.ROTAS_LEGADO_ESTABLISHMENTS` (+ `ROTAS_LEGADO_ROUTE_INFO`):
  base mais rica (telefone, social, site, horário, mapsUrl, coordStatus) — ~48 registros.
- `js/locais-data.js` → `window.locaisData`: base de páginas de local — ~15 registros.
- `js/data/*.js` → arrays curados (`TURISMO_*`) consumidos pelo mapa via
  `turismo-data-adapter.js` (merge + dedup) em `window.TURISMO_DATA`.
- `js/establishment-catalog.js`: deriva o catálogo “reivindicável” para os vínculos.
- Consumo: `mapa-turistico.js` (mapa principal), `local.html` (`/local?id=...`),
  `sabores.html`, rotas.

**CRUD proposto** (collection `empreendimentos`) — campos no item 3.4. Estratégia de
migração no item 6. Pontos de atenção específicos:

- `slug` único e estável; gerar de `nome` (helper `makeSlug` já existe em
  `admin-content-cms.js`).
- `coordenadas{lat,lng}` opcionais (null permitido) — preserva comportamento do mapa.
- `pendenciaLocalizacao` para alimentar `docs/pendencias-mapa.md`.
- `legacyId`/`legacySource` para dedup contra `ROTAS_LEGADO_ESTABLISHMENTS`/`locaisData`.
- Integrar com o seletor de vínculos (`establishment-catalog.js`) para que claims passem a
  apontar para IDs de `empreendimentos` quando existirem.

---

## 10. Proposta — Menus e URLs

**Achados:**
- Os menus **Explore** e **Sabores** colapsam quase tudo em `/mapa-turistico.html` com
  query strings: `?grupo=pontos-turisticos`, `?grupo=roteiros`, `?categoria=Gastronomia`,
  `?categoria=Hospedagem`, etc. Vários itens apontam para o **mesmo destino**
  (ex.: “Pontos Turísticos”, “Roteiros” e “Experiências” → `grupo=roteiros`;
  “Gastronomia Polonesa”, “Restaurantes”, “Produtos Locais” → `categoria=Gastronomia`).
- “Informações Essenciais” aponta para a âncora **em inglês** `#visitor-guide-title`.
- URLs com `.html` (`mapa-turistico.html`, `eventos.html`, ...) convivem com pastas
  homônimas (`eventos/`, `noticias/`, `sabores/`, `local/`, `rotas-completas/`) — provável
  estrutura de pretty-URL com `index.html`.
- Fluxo `/local?id=...` (extensionless) para páginas de local.
- `rotas-completas.html` marcado como **URL legada** (mapa é a página oficial).

**Plano (sem remover nada sem validação):**
1. **Menu mais enxuto**: agrupar itens que vão ao mesmo destino; transformar duplicados em
   filtros visuais dentro do mapa, não itens de menu separados.
2. **URLs canônicas em PT-BR**: padronizar destinos (`/mapa-turistico` sem `.html` quando a
   pasta `index.html` permitir) e trocar âncoras em inglês por PT-BR
   (`#guia-do-visitante`), **mantendo redireciono/aliás** do ID antigo.
3. **Compatibilidade**: manter `?grupo=`/`?categoria=` atuais funcionando; manter
   `rotas-completas.html` como alias.
4. **Sitemap/links internos**: atualizar `sitemap.xml`, `robots.txt`, `_headers`, links no
   `index.html`, footer e `nav-shared.js` de forma coordenada.
5. **SEO**: qualquer rename precisa de `<link rel="canonical">` e, se possível, redirect
   301 no nível de hospedagem (GitHub Pages tem limitação — avaliar `404.html`/JS).
6. **NÃO remover** sem validar: páginas/pastas duplicadas, âncoras usadas por traduções
   (`translations.js`/`data-lang-key`), `rotas-completas`, `mapa-3d`/`mapa-completo`.

---

## 11. Proposta — Mascote interativo

Base já existente: `season-theme.js` monta `[data-season-mascot]` (hero/map/nav) e um
`season-ambient` com efeitos; assets resolvidos por manifest com `null`-fallback (sem 404).

**Viabilidade/desenho (sem implementar):**
- **Público**: mascote flutuante reaproveitando o slot sazonal; estados por página via
  mapa `rota → mensagem/balão`; balões contextuais (ex.: “Veja os eventos deste mês”).
- **Admin**: assistente leve com dicas por seção (ex.: “este empreendimento está em
  rascunho”). Reusa o mesmo componente.
- **Controle**: doc `site_config/mascote` com `ativo`, `intensidade`
  (discreta|media|destaque), `tipo` (PNG/WebP animado, CSS, Lottie), `asset` (ref mídia),
  `mensagensPorPagina`.
- **Tecnologia**: começar com WebP/PNG + CSS (leve, sem dependência); Lottie só se a arte
  exigir animação rica (custo de lib). Respeitar `prefers-reduced-motion` (já tratado).
- **Fallback**: se asset ausente, manter emoji/CSS atual — padrão já implementado.

---

## 12. Proposta — Sazonal e clima

Estado atual: `season-theme.js` (auto por data em `America/Sao_Paulo` ou manual via
`localStorage`) + `weather.js` (Open-Meteo, dispara `sms:weatherchange`). Assets por role
(`mascot`/`headerBadge`/`heroAccent`/`sticker`/`weatherIcon`) com fallback CSS sem 404.
Efeitos (`sunGlow`/`leafDrift`/`mateSteam`/`sproutBloom`) ainda fixos e tímidos.

**Plano (admin-driven, doc `site_config/seasonal`):**
- `modo` (auto|fixo) + `estacaoFixa` publicável pelo admin (sobrepõe o automático).
- `intensidade` (discreta|media|destaque) → controla densidade/opacidade dos efeitos via
  `data-season-intensity` no `<html>` e CSS.
- `assets` por estação e `assetsClima` (ex.: chuva/neve/sol) referenciando a Biblioteca de
  Mídia ou `images/seasonal/` — **só caminhos que existem fisicamente** (regra de ouro do
  `seasonal-assets.md`) para manter zero-404.
- `publicado` (bool) — admin liga/desliga sem deploy.
- Leitura pública: `season-theme.js` passa a hidratar de `window.SMS_SEASON_ASSETS` +
  config do Firestore quando presente; sem Firestore, mantém o manifest interno atual.

---

## 13. Segurança e regras (análise, sem alterar)

- **Collections novas** (`empreendimentos`, `banners`, `rotas`, `galeria`, `site_config`,
  `audit_logs`) hoje caem no catch-all `allow read, write: if false` — **não graváveis**
  até uma rodada futura de rules. Planejar: leitura pública + escrita `isAdmin()` (e
  `isModerator()` onde fizer sentido), com `keys().hasOnly([...])` e limites de tamanho,
  no mesmo estilo já usado em `establishment_update_requests`.
- **Riscos de upload**: vídeo/Storage maior que 5 MB e novos contentTypes precisam de
  Storage rules; hoje só imagem ≤ 5 MB é aceita. Manter validação no cliente
  (`validateImageFile`/`validateImageUrl`) como primeira barreira.
- **Publicação indevida**: todo conteúdo público novo precisa de `status`
  (rascunho/publicado) + janela de datas (banners) para evitar exposição acidental.
- **Validações no cliente**: campos obrigatórios (`nome`, `slug`/`titulo`, `dataInicio<
  dataFim`), sanitização (já há `clean`/`cleanLong`/`sanitizeSimpleText`).
- **Logs/auditoria**: registrar create/update/delete e mudanças de status em `audit_logs`
  com `usuarioUid`/`usuarioEmail` (rules append-only na fase de regras).
- **NÃO mexer** nesta rodada: Firestore Rules, Storage Rules, auth, roles, claims.

---

## 14. Roadmap em blocos

> Para cada bloco: objetivo · arquivos prováveis · collections · mexe em rules? · riscos ·
> validações · ordem · executor sugerido.

### Bloco 1 — Estrutura base do Admin CMS (fundação)
- **Objetivo**: roteador modular do admin; extrair Eventos/Notícias/Mídia/Usuários/Vínculos
  do HTML inline para módulos `js/admin/*.js`. Sem novo conteúdo, só arquitetura.
- **Arquivos**: `admin-firebase.html`, novo `js/admin/core.js` + `js/admin/<modulo>.js`,
  refator de `js/admin-content-cms.js`.
- **Collections**: as já existentes. **Rules**: **não**.
- **Riscos**: regressão no painel atual. **Validações**: paridade funcional com hoje.
- **Ordem**: 1º. **Executor**: **Claude Code** (refator amplo, sensível).

### Bloco 2 — Banners / Pop-ups
- **Objetivo**: módulo admin + render público + migrar AgroSamas.
- **Arquivos**: `js/admin/banners.js`, novo `js/banners.js`, ajuste em `config.js`/`index.html`.
- **Collections**: `banners` 🆕. **Rules**: **sim (fase futura)** para gravar.
- **Riscos**: pop-up intrusivo, cache. **Validações**: janela de datas, preview, sessão.
- **Ordem**: 2º. **Executor**: **Codex** (CRUD padrão) com rules por **Claude**.

### Bloco 3 — Biblioteca de Mídia (evolução)
- **Objetivo**: tipos (vídeo/URL), filtros, uso, proteção de exclusão.
- **Arquivos**: `js/admin-content-cms.js` (módulo mídia) → `js/admin/midia.js`.
- **Collections**: `media_library` (estender). **Rules**: só se permitir vídeo/novos paths.
- **Riscos**: exclusão de mídia em uso, custo Storage. **Validações**: vínculos, tamanho.
- **Ordem**: 3º. **Executor**: **Codex** (UI/CRUD); revisão **Claude**.

### Bloco 4 — CRUD de Empreendimentos
- **Objetivo**: fonte editável + seed do legado + leitura com fallback no site público.
- **Arquivos**: `js/admin/empreendimentos.js`, novo `js/content-store.js`, integração em
  `mapa-turistico.js`, `local.html`, `turismo-data-adapter.js`.
- **Collections**: `empreendimentos` 🆕. **Rules**: **sim (fase futura)**.
- **Riscos**: quebrar mapa/rotas, dedup com legado, slugs. **Validações**: paridade do mapa,
  `docs/pendencias-mapa.md`, fallback estático.
- **Ordem**: 4º. **Executor**: **Claude Code** (integração com mapa é delicada).

### Bloco 5 — Menus e URLs limpas
- **Objetivo**: enxugar menus, canonizar URLs PT-BR, manter compatibilidade e SEO.
- **Arquivos**: `index.html`, `nav-shared.js`, `sitemap.xml`, `robots.txt`, `_headers`,
  `404.html`, páginas afetadas, `translations.js` (âncoras).
- **Collections**: — . **Rules**: **não**.
- **Riscos**: SEO, links quebrados, traduções. **Validações**: redirects/canonical, busca
  por links internos, sitemap.
- **Ordem**: 5º (independente, pode paralelo). **Executor**: **Claude Code** (risco SEO/links).

### Bloco 6 — Mascote e Sazonal/Clima
- **Objetivo**: tornar mascote e sazonal configuráveis pelo admin; intensidade.
- **Arquivos**: `js/season-theme.js`, novo `js/admin/aparencia.js`, `images/seasonal/*`,
  CSS sazonal.
- **Collections**: `site_config` (`seasonal`,`mascote`) 🆕. **Rules**: **sim (fase futura)**.
- **Riscos**: 404 de assets, performance/motion. **Validações**: zero-404, reduced-motion,
  fallback CSS.
- **Ordem**: 6º. **Executor**: **Codex** (config UI) + **Claude** (integração season-theme).

### Bloco 7 — Migração gradual para Firestore
- **Objetivo**: ligar leitura pública Firestore-first com fallback para Rotas/Galeria/
  Config/Empreendimentos; seeds; auditoria.
- **Arquivos**: `js/content-store.js`, `js/data/*`, `config.js`, módulos admin, `audit_logs`.
- **Collections**: `rotas`, `galeria`, `site_config`, `audit_logs` 🆕. **Rules**: **sim**.
- **Riscos**: divergência fonte dupla, custo de leitura. **Validações**: fallback, dedup,
  smoke test por página.
- **Ordem**: 7º (incremental, acompanha blocos 2–6). **Executor**: **Claude Code**.

### Bloco 8 — Validação final
- **Objetivo**: QA ponta a ponta, performance, acessibilidade, SEO, offline/SW.
- **Arquivos**: `sw.js`, `docs/qa-*`, checklists.
- **Collections**: todas. **Rules**: revisão final (fase de regras).
- **Riscos**: cache do Service Worker servindo versões antigas. **Validações**: matriz de
  testes por papel (anônimo/lojista/moderator/admin).
- **Ordem**: 8º. **Executor**: **Claude Code** (auditoria) + revisão humana.

---

## 15. Blocos para **Claude Code**

- **Bloco 1** (refator modular do admin — amplo e sensível).
- **Bloco 4** (empreendimentos ↔ mapa/rotas — integração delicada).
- **Bloco 5** (menus/URLs — risco de SEO e links/traduções).
- **Bloco 7** (migração Firestore-first com fallback — arquitetura transversal).
- **Bloco 8** (validação final/auditoria).
- **Todas as rules** (Firestore/Storage), quando a fase de regras for autorizada.

## 16. Blocos que podem ir para **Codex**

- **Bloco 2** (CRUD de Banners — padrão, baixo acoplamento) — rules ficam com Claude.
- **Bloco 3** (UI/CRUD da Biblioteca de Mídia) — revisão por Claude.
- **Bloco 6** parte de UI de configuração (aparência) — integração com `season-theme.js`
  fica com Claude.
- Tarefas isoladas de formulário/listagem/preview dentro de módulos já desenhados.

> Regra geral: **Codex** para CRUD/UI repetitivo dentro de um contrato já definido;
> **Claude Code** para refator transversal, integração com mapa/rotas, URLs/SEO, fallback
> e qualquer coisa que toque rules/segurança.

---

## 17. Riscos transversais

1. **Fonte dupla** (estático + Firestore) divergir — mitigar com dedup por `slug`/`legacyId`
   e Firestore vencendo.
2. **Quebrar o mapa/rotas** ao migrar empreendimentos — validar a cada categoria.
3. **Catch-all das rules**: collections novas não gravam até a fase de regras — planejar a
   ordem para não “entregar” admin sem persistência.
4. **Service Worker** (`sw.js`) servindo HTML/JS antigo após deploy — versionar cache.
5. **Publicação indevida** sem `status`/janela de datas — exigir rascunho por padrão.
6. **SEO** em renomeação de URLs — canonical + aliases + sitemap.
7. **Custo Firebase** (leituras no dashboard, vídeos no Storage) — cache e limites.
8. **Worktree sujo atual** — resolver pendências antes de iniciar implementação.

---

## 18. Próximos passos

1. **Validar este plano** e priorizar blocos (sugerido: 1 → 2 → 3 → 4, com 5 em paralelo).
2. **Resolver o worktree** (decidir sobre `css/index.css`, `translations.js`, deletados de
   `docs/comtur/` e `images/WEBP/`, e a pasta untracked de empreendimento).
3. **Rodada de regras** dedicada (Firestore + Storage) para habilitar as collections novas
   — pré-requisito de persistência dos blocos 2, 4, 6, 7. (Autorização explícita à parte.)
4. **Começar pelo Bloco 1** (fundação modular) sem novo conteúdo, garantindo paridade.
5. **Definir “admin master”** vs admin comum, se desejado (modelagem futura, sem rules agora).

> Lembrete: nada foi implementado, commitado ou alterado nesta rodada.
