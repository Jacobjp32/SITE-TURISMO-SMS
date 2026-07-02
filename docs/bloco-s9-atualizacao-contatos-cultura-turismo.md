# Bloco S9 — Atualização de Contatos do Departamento de Cultura e Turismo

**Data:** 2026-07-02
**Escopo:** Atualização de conteúdo institucional (contatos) do Departamento de Cultura e Turismo em todo o site público.
**Sem commit** (conforme briefing). Não foram tocados: hero/vídeo, mapa 3D, painel admin, Firestore/Storage Rules, sitemap/canonical/URLs/Service Worker.

---

## 1. Dados oficiais usados (referência confirmada em print + página da Prefeitura)

| Campo | Valor oficial |
|---|---|
| Departamento | Departamento de Cultura e Turismo |
| Responsáveis | Mônica Zampier / Tamara Nadolny |
| Funcionamento | 08h00 às 12h00 e das 13h00 às 16h00 |
| Telefone geral / WhatsApp | (42) 3532-4163 — *Apenas WhatsApp* |
| E-mail (Turismo) | turismo@saomateusdosul.pr.gov.br |
| E-mail (Cultura / geral) | cultura@saomateusdosul.pr.gov.br |
| Endereço | Chalé do Produtor - Praça do Rio Iguaçu • São Mateus do Sul - PR |
| Instagram | https://www.instagram.com/depculturaeturismosms |
| Diretora de Turismo | Tamara Roemers de Oliveira Nadolny — (42) 3532-4163 (WhatsApp) — turismo@saomateusdosul.pr.gov.br |
| Diretora de Cultura | Mônica Zampier — (42) 3532-4163 (WhatsApp) — cultura@saomateusdosul.pr.gov.br |
| Departamento de Cultura (fixo) | (42) 3912-7084 — *Fixo para Ligação* — cultura@saomateusdosul.pr.gov.br |

---

## 2. Worktree
- No início: **sujo** (pendências do Bloco S8). O usuário **commitou** o S8 (`62fe034`).
- Reverificado: **worktree limpo** antes de iniciar o S9. ✅

---

## 3. Dados antigos encontrados (do Departamento)

| Dado antigo | Onde | Situação |
|---|---|---|
| Telefone placeholder `(42) 3532-0000` | index, footers, config, chatbot, chat-worker, reservas, translations, para-o-trade, onde-ficar, privacidade, portal-usuario, locais-data, sabores | Número falso (0000) |
| WhatsApp `554235320000` | js/reservas.js | Número falso |
| Endereço `Rua João Gabriel Martins s/n • CEP 83900-114` | index (contato), config, translations (PT/EN/ES/PL), privacidade | Endereço desatualizado do depto |
| Endereço `Rua Barão do Rio Branco, Centro • CEP 83900-000` | index (footer) | Endereço desatualizado do depto |
| Horário `Segunda a Sexta 8h-17h / Sábado 9h-13h` | index (contato), translations (4 idiomas), chatbot (4 idiomas) | Horário incorreto |
| Instagram `https://instagram.com/...` (sem www) | index, noticias, config | Padronizar para www |
| Subtítulo `Chalé da Cultura e Turismo/Produtor` | index + translations (4 idiomas) | Padronizar para "Chalé do Produtor" |

---

## 4. Dados atualizados (para os valores oficiais)

- **Telefone/WhatsApp:** `(42) 3532-4163` (e `tel:+554235324163`, WhatsApp `554235324163`).
- **Endereço:** `Chalé do Produtor - Praça do Rio Iguaçu • São Mateus do Sul - PR`.
- **Horário:** `Segunda a Sexta — 08h00 às 12h00 e das 13h00 às 16h00` (variações localizadas em EN/ES/PL).
- **Instagram:** `https://www.instagram.com/depculturaeturismosms`.
- **Subtítulo do chalé:** `Chalé do Produtor` (mesmo nome próprio nos 4 idiomas).
- **E-mails:** mantidos `turismo@` (contato geral do site de turismo) — já oficiais.

---

## 5. Arquivos alterados e onde cada dado foi atualizado

