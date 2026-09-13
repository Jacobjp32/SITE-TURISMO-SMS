# SECURITY-HARDENING-02A — Manifesto de campos públicos

## Escopo

Este manifesto descreve exclusivamente a projeção executada ao aprovar documentos
de `eventos_pendentes` e `estabelecimentos_pendentes`. Os documentos privados são
mantidos nas filas com o estado de revisão; as collections aprovadas recebem apenas
os campos abaixo. A reconciliação de documentos históricos não faz parte deste bloco.

## Eventos

| Campo | Público? | Origem | Destino | Razão |
| --- | --- | --- | --- | --- |
| `id` | Sim | ID real do documento pendente | `eventos_aprovados/{id}.id` | Identidade pública e deduplicação; não aceita `/`, controles ou IDs reservados. |
| `title`, `nome` | Sim | Primeiro valor de `title`/`nome` | aliases públicos homônimos | Título consumido pela Home, agenda, mapa e Admin editorial. |
| `description`, `descricao` | Sim | Primeiro valor dos aliases | aliases públicos homônimos | Descrição editorial do evento. |
| `date`, `data`, `dataInicio`, `dataFim` | Sim | Datas declaradas na solicitação | aliases públicos correspondentes | Agenda e ordenação temporal. |
| `time`, `hora`, `horaInicio`, `horaFim` | Sim | Horários declarados | aliases públicos correspondentes | Exibição do horário e compatibilidade legacy. |
| `location`, `local` | Sim | Local público declarado | aliases públicos homônimos | Exibição do local. |
| `organizer` | Sim | Organizador público declarado | `organizer` | Crédito organizacional; não deriva de `ownerName`. |
| `category`, `categoria` | Sim | Categoria declarada | aliases públicos homônimos | Filtro e badge editorial. |
| `entrada`, `value`, `valor` | Sim | Informação pública de ingresso/valor | aliases públicos correspondentes | Informação ao visitante. |
| `contato`, `phone`, `whatsapp`, `instagram` | Sim | Contato deliberadamente informado para o evento | campos públicos homônimos | Contato público do evento; não usa e-mail do titular. |
| `website`, `site` | Sim, condicionado | Primeiro valor de `website`/`site` | ambos os aliases | Link público; somente URL absoluta HTTPS sem credenciais. |
| `mapUrl`, `mapaUrl` | Sim, condicionado | Primeiro valor de `mapUrl`/`mapaUrl` | ambos os aliases | Ação de mapa; somente URL absoluta HTTPS. |
| `images`, `mainImage`, `image`, `imageCount` | Sim, projetado | Mídia enviada | campos públicos correspondentes | Mídia de `submissions/events/{uid}` é copiada para `approved-media/events/{eventId}`; o DTO contém só a URL neutra e remove `path`/`uploadedAt`. |
| `source` | Sim | Origem editorial conhecida | `source` | Distingue fluxo do portal e gestor sem publicar identidade pessoal. |
| `linkedEstablishmentId`, `linkedEstablishmentName` | Sim | Vínculo público selecionado | campos públicos homônimos | Relaciona o evento ao empreendimento no mapa. |
| `recorrente`, `destaque` | Sim | Flags booleanas verdadeiras | campos públicos homônimos | Política editorial da agenda. |
| `status`, `publicado` | Sim, gerado | Decisão de aprovação | `aprovado`, `true` | Estado público explícito e fail-closed dos consumidores. |
| `submittedBy`, `submittedByName`, `submittedByEmail` | Não | Documento pendente | somente documento privado | Identidade/metadado da solicitação. |
| `ownerUid`, `ownerName`, `ownerEmail` | Não | Documento pendente | somente documento privado | PII e controle de propriedade. |
| `linkedManagerId`, `linkedEstablishmentRole` | Não | Documento pendente | somente documento privado | Metadado interno de autorização/vínculo. |
| `createdAt`, `updatedAt`, `submittedAt`, `reviewedAt` | Não | Documento pendente/revisão | somente documento privado | Metadado operacional não necessário ao renderer público. |
| `reviewedBy`, `reviewNotes`, `updatedBy` | Não | Revisão administrativa | somente documento privado | Identidade do staff e moderação interna. |
| Campos desconhecidos, debug, IP ou metadata arbitrária | Não | Documento pendente | nenhum destino público | Fail-closed contra expansão acidental do schema. |

