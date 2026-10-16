# Auditoria do Painel Administrativo — outubro de 2026

**E — Relatório executivo.** Base auditada: `origin/main` `f0bf549`, em worktree isolada. Testes no Firebase Emulator com dados sintéticos. Nada foi alterado em código, dados reais, Rules ou produção.

| Documento | Conteúdo |
|---|---|
| [A — Diagnóstico técnico e funcional](A-diagnostico-tecnico-funcional.md) | Inventário, bugs com reprodução, segurança, dados, desempenho, créditos de imagem, testes |
| [B — UX e navegabilidade](B-ux-navegabilidade.md) | Navegação atual × proposta, jornadas, linguagem, acessibilidade, ganhos rápidos |
| [C — Matriz de funcionalidades](C-matriz-funcionalidades.md) | O que existe, o que falta e o que não vale a pena |
| [D — Backlog priorizado](D-backlog-priorizado.md) | Rodadas 0 a 5, com dependências |
| [anexos/](anexos/) | Relatórios completos de cada frente, com arquivo e linha |
| [evidencias/](evidencias/) | Capturas do painel renderizado e logs dos testes |

---

## 1. Qual é o estado real do painel?

É um painel **funcional e bem-intencionado, com uma base técnica melhor do que a experiência de uso deixa transparecer**. As 15 telas existem e quase todas funcionam. A tela inicial ("O que precisa da sua atenção") é genuinamente útil. O backend de segurança é sólido.

Mas convivem dois sistemas (o script inline antigo de 4.029 linhas e os módulos novos), cada módulo fala um vocabulário diferente para "publicado", e há três pontos onde o servidor pode perder trabalho ou tirar conteúdo do ar sem perceber. Falta também uma tela para os pedidos de **reserva**, que hoje são coletados com dados pessoais sem que ninguém os leia no painel.

## 2. Ele funciona corretamente?

**Na maior parte, sim.** As suítes automatizadas passam: 492 testes de Rules (421 Firestore + 71 Storage; 532 contando as suítes de rotas e mídia do mesmo script), 48 testes ponta a ponta admin → portal, 5 do importador e 13 suítes unitárias. As duas falhas encontradas são de quebra de linha no Windows, não do produto.

**Bugs confirmados no navegador:**
- **Edições não salvas somem** ao trocar de menu, sem aviso.
- **Escolher imagem da Biblioteca no editor de Evento não faz nada** (erro de sintaxe nos handlers).
- **Notícias e banners com caminho de imagem/link relativo não podem ser salvos.**
- **Editar um empreendimento publicado o tira do ar durante o salvamento** (risco de desenho, confirmado). A falha que o deixou fora do portal só foi reproduzida com um listener aberto pela própria instrumentação; em uso normal os salvamentos observados concluíram (6 de 6). O risco é que qualquer interrupção no meio deixe o item fora, como no incidente real do Artur Biergarten (10/09).

Confirmado no código: o importador da Prefeitura altera notícias **publicadas** enquanto informa que "nada vai ao ar".

## 3. É seguro, dentro da cobertura testada?

**Sim, no código.** Nenhuma vulnerabilidade P0/P1 foi confirmada:
- As Rules exigem administrador ativo a cada operação e impedem autoelevação.
- Rascunhos de notícias e a biblioteca de mídia são privados.
- O Storage aceita apenas imagens.
- O painel escapa HTML de forma consistente.
- Não há segredos no repositório.

**Ressalva principal: não sei o que está em produção.** Há 7 commits de Rules depois do último deploy registrado (13/08). Os testes provam as Rules do Git, não as implantadas.

**Riscos médios confirmados:**
- Rascunhos de **eventos** são legíveis publicamente.
- A pasta de imagens do CMS pode ser **listada** publicamente.
- O autocadastro de usuário aceita um e-mail forjado.
- Não há verificação de e-mail.
- MFA dos administradores não confirmado.
- A CSP é permissiva.
- O GitHub Pages ignora os headers de segurança.

## 4. É fácil de utilizar?

**Para quem já conhece, razoavelmente. Para um servidor novo, não.**

O painel usa termos de banco de dados ("draft", "slug canônico", UIDs, "Firestore Rules", "Veja o console"). Também usa nomes diferentes para a mesma situação, e "Aprovar" significa três coisas distintas. O formulário de empreendimento tem 52 campos e abre abaixo de uma lista de 67 itens. Eventos e Notícias não têm busca.

Na acessibilidade, os modais de edição não recebem foco nem fecham com Esc, e o anel de foco é quase invisível.

## 5. Está organizado adequadamente?