### HTML
- **index.html**
  - `visitor-info-service-desc`: telefone → 4163.
  - Card de contato: `tel:` + telefone exibido → 4163; endereço → Chalé do Produtor; horário → oficial; subtítulo → "Chalé do Produtor".
  - Instagram (redes sociais): `www` + `aria-label`.
  - Footer (links): `tel:` → 4163.
  - Footer (créditos): `footer-endereco` → Chalé; email `mailto:` mantido; `tel:` → 4163.
  - Mensagem de erro do formulário (JS inline): telefone → 4163.
- **para-o-trade.html** — bloco de contato (`tel:` + exibido) e footer → 4163.
- **onde-ficar.html** — 3 linhas "— Secretaria de Turismo" (`tel:` + exibido) → 4163 + rótulo "Departamento de Cultura e Turismo".
- **privacidade.html** — seção do controlador (endereço → Chalé; telefone → 4163 com `tel:`; email virou `mailto:`); footer `tel:` → 4163.
- **portal-usuario.html** — contato do COMTUR exibido → 4163. (Placeholders de `<input>` mantidos — são exemplos de formato, não contato real.)
- **noticias.html** — Instagram da sidebar: `www` + `aria-label`.
- **sabores.html** — mapa "sabores": `Chimarródromo Municipal` e `Feira do Produtor` (espaços do depto) → 4163.

### JS / Config / i18n
- **config.js** — `site.telefone` → 4163; `site.endereco` → Chalé; `redesSociais.instagram` → www.
- **translations.js** (PT/EN/ES/PL):
  - `visitor-info-service-desc` → 4163 (4 idiomas).
  - `footer-endereco` → Chalé (4 idiomas).
  - `contato-chale` → "Chalé do Produtor" (4 idiomas).
  - `contato-horario-texto` → horário oficial (4 idiomas, com localização).
- **js/chatbot.js** — todas as respostas com telefone → 4163 e horários → oficial (PT/EN/ES/PL).
- **cloudflare-worker/chat-worker.js** — telefone no prompt da IA → 4163 (4 blocos de idioma).
- **js/reservas.js** — `config.whatsapp` → `554235324163`.
- **js/locais-data.js** — telefone → 4163 nos locais geridos pelo Departamento (rua-do-mathe, praca-rio-iguacu, casa-memoria-padre-bauer, chimarrodromo, arena-cultural, natal-ouro-verde, miss-sao-mateus).

---

## 6. Links revisados
- **E-mails:** todos com `mailto:` (adicionado em privacidade.html onde faltava).
- **Telefone/WhatsApp:** mantido o padrão existente `tel:+554235324163` (formato seguro; não foram criados novos wa.me para evitar mudança de comportamento — ver Próxima etapa).
- **Instagram:** links clicáveis apontam para o perfil correto com `https://www.instagram.com/depculturaeturismosms`.
- Nenhum link quebrado introduzido (audit-links: 0 broken).

---

## 7. i18n
Sim. Atualizados em PT-BR, EN, ES e PL:
- `visitor-info-service-desc`, `footer-endereco`, `contato-chale`, `contato-horario-texto`.
- Nomes próprios, telefones e e-mails mantidos idênticos entre idiomas. "Chalé do Produtor" tratado como nome próprio do local (igual nos 4 idiomas).

---

## 8. Acessibilidade
- Links de e-mail/telefone com texto claro e visível.
- Instagram (index + noticias): adicionado `aria-label="Instagram do Departamento de Cultura e Turismo"` (ícone emoji sem texto).
- Sem links vazios introduzidos.

---

## 9. Validações executadas

```
node --check js/nav-shared.js      → OK
node --check js/site-meta.js       → OK
node --check translations.js       → OK
node --check config.js             → OK
node --check js/chatbot.js         → OK
node --check js/reservas.js        → OK
node --check js/locais-data.js     → OK
node --check cloudflare-worker/chat-worker.js → OK
```

### Audits
- `audit-links.mjs` → **662 links, 0 broken**, 1 falso positivo conhecido, 20 candidatos legados. Exit 0.
- `audit-assets.mjs` → 226 mídias, 0 duplicadas, 0 referências faltando. Exit 0.
- `audit-project.mjs` → 414 arquivos (36 html, 23 css, 46 js). Exit 0.

> Observação: `nav-shared.js` e `site-meta.js` não contêm dados de contato (apenas validados por exigência do checklist).

---

## 10. Itens deixados INTENCIONALMENTE fora de escopo

