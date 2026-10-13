/* ==========================================================================
   MAPA ILUSTRADO — família de pins "Recortes de São Mateus" (protótipo local)

   Cada família tem SILHUETA própria (não só cor), tirada de objetos da cidade:
     · arco      — a janela em arco da Igreja da Água Branca   → patrimônio/história
     · roseta    — o recorte polonês (wycinanki)               → cultura
     · araucária — o pinheiro-do-paraná em dois andares        → natureza
     · cuia      — a cuia de chimarrão com bomba               → erva-mate
     · prato     — prato de beiral recortado (lambrequim)      → gastronomia
     · chaveiro  — chaveiro de hotel                           → hospedagem
     · folhinha  — folha de calendário de parede               → eventos
     · placa     — placa de informação                         → serviços
   Marcos emblemáticos (com coordenada real no cadastro) ganham pequenas
   ilustrações desenhadas a partir das fotografias do acervo.

   O ponto geográfico exato é SEMPRE a ponta do traço (âncora inferior):
   a arte nunca desloca a coordenada.
   ========================================================================== */
(function () {
  "use strict";

  var INK = "#1b231d";
  var PAPER = "#fbf8f2";

  var FAMILIES = {
    history:    { color: "#6e4a2c", shape: "arco" },
    culture:    { color: "#b3322a", shape: "roseta" },
    nature:     { color: "#2e6b4f", shape: "araucaria" },
    mate:       { color: "#b5652b", shape: "cuia" },
    gastronomy: { color: "#8e2c48", shape: "prato" },
    lodging:    { color: "#2c5b7a", shape: "chaveiro" },
    events:     { color: "#b3322a", shape: "folhinha" },
    services:   { color: "#47524b", shape: "placa" }
  };

  /* ---------- utilitários de geometria ---------- */
  function r(n) { return Math.round(n * 100) / 100; }

  // Contorno recortado: N lóbulos arredondados ao redor de (cx, cy).
  function scallopPath(cx, cy, radius, lobes, depth) {
    var d = "";
    for (var i = 0; i <= lobes; i++) {
      var a = (i / lobes) * Math.PI * 2 - Math.PI / 2;
      var x = cx + Math.cos(a) * (radius - depth);
      var y = cy + Math.sin(a) * (radius - depth);
      if (i === 0) { d += "M" + r(x) + " " + r(y); continue; }
      var am = ((i - 0.5) / lobes) * Math.PI * 2 - Math.PI / 2;
      var cxp = cx + Math.cos(am) * (radius + depth * 1.4);
      var cyp = cy + Math.sin(am) * (radius + depth * 1.4);
      d += " Q" + r(cxp) + " " + r(cyp) + " " + r(x) + " " + r(y);
    }
    return d + " Z";
  }

  function petals(cx, cy, n, len, w, fill, rot) {
    var out = "";
    for (var i = 0; i < n; i++) {
      var deg = (360 / n) * i + (rot || 0);
      out += '<ellipse cx="' + cx + '" cy="' + r(cy - len / 2) + '" rx="' + w + '" ry="' + r(len / 2) + '" fill="' + fill + '" transform="rotate(' + deg + " " + cx + " " + cy + ')"/>';
    }
    return out;
  }

  /* ---------- pins por família (viewBox 0 0 44 56; âncora em 22,53) ---------- */
  var TICK = '<path d="M22 41.5V50" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/>'
    + '<circle cx="22" cy="52.2" r="2.6" fill="' + INK + '" stroke="' + PAPER + '" stroke-width="1.4"/>';

  function frame(d, color) {
    return '<path d="' + d + '" fill="' + color + '" stroke="' + INK + '" stroke-width="1.3" stroke-linejoin="round"/>';
  }

  var SHAPES = {
    arco: function (c) {
      return TICK
        + frame("M7.5 41V19.5A14.5 14.5 0 0 1 36.5 19.5V41Z", c)
        // janela em arco com caixilho — a mesma da Igreja da Água Branca
        + '<path d="M14 37V22A8 8 0 0 1 30 22V37Z" fill="' + PAPER + '"/>'
        + '<path d="M22 14.2V37M14 27.5H30" stroke="' + c + '" stroke-width="1.6"/>'
        + '<path d="M11 41H33" stroke="' + PAPER + '" stroke-width="1.4" opacity=".55"/>';
    },
    roseta: function (c) {
      // flor de seis pétalas pontudas, como nos recortes de papel poloneses
      return TICK
        + frame(scallopPath(22, 22, 17.5, 8, 2.4), c)
        + '<circle cx="22" cy="22" r="10.6" fill="' + PAPER + '"/>'
        + petals(22, 22, 6, 9.2, 2.5, c, 0)
        + '<circle cx="22" cy="22" r="2.1" fill="' + PAPER + '"/>';
    },
    araucaria: function (c) {
      // dois andares de copa em "taça", como o pinheiro-do-paraná visto de longe
      return TICK
        + '<path d="M20.6 20H23.4V42H20.6Z" fill="' + INK + '"/>'
        + frame("M3.5 15.5C3.5 10.5 8.5 9.2 11.6 10.3C13.6 5.6 19 4.4 22 6.6C25 4.4 30.4 5.6 32.4 10.3C35.5 9.2 40.5 10.5 40.5 15.5C35.5 22 29.2 23 22 23C14.8 23 8.5 22 3.5 15.5Z", c)
        + frame("M9 29.3C9 25.9 12.4 25 15 25.8C17 22.7 27 22.7 29 25.8C31.6 25 35 25.9 35 29.3C31 34.4 13 34.4 9 29.3Z", c)
        + '<path d="M12 12.2Q14.4 10.6 17 11.4M24.6 9.4Q27.4 8.4 29.6 10.2M15.4 27.2Q17.6 25.8 20 26.6" stroke="' + PAPER + '" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/>';
    },
    cuia: function (c) {
      return TICK
        // bomba (canudo de metal) saindo da cuia
        + '<path d="M25 15.5L33.6 2.8" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/>'
        + '<path d="M25 15.5L33.6 2.8" stroke="#d9cfbd" stroke-width="1" stroke-linecap="round"/>'
        + frame("M10.6 15.2C5.4 19.6 5.6 31.4 11.6 36.6C15.6 40.4 28.4 40.4 32.4 36.6C38.4 31.4 38.6 19.6 33.4 15.2Z", c)
        // a erva verde à boca da cuia
        + '<ellipse cx="22" cy="15.3" rx="11.6" ry="3.1" fill="#4f7d39" stroke="' + INK + '" stroke-width="1.2"/>'
        + '<path d="M9.4 26.4L12.6 29.4L15.8 26.4L19 29.4L22.2 26.4L25.4 29.4L28.6 26.4L31.8 29.4L34.6 26.6" fill="none" stroke="' + PAPER + '" stroke-width="1.6" stroke-linejoin="round"/>';
    },
    prato: function (c) {
      return TICK
        + '<circle cx="22" cy="22" r="17.6" fill="' + c + '" stroke="' + INK + '" stroke-width="1.3"/>'
        + '<circle cx="22" cy="22" r="12.4" fill="' + PAPER + '"/>'
        + '<circle cx="22" cy="22" r="14.9" fill="none" stroke="' + PAPER + '" stroke-width=".9" stroke-dasharray="1.4 2" opacity=".75"/>'
        // garfo e faca
        + '<path d="M17.6 15.2V20.6M15.6 15.2V19.4Q15.6 21.4 17.6 21.4Q19.6 21.4 19.6 19.4V15.2M17.6 21.4V29.4" stroke="' + c + '" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
        + '<path d="M26.4 29.4V15.4Q29.2 17.4 28.6 23.2H26.4" stroke="' + c + '" stroke-width="1.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>';
    },
    chaveiro: function (c) {
      return TICK
        + '<circle cx="22" cy="5.4" r="3.6" fill="none" stroke="' + INK + '" stroke-width="1.5"/>'
        + frame("M13 7.8H31A4.6 4.6 0 0 1 35.6 12.4V31.2L22 41.6L8.4 31.2V12.4A4.6 4.6 0 0 1 13 7.8Z", c)
        + '<circle cx="22" cy="13.2" r="2.2" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1"/>'
        // cama: cabeceira, travesseiro e colchão
        + '<path d="M13.6 31V20.4M13.6 25.6H30.4V31" stroke="' + PAPER + '" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
        + '<rect x="15.6" y="21.6" width="5.2" height="3" rx="1.2" fill="' + PAPER + '"/>'
        + '<path d="M21.6 23.6H28.6Q30.4 23.6 30.4 25.4" stroke="' + PAPER + '" stroke-width="1.6" fill="none"/>';
    },
    folhinha: function (c) {
      return TICK
        + '<path d="M7.5 9.5H36.5V39.5L33.5 41.5H7.5Z" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1.3" stroke-linejoin="round"/>'
        + '<path d="M7.5 9.5H36.5V17H7.5Z" fill="' + c + '" stroke="' + INK + '" stroke-width="1.3"/>'
        + '<path d="M14.5 5.2V12.4M29.5 5.2V12.4" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/>'
        + '<path d="M33.5 41.5V38.6H36.5" fill="#e8dfcf" stroke="' + INK + '" stroke-width="1" stroke-linejoin="round"/>'
        // estrela recortada no lugar do dia
        + '<path d="M22 20.6L24.1 26.1L29.8 26.4L25.3 29.9L26.9 35.4L22 32.2L17.1 35.4L18.7 29.9L14.2 26.4L19.9 26.1Z" fill="' + c + '"/>';
    },
    placa: function (c) {
      return TICK
        + '<path d="M22 32V42" stroke="' + INK + '" stroke-width="2.6"/>'
        + frame("M13.5 5.5H30.5A6 6 0 0 1 36.5 11.5V27A6 6 0 0 1 30.5 33H13.5A6 6 0 0 1 7.5 27V11.5A6 6 0 0 1 13.5 5.5Z", c)
        + '<circle cx="22" cy="12.4" r="2.3" fill="' + PAPER + '"/>'
        + '<path d="M19.4 17.4H22.8V27.6M19 27.6H26" stroke="' + PAPER + '" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    }
  };

  function pinSvg(family) {
    var cfg = FAMILIES[family] || FAMILIES.culture;
    return '<svg class="mi-pin-svg" viewBox="0 0 44 56" width="44" height="56" aria-hidden="true" focusable="false">'
      + SHAPES[cfg.shape](cfg.color) + "</svg>";
  }

  /* ---------- marcos ilustrados (viewBox 0 0 64 76; âncora em 32,73) ----------
     Desenhos simplificados a partir das fotos do acervo (images/...). */
  var L_TICK = '<ellipse cx="32" cy="63" rx="22" ry="2.6" fill="' + INK + '" opacity=".14"/>'
    + '<path d="M32 63V70.5" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/>'
    + '<circle cx="32" cy="72.6" r="2.7" fill="' + INK + '" stroke="' + PAPER + '" stroke-width="1.4"/>';
  var S = ' stroke="' + INK + '" stroke-width="1.25" stroke-linejoin="round"';

  function lancet(x, y, w, h, fill) {
    return '<path d="M' + x + " " + (y + h) + "V" + (y + w / 2) + "Q" + x + " " + y + " " + (x + w / 2) + " " + (y - w * 0.35)
      + "Q" + (x + w) + " " + y + " " + (x + w) + " " + (y + w / 2) + "V" + (y + h) + 'Z" fill="' + fill + '"' + S + "/>";
  }

  var LANDMARKS = {
    // Igreja São José — Água Branca: madeira azul-acinzentada, torre única com flecha
    "igreja-agua-branca": {
      family: "history",
      svg: function () {
        var planks = "";
        for (var x = 21; x <= 43; x += 3.2) planks += "M" + r(x) + " 36V62";
        return L_TICK
          + '<path d="M17 62V36H47V62Z" fill="#a7bccb"' + S + "/>"
          + '<path d="' + planks + '" stroke="' + INK + '" stroke-width=".5" opacity=".35"/>'
          + '<path d="M14.5 37L32 23.5L49.5 37Z" fill="#5c7383"' + S + "/>"
          + '<path d="M28 31V16H36V31Z" fill="#a7bccb"' + S + "/>"
          + '<path d="M27 16.5L32 2.8L37 16.5Z" fill="#5c7383"' + S + "/>"
          + '<path d="M32 3.2V-1.6M30.2 0.4H33.8" stroke="' + INK + '" stroke-width="1.2"/>'
          + lancet(30.6, 21, 2.8, 6, PAPER)
          + lancet(20, 42, 3.6, 8, PAPER) + lancet(40.4, 42, 3.6, 8, PAPER)
          + '<path d="M26.5 62V49.5H37.5V62Z" fill="#c3d3de"' + S + "/>"
          + '<path d="M24.6 50.4L32 43.4L39.4 50.4Z" fill="#5c7383"' + S + "/>"
          + '<path d="M29.8 62V53.6H34.2V62Z" fill="#2f3f49"/>';
      }
    },
    // Igreja Matriz São Mateus: neogótica branca, torre central alta, rosácea e pináculos
    "igreja-matriz": {
      family: "history",
      svg: function () {
        return L_TICK
          + '<path d="M11 62V38H53V62Z" fill="#efe9de"' + S + "/>"
          + '<path d="M11 38.5L18.5 30.5L26 38.5Z M38 38.5L45.5 30.5L53 38.5Z" fill="#d9d1c2"' + S + "/>"
          + '<path d="M10.2 38.5L11.8 31L13.4 38.5Z M50.6 38.5L52.2 31L53.8 38.5Z" fill="#efe9de"' + S + "/>"
          + '<path d="M25.5 62V19H38.5V62Z" fill="#f7f3eb"' + S + "/>"
          + '<path d="M38.5 19V62H35.6V19Z" fill="#d9d1c2"/>'
          + '<path d="M25 19.5L32 1.6L39 19.5Z" fill="#e4ddcf"' + S + "/>"
          + '<path d="M32 2.2V-1.8M30.4 0.1H33.6" stroke="' + INK + '" stroke-width="1.2"/>'
          + '<path d="M24.2 19.6L25.6 13.6L27 19.6Z M37 19.6L38.4 13.6L39.8 19.6Z" fill="#efe9de"' + S + "/>"
          + lancet(30.4, 23.5, 3.2, 7, "#9b8b74")
          + '<circle cx="32" cy="39.5" r="3.2" fill="#c9b9a0"' + S + '/><path d="M32 36.3V42.7M28.8 39.5H35.2" stroke="' + INK + '" stroke-width=".6"/>'
          + lancet(28.6, 50, 6.8, 12, "#6b5843")
          + lancet(15.5, 44, 3.4, 9, "#9b8b74") + lancet(45.1, 44, 3.4, 9, "#9b8b74");
      }
    },
    // Ponte do Rio Iguaçu: tabuleiro longo e baixo sobre pilares, rio largo
    "ponte-rio-iguacu": {
      family: "nature",
      svg: function () {
        var piers = "";
        [9, 21.5, 34, 46.5].forEach(function (x) { piers += '<path d="M' + x + " 43V58H" + (x + 4.2) + 'V43Z" fill="#bdb3a1"' + S + "/>"; });
        return L_TICK
          + '<path d="M1 52Q16 48.5 32 52T63 52V62H1Z" fill="#7aa3a6"' + S + "/>"
          + '<path d="M6 56.6Q11 55.2 16 56.6M38 57.4Q43 56 48 57.4M22 59.6Q27 58.2 32 59.6" stroke="' + PAPER + '" stroke-width="1" fill="none" opacity=".85"/>'
          + '<path d="M0 46Q3 37 9 40Q11 33 17 37V48H0Z" fill="#3f7a52"' + S + "/>"
          + '<path d="M64 46Q61 37 55 40Q53 33 47 37V48H64Z" fill="#3f7a52"' + S + "/>"
          + piers
          + '<path d="M2 37.6H62V43H2Z" fill="#e3dccf"' + S + "/>"
          + '<path d="M2 34.8H62M2 34.8V37.6M10 34.8V37.6M18 34.8V37.6M26 34.8V37.6M34 34.8V37.6M42 34.8V37.6M50 34.8V37.6M58 34.8V37.6" stroke="' + INK + '" stroke-width="1"/>';
      }
    },
    // Casa da Memória Padre Bauer: casa branca, cunhais azuis, telhado de quatro águas
    "casa-da-memoria": {
      family: "history",
      svg: function () {
        var tiles = "";
        for (var x = 16; x <= 48; x += 4) tiles += "M" + x + " 27.5L" + r(x - (x - 32) * 0.36) + " 38";
        return L_TICK
          + '<path d="M56.5 62V8.5" stroke="' + INK + '" stroke-width="1.6"/><path d="M56.5 9V22" stroke="#b3322a" stroke-width="1.6"/>'
          + '<path d="M11 62V37H53V62Z" fill="' + PAPER + '"' + S + "/>"
          + '<path d="M11 37H14.6V62H11Z M49.4 37H53V62H49.4Z M11 58.6H53V62H11Z" fill="#2f5fa4"/>'
          + '<path d="M7 38L17.5 27H46.5L57 38Z" fill="#c4673a"' + S + "/>"
          + '<path d="' + tiles + '" stroke="' + INK + '" stroke-width=".5" opacity=".4"/>'
          + '<path d="M24 39.4H40V43.4H24Z" fill="#2f5fa4"/><path d="M26.5 41.4H37.5" stroke="' + PAPER + '" stroke-width=".8"/>'
          + '<path d="M27.4 58.6V45.4H36.6V58.6Z" fill="' + PAPER + '" stroke="#2f5fa4" stroke-width="1.6"/>'
          + '<path d="M32 45.6V58.4" stroke="#2f5fa4" stroke-width=".9"/>'
          + '<path d="M17.4 55V44.6H24V55Z M40 55V44.6H46.6V55Z" fill="#a7bccb" stroke="#2f5fa4" stroke-width="1.4"/>'
          + '<path d="M20.7 44.6V55M43.3 44.6V55" stroke="#2f5fa4" stroke-width=".8"/>'
          + '<path d="M25.6 62V60.6H38.4V62Z" fill="#b3322a"/>';
      }
    },
    // Monumento Vapor Pery: o vapor fluvial sobre calços, cabine branca e chaminé fina
    "vapor-pery": {
      family: "history",
      svg: function () {
        return L_TICK
          + '<path d="M3 62Q32 58 61 62Z" fill="#3f7a52"/>'
          + '<path d="M14 54V61H18V54Z M30 55V61H34V55Z M46 54V61H50V54Z" fill="#9a8f7d"' + S + "/>"
          + '<path d="M44.6 33V9H48V33Z" fill="#8c918d"' + S + "/>"
          + '<path d="M43.6 9H49V11.2H43.6Z" fill="' + INK + '"/>'
          + '<path d="M19 33V24.5H42V33Z" fill="' + PAPER + '"' + S + "/>"
          + '<path d="M17.5 24.8H43.5" stroke="#5f7680" stroke-width="2"/>'
          + '<path d="M22 27H25.4V30.4H22Z M27.6 27H31V30.4H27.6Z M33.2 27H36.6V30.4H33.2Z" fill="#a7bccb"/>'
          + '<path d="M8 43V33H53V43Z" fill="' + PAPER + '"' + S + "/>"
          + '<path d="M6.5 33.3H54.5" stroke="#5f7680" stroke-width="2"/>'
          + '<path d="M11 33.6V42.6M17 33.6V42.6M23 33.6V42.6M29 33.6V42.6M35 33.6V42.6M41 33.6V42.6M47 33.6V42.6" stroke="' + INK + '" stroke-width=".6" opacity=".5"/>'
          + '<path d="M2.5 42.6H61.5L56 53.4Q32 56.6 9 53.4Z" fill="#b9cad1"' + S + "/>"
          + '<path d="M5.6 47.4H58.6" stroke="#5f7680" stroke-width="1.4"/>';
      }
    }
  };

  var L_GROUND = '<ellipse cx="32" cy="62.4" rx="25" ry="3.2" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1" opacity=".95"/>';
  var LANDMARK_PRIORITY = ["igreja-matriz", "igreja-agua-branca", "vapor-pery", "casa-da-memoria", "ponte-rio-iguacu"];

  function landmarkSvg(id) {
    var lm = LANDMARKS[id];
    return '<svg class="mi-landmark-svg" viewBox="0 -3 64 79" width="64" height="79" aria-hidden="true" focusable="false">' + lm.svg() + "</svg>";
  }

  /* ---------- classificação visual (não altera filtros nem categorias) ---------- */
  function norm(v) {
    return String(v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  function familyFor(item) {
    if (!item) return "culture";
    if (item.tipo === "evento") return "events";
    if (item.tipo === "hospedagem") return "lodging";
    if (item.tipo === "servico" || item.categoriaMapa === "services") return "services";
    // Nome e categoria do próprio lugar (as tags incluem nomes de roteiros, que não descrevem o lugar).
    var label = norm([item.nome, item.categoriaOriginal].join(" "));
    if (/\b(erva|ervateira|chimarr\w*|mathe|mate)\b/.test(label)) return "mate";
    if (item.categoriaMapa === "gastronomy") return "gastronomy";
    if (item.categoriaMapa === "lodging") return "lodging";
    if (item.categoriaMapa === "events") return "events";
    if (item.categoriaMapa === "nature") return "nature";
    if (item.categoriaMapa === "history") return "history";
    if (/\b(igreja|capela|historic\w*|memoria|monumento|patrimonio|paco|prefeitura)\b/.test(norm(item.nome))) return "history";
    return "culture";
  }

  function isLandmark(item) { return !!(item && LANDMARKS[item.id]); }

  function familyColor(family) { return (FAMILIES[family] || FAMILIES.culture).color; }

  /* ---------- ícones Leaflet ---------- */
  var cache = {};

  // Localização aproximada: a âncora deixa de ser um ponto cheio e vira um anel tracejado
  // vazado — o pin não finge precisão que o cadastro não tem.
  var APPROX_DOT = '<circle cx="22" cy="52.2" r="3.4" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1.3" stroke-dasharray="1.7 1.3"/>';
  var APPROX_L_DOT = '<circle cx="32" cy="72.6" r="3.5" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1.3" stroke-dasharray="1.7 1.3"/>';
  var EXACT_DOT = '<circle cx="22" cy="52.2" r="2.6" fill="' + INK + '" stroke="' + PAPER + '" stroke-width="1.4"/>';
  var EXACT_L_DOT = '<circle cx="32" cy="72.6" r="2.7" fill="' + INK + '" stroke="' + PAPER + '" stroke-width="1.4"/>';

  function markerHtml(item, opts) {
    opts = opts || {};
    var landmark = isLandmark(item);
    var family = landmark ? LANDMARKS[item.id].family : familyFor(item);
    var classes = "mi-pin" + (landmark ? " is-landmark" : " is-" + family)
      + (opts.selected ? " is-selected" : "")
      + (opts.dim ? " is-dim" : "")
      + (opts.route ? " is-route" : "")
      + (opts.approx ? " is-approx" : "");
    var style = opts.route && opts.routeColor ? ' style="--mi-route:' + opts.routeColor + '"' : "";
    var art = landmark ? landmarkSvg(item.id) : pinSvg(family);
    if (opts.approx) art = art.replace(landmark ? EXACT_L_DOT : EXACT_DOT, landmark ? APPROX_L_DOT : APPROX_DOT);
    var label = landmark ? '<span class="mi-pin-label">' + escapeHtml(item.nome.split(" — ")[0]) + "</span>" : "";
    return '<span class="' + classes + '"' + style + ">" + art + label + "</span>";
  }

  function escapeHtml(v) {
    return String(v || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function createIcon(item, opts) {
    var key = item.id + "|" + JSON.stringify(opts || {});
    if (cache[key]) return cache[key];
    var landmark = isLandmark(item);
    var icon = window.L.divIcon({
      className: "mi-icon",
      html: markerHtml(item, opts),
      iconSize: landmark ? [64, 79] : [44, 56],
      iconAnchor: landmark ? [32, 75.6] : [22, 52.2],
      popupAnchor: [0, -46]
    });
    cache[key] = icon;
    return icon;
  }

  /* ---------- agrupamento: roseta com contagem e anel de categorias ---------- */
  function clusterIcon(cluster, opts) {
    opts = opts || {};
    var markers = cluster.getAllChildMarkers();
    var count = markers.length;
    var tally = {};
    markers.forEach(function (m) {
      var fam = m.options.miFamily || "culture";
      tally[fam] = (tally[fam] || 0) + 1;
    });
    var size = count < 10 ? 46 : count < 30 ? 54 : 62;
    var c = size / 2;
    var ringR = c - 9.5;
    var circ = 2 * Math.PI * ringR;
    var offset = 0;
    var ring = "";
    Object.keys(FAMILIES).forEach(function (fam) {
      if (!tally[fam]) return;
      var len = (tally[fam] / count) * circ;
      ring += '<circle cx="' + c + '" cy="' + c + '" r="' + r(ringR) + '" fill="none" stroke="' + FAMILIES[fam].color
        + '" stroke-width="3.4" stroke-dasharray="' + r(Math.max(len - 1.2, 0.6)) + " " + r(circ) + '" stroke-dashoffset="' + r(-offset)
        + '" transform="rotate(-90 ' + c + " " + c + ')"/>';
      offset += len;
    });
    // Grupo que contém um marco emblemático mostra o desenho do marco como "rosto" do
    // grupo. Sem traço/âncora: o grupo não é um ponto, e a arte não finge coordenada.
    var emblem = null;
    LANDMARK_PRIORITY.some(function (id) {
      var hit = markers.some(function (m) { return m.options.miLandmark === id; });
      if (hit) emblem = id;
      return hit;
    });
    if (emblem && !opts.routeColor) {
      var emblemHtml = '<span class="mi-cluster is-emblem">'
        + '<svg class="mi-landmark-svg" viewBox="0 -3 64 66" width="64" height="66" aria-hidden="true" focusable="false">' + LANDMARKS[emblem].svg().replace(L_TICK, L_GROUND) + "</svg>"
        + '<span class="mi-cluster-badge"><svg viewBox="0 0 30 30" width="30" height="30" aria-hidden="true" focusable="false"><path d="' + scallopPath(15, 15, 13.4, 9, 1.4) + '" fill="' + INK + '"/></svg>'
        + '<span class="mi-cluster-count">' + count + "</span></span></span>";
      return window.L.divIcon({ html: emblemHtml, className: "mi-icon mi-cluster-icon", iconSize: [64, 66], iconAnchor: [32, 40] });
    }
    var routeStyle = opts.routeColor ? ";--mi-route:" + opts.routeColor : "";
    var html = '<span class="mi-cluster' + (opts.routeColor ? " is-route" : "") + '" style="width:' + size + "px;height:" + size + "px" + routeStyle + '">'
      + '<svg viewBox="0 0 ' + size + " " + size + '" width="' + size + '" height="' + size + '" aria-hidden="true" focusable="false">'
      + '<path d="' + scallopPath(c, c, c - 2.2, count < 10 ? 10 : 12, 1.8) + '" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1.3"/>'
      + ring
      + "</svg>"
      + '<span class="mi-cluster-count">' + count + "</span></span>";
    return window.L.divIcon({
      html: html,
      className: "mi-icon mi-cluster-icon",
      iconSize: [size, size],
      iconAnchor: [c, c]
    });
  }

  /* ---------- legenda ---------- */
  function legendHtml(labels) {
    var order = ["history", "culture", "nature", "mate", "gastronomy", "lodging", "events", "services"];
    return order.map(function (fam) {
      return '<li><span class="mi-legend-pin">' + pinSvg(fam) + "</span><span>" + escapeHtml(labels[fam] || fam) + "</span></li>";
    }).join("");
  }

  window.MAPA_ILUSTRADO = {
    FAMILIES: FAMILIES,
    LANDMARK_IDS: Object.keys(LANDMARKS),
    familyFor: function (item) { return isLandmark(item) ? LANDMARKS[item.id].family : familyFor(item); },
    familyColor: familyColor,
    isLandmark: isLandmark,
    createIcon: createIcon,
    clusterIcon: clusterIcon,
    pinSvg: pinSvg,
    landmarkSvg: landmarkSvg,
    legendHtml: legendHtml
  };
})();