**Parcialmente.** O menu segue as coleções do banco, não as tarefas. Um empreendimento passa por quatro telas (Aprovações, Pedidos de vínculo, Vínculos ativos, Empreendimentos), e as imagens ficam em quatro lugares sem ligação. A proposta reduz o menu de 15 para 8 itens organizados por assunto (Início, Agenda, Notícias, Lugares e negócios, Roteiros, Fotos, Avisos e campanhas, Administração). Ela pode ser feita só nos rótulos, sem refazer telas.

## 6. Quais funcionalidades importantes faltam?

Em ordem de valor:
1. Proteção contra perda de edição.
2. Busca e filtro em Eventos e Notícias.
3. Alerta de item fora do ar.
4. Uma biblioteca de fotos única, com autor e licença. Ela resolve também a divergência de créditos entre o CMS e `js/image-attribution.js`, que hoje cobre 6 de 130 imagens de empreendimentos e sobrescreve em silêncio o crédito digitado no painel.
5. Tela de reservas (ou retirar a página).
6. Histórico com autor legível.
7. Botão "Abrir no portal".
8. Despublicação automática de eventos encerrados.

**Não recomendo agora:** edição em lote, fluxo editorial em várias etapas, versionamento completo e reescrita em framework.

## 7. Quais são os principais riscos?

1. **Rules e functions de produção possivelmente atrás do Git** (não verificável daqui).
2. **Conteúdo publicado saindo do ar sem que ninguém perceba**: o desenho de edição de empreendimentos e banners passa por "fora do ar".
3. **Perda de trabalho** do servidor (navegação, sessão de 2 h).
4. **Divergência silenciosa sobre o que está publicado**: quatro regras diferentes de "evento publicado" entre home, agenda, mapa e painel; importador alterando notícias no ar.
5. **Dados pessoais de reservas coletados sem gestão.**
6. **Créditos de imagem com duas fontes de verdade** (risco de atribuição incorreta de obras de terceiros).

## 8. O que corrigir primeiro?

1. **Rodada 0:** comparar, só leitura, as Rules e functions implantadas com o Git, e conferir MFA e App Check no console.
2. **Empreendimento publicado não pode sair do ar por falha de salvamento.** Primeiro uma correção de leitura e mensagem; depois uma transação única.
3. **Guarda de alterações não salvas** e aviso antes do logout.
4. **Importador da Prefeitura**: atualização de publicada vira revisão.
5. **Correções pequenas e certeiras**: handlers da capa de evento, campos `type="url"` e botões de publicar que gravam o estado em vez de invertê-lo.
6. **Uma regra única de "evento publicado"**; depois, fechar a leitura pública dos rascunhos de eventos (bloco de Rules com autorização).
7. **Decisão sobre Reservas.**

## 9. Como deveria ser a próxima etapa?

Fazer a **Rodada 1 e a Rodada 2 do [backlog](D-backlog-priorizado.md) em microblocos**, como o projeto já trabalha, cada um com teste no Emulator. Junto, criar **os primeiros testes de interface do painel**: nenhum dos quatro bugs confirmados no navegador seria pego pelas suítes atuais.

Em seguida, uma rodada de **linguagem e acessibilidade** (glossário, mensagens, modais, contraste, busca), que é barata e muda muito a experiência do iniciante. A reorganização do menu e a biblioteca de fotos única ficam para depois, quando o comportamento estiver confiável.

---

## Método e limites

- **4 frentes paralelas de leitura de código:** arquitetura e bugs, segurança, dados e desempenho, UX. Os relatórios completos estão em [anexos/](anexos/).
- **Testes executados:** 15 suítes Node e 3 suítes no Emulator.
- **Uso do painel renderizado** (desktop e celular) com conta de teste do seed, apenas no Emulator.
- **Verificações cruzadas:** os dois achados mais graves das frentes de código (perda de edição e empreendimento fora do ar) foram reproduzidos no navegador. A causa do falso conflito foi isolada por instrumentação. Nos testes sem interferência, o salvamento funcionou 4 de 4 vezes; com um listener ativo no documento (aberto pela instrumentação, não pelo painel), falhou 4 de 4. A falha é, portanto, **induzida**; o que está confirmado é o risco de desenho.
- **Não testado:**
  - produção;
  - upload real ao Storage;
  - a function do importador;
  - expiração real de sessão;
  - leitor de tela;
  - Firefox/Safari;
  - rede lenta;
  - dois administradores simultâneos de verdade;
  - `npm audit`, que exigiria rede e as dependências das functions instaladas.
- **Itens "apenas no código"** estão marcados como tal nos relatórios e não devem ser lidos como validados.
