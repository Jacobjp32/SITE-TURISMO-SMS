/**
 * audit-tourism-data.mjs — Auditoria de qualidade dos dados turísticos
 * Verifica locais-data.js: mapsUrl, coordenadas, galerías, campos obrigatórios.
 * Uso: node scripts/audit-tourism-data.mjs
 * Saída: docs/auditoria-output/tourism-data-report.json + .md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'auditoria-output');
const DATA_FILE = path.join(ROOT, 'js', 'locais-data.js');

// ── Parser de locais-data.js ─────────────────────────────────────────────────

function parseLocaisData() {
  const src = fs.readFileSync(DATA_FILE, 'utf8');
  const locais = {};

  // Extrai cada bloco de local por slug
  const blockRe = /'([a-z0-9-]+)'\s*:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
  let match;

  while ((match = blockRe.exec(src)) !== null) {
    const slug = match[1];
    const block = match[0];

    const get = (key) => {
      const re = new RegExp(key + "\\s*:\\s*('([^']*)'|null|([\\d.-]+))", 'g');
      const m = re.exec(block);
      if (!m) return undefined;
      if (m[0].includes('null')) return null;
      if (m[2] !== undefined) return m[2];
      if (m[3] !== undefined) return parseFloat(m[3]);
      return undefined;
    };

    const getArray = (key) => {
      const re = new RegExp(key + "\\s*:\\s*\\[([^\\]]+)\\]");
      const m = re.exec(block);
      if (!m) return [];
      const items = m[1].match(/'([^']*)'/g) || [];
      return items.map(s => s.replace(/'/g, ''));
    };

    locais[slug] = {
      id: slug,
      nome: get('nome'),
      lat: get('lat'),
      lng: get('lng'),
      mapsUrl: get('mapsUrl'),
      categoria: get('categoria'),
      endereco: get('endereco'),
      horario: get('horario'),
      galeria: getArray('galeria'),
    };
  }

  return locais;
}

// ── Análise ───────────────────────────────────────────────────────────────────

function analyzeLocais(locais) {
  const slugs = Object.keys(locais);
  const results = {
    total: slugs.length,
    issues: [],
    stats: {
      comMapsUrl: 0,
      comMapsUrlPlaceholder: 0,
      semMapsUrl: 0,
      comCoordenadas: 0,
      semCoordenadas: 0,
      fallbackDisponivel: 0,
      fallbackIndisponivel: 0,
      galeriaComDuplicatas: 0,
      camposComConfirmar: 0,
    },
    locais: []
  };

  const PLACEHOLDER_PATTERNS = [
    'exemplo', 'placeholder', 'test', 'teste', 'dummy',
    'maps.app.goo.gl/exemplo', 'maps.app.goo.gl/TEST'
  ];

  for (const slug of slugs) {
    const local = locais[slug];
    const itemIssues = [];

    const hasCoordenadas = typeof local.lat === 'number' && typeof local.lng === 'number';
    const hasMapsUrl = local.mapsUrl !== null && local.mapsUrl !== undefined;
    const isPlaceholder = hasMapsUrl && PLACEHOLDER_PATTERNS.some(p =>
      String(local.mapsUrl).toLowerCase().includes(p)
    );

    // mapsUrl
    if (!hasMapsUrl) {
      results.stats.semMapsUrl++;
      if (hasCoordenadas) {
        results.stats.fallbackDisponivel++;
        itemIssues.push({
          field: 'mapsUrl',
          severity: 'info',
          message: `mapsUrl: null — fallback por coordenada ativo (lat=${local.lat}, lng=${local.lng})`
        });
      } else {
        results.stats.fallbackIndisponivel++;
        itemIssues.push({
          field: 'mapsUrl',
          severity: 'high',
          message: 'mapsUrl: null e sem coordenadas — botão Google Maps ficará oculto'
        });
      }
    } else if (isPlaceholder) {
      results.stats.comMapsUrlPlaceholder++;
      itemIssues.push({
        field: 'mapsUrl',
        severity: 'high',
        message: `mapsUrl contém placeholder: "${local.mapsUrl}"`
      });
    } else {
      results.stats.comMapsUrl++;
    }

    // coordenadas
    if (hasCoordenadas) {
      results.stats.comCoordenadas++;
    } else {
      results.stats.semCoordenadas++;
      itemIssues.push({
        field: 'lat/lng',
        severity: 'high',
        message: 'Sem coordenadas — local não aparecerá no mapa interativo'
      });
    }

    // galeria duplicatas
    const galeria = local.galeria || [];
    const galeriaUnique = [...new Set(galeria)];
    if (galeria.length !== galeriaUnique.length) {
      results.stats.galeriaComDuplicatas++;
      const dupes = galeria.filter((v, i) => galeria.indexOf(v) !== i);
      itemIssues.push({
        field: 'galeria',
        severity: 'low',
        message: `Galeria com duplicatas: ${dupes.join(', ')}`
      });
    }

    // campos "(confirmar ..."
    const confirmarFields = ['endereco', 'horario', 'categoria'];
    for (const field of confirmarFields) {
      const val = local[field];
      if (val && String(val).toLowerCase().includes('confirmar')) {
        results.stats.camposComConfirmar++;
        itemIssues.push({
          field,
          severity: 'medium',
          message: `Campo "${field}" contém nota de pendência: "${val}"`
        });
      }
    }

    results.locais.push({
      id: slug,
      nome: local.nome,
      hasCoordenadas,
      mapsUrl: local.mapsUrl,
      mapsUrlStatus: !hasMapsUrl
        ? (hasCoordenadas ? 'null-com-fallback' : 'null-sem-fallback')
        : isPlaceholder ? 'placeholder' : 'valido',
      galeriaCount: galeria.length,
      galeriaUniqueCount: galeriaUnique.length,
      issues: itemIssues
    });

    results.issues.push(...itemIssues.map(i => ({ ...i, localId: slug, localNome: local.nome })));
  }

  results.stats.bySeverity = {
    high: results.issues.filter(i => i.severity === 'high').length,
    medium: results.issues.filter(i => i.severity === 'medium').length,
    low: results.issues.filter(i => i.severity === 'low').length,
    info: results.issues.filter(i => i.severity === 'info').length,
  };

  return results;
}

// ── Gera relatório Markdown ───────────────────────────────────────────────────

function generateMarkdown(results, generatedAt) {
  const s = results.stats;
  const lines = [];

  lines.push('# Auditoria de Dados Turísticos');
  lines.push('');
  lines.push(`Gerado em ${generatedAt}.`);
  lines.push('');
  lines.push('## Resumo');
  lines.push('');
  lines.push(`- Total de locais: **${results.total}**`);
  lines.push(`- Com mapsUrl válido: ${s.comMapsUrl}`);
  lines.push(`- mapsUrl placeholder: ${s.comMapsUrlPlaceholder}`);
  lines.push(`- mapsUrl null (fallback por coord): ${s.fallbackDisponivel}`);
  lines.push(`- mapsUrl null SEM fallback: ${s.fallbackIndisponivel}`);
  lines.push(`- Com coordenadas: ${s.comCoordenadas}`);
  lines.push(`- Sem coordenadas: ${s.semCoordenadas}`);
  lines.push(`- Galerias com duplicatas: ${s.galeriaComDuplicatas}`);
  lines.push(`- Campos com nota "(confirmar...)": ${s.camposComConfirmar}`);
  lines.push('');
  lines.push('### Issues por severidade');
  lines.push('');
  lines.push(`- 🔴 Alta: ${s.bySeverity.high}`);
  lines.push(`- 🟡 Média: ${s.bySeverity.medium}`);
  lines.push(`- 🟢 Baixa: ${s.bySeverity.low}`);
  lines.push(`- ℹ️ Info: ${s.bySeverity.info}`);
  lines.push('');

  // Issues por local
  lines.push('## Issues por Local');
  lines.push('');

  const bySeverity = ['high', 'medium', 'low', 'info'];
  const severityLabel = { high: '🔴 Alta', medium: '🟡 Média', low: '🟢 Baixa', info: 'ℹ️ Info' };

  for (const local of results.locais) {
    if (!local.issues.length) continue;
    lines.push(`### ${local.nome} (\`${local.id}\`)`);
    lines.push('');
    lines.push(`- Coordenadas: ${local.hasCoordenadas ? '✅' : '❌ Ausentes'}`);
    lines.push(`- mapsUrl: \`${local.mapsUrl || 'null'}\` — status: **${local.mapsUrlStatus}**`);
    lines.push('');
    for (const issue of local.issues) {
      lines.push(`- **[${severityLabel[issue.severity]}]** \`${issue.field}\`: ${issue.message}`);
    }
    lines.push('');
  }

  // Locais sem issues
  const cleanLocais = results.locais.filter(l => !l.issues.length);
  if (cleanLocais.length) {
    lines.push('## Locais sem issues');
    lines.push('');
    lines.push(cleanLocais.map(l => `- ${l.nome} (\`${l.id}\`)`).join('\n'));
    lines.push('');
  }

  // Pendências humanas
  lines.push('## Pendências Humanas (não automatizáveis)');
  lines.push('');
  lines.push('Os itens abaixo requerem verificação factual antes de serem preenchidos:');
  lines.push('');

  const highIssues = results.issues.filter(i => i.severity === 'high' || i.severity === 'medium');
  if (highIssues.length) {
    lines.push('| Local | Campo | Pendência |');
    lines.push('| --- | --- | --- |');
    for (const issue of highIssues) {
      lines.push(`| ${issue.localNome} | \`${issue.field}\` | ${issue.message} |`);
    }
  } else {
    lines.push('_Nenhuma pendência humana de alta/média prioridade._');
  }
  lines.push('');

  return lines.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[audit-tourism-data] Lendo js/locais-data.js...');

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const locais = parseLocaisData();
  const slugCount = Object.keys(locais).length;

  if (!slugCount) {
    console.error('[audit-tourism-data] Falha ao parsear locais-data.js — 0 locais encontrados.');
    process.exit(1);
  }

  console.log(`[audit-tourism-data] ${slugCount} locais encontrados.`);

  const results = analyzeLocais(locais);
  const generatedAt = new Date().toISOString();
  results.generatedAt = generatedAt;

  // JSON
  const jsonPath = path.join(OUT_DIR, 'tourism-data-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`[audit-tourism-data] JSON salvo em ${jsonPath}`);

  // Markdown
  const mdPath = path.join(OUT_DIR, 'tourism-data-report.md');
  const md = generateMarkdown(results, generatedAt);
  fs.writeFileSync(mdPath, md, 'utf8');
  console.log(`[audit-tourism-data] Markdown salvo em ${mdPath}`);

  // Também gera docs/auditoria-dados-turisticos.md (relatório principal)
  const mainMdPath = path.join(ROOT, 'docs', 'auditoria-dados-turisticos.md');
  fs.writeFileSync(mainMdPath, md, 'utf8');
  console.log(`[audit-tourism-data] Relatório principal salvo em ${mainMdPath}`);

  // Resumo no console
  const s = results.stats;
  console.log('');
  console.log('=== Resumo ===');
  console.log(`Total locais: ${results.total}`);
  console.log(`mapsUrl válido: ${s.comMapsUrl}`);
  console.log(`mapsUrl placeholder: ${s.comMapsUrlPlaceholder}`);
  console.log(`mapsUrl null + fallback coord: ${s.fallbackDisponivel}`);
  console.log(`mapsUrl null SEM fallback: ${s.fallbackIndisponivel}`);
  console.log(`Com coordenadas: ${s.comCoordenadas}`);
  console.log(`Sem coordenadas: ${s.semCoordenadas}`);
  console.log(`Issues 🔴 alta: ${s.bySeverity.high}`);
  console.log(`Issues 🟡 média: ${s.bySeverity.medium}`);
  console.log(`Issues 🟢 baixa: ${s.bySeverity.low}`);
  console.log(`Issues ℹ️ info: ${s.bySeverity.info}`);
}

main().catch(err => {
  console.error('[audit-tourism-data] Erro fatal:', err);
  process.exit(1);
});
