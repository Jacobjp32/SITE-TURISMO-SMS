# Resultados dos testes — Rodada 1 (16/10/2026, commit `4989a46`)

Os logs brutos (`*.log`) ficam nesta pasta apenas localmente (ignorados pelo `.gitignore`).

| Comando | Resultado |
|---|---|
| `npm run test:rules` | rotas 29/29 · mídia 11/11 · **Firestore Rules 432/432** · **Storage Rules 73/73** |
| `npm run test:admin-public-e2e` | **55/55** |
| `npm run test:prefeitura-news:emulator` | 5/5 |
| `npm run test:admin-ui` | **6/6** (7 execuções seguidas sem falha após a correção da corrida de login) |
| `node --test` nos 35 arquivos unitários | **473/473** |

Medições adicionais no navegador (Emulator, dados sintéticos):

| Cenário | Antes | Depois |
|---|---|---|
| Salvar empreendimento publicado com listener `onSnapshot` aberto no documento | 0 de 4 concluídos (na auditoria); item ficava em `draft` (fora do ar) | 3 de 3 concluídos; listener só viu `published` |
| Salvar com leituras concorrentes (≈ 30 leituras durante o salvamento) | falso conflito no 2º grupo | concluído; todas as leituras `published` |
| Dois administradores (sessões autenticadas separadas) | — | edição de B preservada; A avisado; item seguiu publicado |
| Login logo após abrir a página | 2 de 3 execuções caíam com "sessão expirou" | 7 de 7 sem queda |

Sondagem anônima da produção (somente leitura, contagens e nomes de campos):

| Alvo | Resultado |
|---|---|
| `eventos_aprovados` (listagem sem login) | permitida; 12 documentos, todos `publicado: false`, com campos `ownerEmail` (10), `submittedByEmail` (10), `ownerName` (10), `submittedByName` (10), `phone` (12), `whatsapp` (12), `ownerUid` (10), `submittedBy` (10) |
| `noticias`, `media_library`, `reservas`, `usuarios`, `cms_establishments`, `banners`, `gallery_items` (listagem sem login) | negada (403) |
| `cms-media/` (listagem de Storage sem login) | permitida; pasta de um usuário com 14 arquivos |