| Item | Local | Motivo |
|---|---|---|
| `(42) 3532-0000` em locais de terceiros | locais-data.js: igreja-matriz (paróquia), prefeitura-municipal e paco-municipal (@prefeiturasms), predio-historico, parque-exposicoes, ginasio-polacao | Não são o Departamento; número real desconhecido — não inventar. |
| `(42) 3532-0000` de produtores privados | sabores.html (Colônia Esperança, Sítio Moranguinho, Vinícola Wojcik, Queijaria Kowalski, Apiário) | Estabelecimentos privados; número não é do Departamento. |
| `(42) 3532-0000` como placeholder de `<input>` | portal-usuario.html (377, 421) | Exemplo de formato de digitação (UX), não contato. |
| `(42) 3532-0000` de restaurante | js/data/restaurantes.js:76 | Estabelecimento privado. |
| Depto de LGPD (Nicolas Addor, 3912-7026, João Gabriel Martins 435) | transparencia.html, privacidade.html | Outro departamento; dados corretos. |
| Renomear "Secretaria Municipal de Turismo" → "Departamento de Cultura e Turismo" | copyright/footers de várias páginas | Decisão de nomenclatura institucional; requer confirmação (ver riscos). |
| Responsáveis (Mônica/Tamara), diretoras e fixo (42) 3912-7084 | — | Não há slot existente na UI; adicionar seria novo conteúdo/redesign. Ver Próxima etapa. |

---

## 11. Riscos
- **Horário sem sábado:** o horário oficial não menciona sábado; a antiga menção "Sábado 9h-13h" foi removida por contradizer a fonte oficial. Se o atendimento de sábado ainda existir, reintroduzir.
- **CEP removido:** o endereço oficial padronizado não traz CEP; foi removido dos blocos do depto. Se necessário para fins legais (seção LGPD/controlador), reavaliar.
- **`tel:` para número "Apenas WhatsApp":** os links `tel:` continuam apontando para 3532-4163 (que é WhatsApp-only). Ligações de voz podem não completar. Opção: converter para `https://wa.me/554235324163` (há padrão WhatsApp em reservas.js) ou publicar o fixo (42) 3912-7084 para voz.
- **Nomenclatura inconsistente:** convivem "Secretaria Municipal de Turismo", "Secretaria Municipal de Cultura e Turismo" e "Departamento de Cultura e Turismo". Não alterado nesta rodada.
- **chat-worker.js** roda no Cloudflare (deploy separado): a mudança só reflete após novo deploy do worker.
- **config.js** parece não estar referenciado nas páginas públicas atuais; atualizado por consistência.
- Copyright do index.html ainda exibe © 2025 no HTML, mas o valor real renderizado vem de `translations.js` (© 2026) via `data-lang-key`.

---

## 12. Rollback
- Nada foi commitado. Para descartar tudo:
  - `git restore <arquivo>` para arquivos específicos, ou
  - `git checkout -- .` para reverter todo o working tree (cuidado: reverte também os relatórios de audit regenerados).
- Alterações limitadas a 13 arquivos de código + relatórios de audit regenerados em `docs/auditoria-output/`.

---

## 13. Validação manual recomendada
1. Home → seção "Contato": telefone (42) 3532-4163, endereço Chalé do Produtor, horário oficial, Instagram abre o perfil.
2. Trocar idioma (EN/ES/PL) e conferir endereço/horário no rodapé e no card.
3. Rodapé da home: e-mail (`mailto:`) e telefone (`tel:`).
4. /para-o-trade, /onde-ficar, /privacidade: telefones → 4163.
5. Chatbot: perguntar "contato", "telefone", "horário" (PT/EN/ES/PL).
6. Confirmar hero/vídeo intactos, sem mapa 3D, admin intacto.

---

## 14. Próxima etapa recomendada
1. **Confirmar** com o Departamento: (a) atendimento de sábado; (b) se deve exibir o fixo (42) 3912-7084 para ligações de voz.
2. **Adicionar seção "Responsáveis"** (Diretora de Turismo / Diretora de Cultura) com nomes e e-mails específicos (turismo@ e cultura@), caso desejado — é conteúdo novo, requer aprovação de layout.
3. Avaliar converter `tel:` do número WhatsApp-only para `https://wa.me/554235324163`.
4. Decidir padronização de nomenclatura (Secretaria vs Departamento) em copyrights/footers.
5. Opcional: atualizar telefones placeholder dos locais de terceiros quando os números reais forem fornecidos.