## Estabelecimentos

| Campo | Público? | Origem | Destino | Razão |
| --- | --- | --- | --- | --- |
| `id` | Sim | ID real do documento pendente | `estabelecimentos_aprovados/{id}.id` | Identidade pública; contrato sem `/`, controles ou IDs reservados. |
| `name`, `nome` | Sim | Primeiro valor de `name`/`nome` | ambos os aliases | Nome comercial/público. |
| `description`, `descricao` | Sim | Primeiro valor dos aliases | ambos os aliases | Descrição comercial. |
| `category`, `categoria` | Sim | Primeiro valor dos aliases | ambos os aliases | Classificação pública. |
| `address`, `endereco` | Sim | Primeiro valor dos aliases | ambos os aliases | Endereço comercial. |
| `phone`, `telefone`, `whatsapp`, `instagram` | Sim | Contato comercial declarado | campos públicos homônimos | Contato público do empreendimento. |
| `website`, `site` | Sim, condicionado | Primeiro valor de `website`/`site` | ambos os aliases | Link comercial; somente URL absoluta HTTPS sem credenciais. |
| `openingHours`, `horario` | Sim | Primeiro valor dos aliases | ambos os aliases | Horário público de atendimento. |
| `images`, `mainImage`, `image`, `imageCount` | Sim, projetado | Mídia enviada | campos públicos correspondentes | Mídia de `submissions/establishments/{uid}` é copiada para `approved-media/establishments/{estId}`; paths, UID e timestamps internos não entram no DTO. |
| `source` | Sim | Origem editorial conhecida | `source` | Proveniência de alto nível, sem identidade pessoal. |
| `status` | Sim, gerado | Decisão de aprovação | `aprovado` | Estado público explícito. |
| `submittedBy`, `submittedByName`, `submittedByEmail` | Não | Documento pendente | somente documento privado | Identidade/metadado da solicitação. |
| `ownerUid`, `ownerName`, `ownerEmail` | Não | Documento pendente | somente documento privado | PII e controle de propriedade. |
| `createdAt`, `updatedAt`, `submittedAt`, `reviewedAt` | Não | Documento pendente/revisão | somente documento privado | Metadado operacional. |
| `reviewedBy`, `reviewNotes`, `updatedBy` | Não | Revisão administrativa | somente documento privado | Identidade do staff e moderação interna. |
| Campos desconhecidos, debug, IP ou metadata arbitrária | Não | Documento pendente | nenhum destino público | Fail-closed contra expansão acidental do schema. |

## Observações de ambiente

- `estabelecimentos_aprovados` continua anonimamente legível pelas Rules atuais,
  embora o site público atual não a consuma; por isso a projeção também é aplicada.
- Storage Rules permitem que staff crie mídia somente no namespace neutro
  `approved-media/{entidade}/{documentId}`. Leitura anônima só é liberada quando o
  documento aprovado correspondente existe; update/delete continuam negados.
- A aprovação exige que cada mídia resolva para `submissions/{entidade}/{submittedBy}`;
  URL externa sem essa proveniência e `ownerUid` divergente falham fechado.
- ID já existente na collection pública interrompe a aprovação antes da cópia de
  mídia, evitando sobrescrita de conteúdo oficial e exposição antecipada.
- Firestore Rules não foram ampliadas. O enforcement do DTO ocorre no source de
  aprovação e novamente nos sinks públicos afetados.
- O portal acompanha o status das submissões do próprio usuário pela fila privada
  preservada; não depende de `submittedBy` ou de qualquer PII no DTO público.
- Nenhum documento histórico foi consultado ou alterado.
