(function (window, document) {
  "use strict";

  var FALLBACK_IMAGE = "images/FOTO_GERAL_SAO_MATEUS_DO_SUL.jpg";

  function ensureArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function clean(value) {
    return String(value == null ? "" : value).trim();
  }

  function escapeHtml(value) {
    return clean(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeHref(value, fallback) {
    var raw = clean(value);
    if (/^\/(?!\/)/.test(raw) || /^https:\/\//i.test(raw) || /^mailto:/i.test(raw) || /^tel:/i.test(raw)) {
      return escapeHtml(raw);
    }
    return escapeHtml(fallback || "#");
  }

  function safeImage(value) {
    var raw = clean(value);
    if (/^(?:https:\/\/|\/(?!\/)|(?:\.\.\/|\.\/)?[a-z0-9_-][^:]*$)/i.test(raw)) return escapeHtml(raw);
    return FALLBACK_IMAGE;
  }

  function itemUrl(item) {
    var id = clean(item && (item.slug || item.id));
    var fallback = "/local?id=" + encodeURIComponent(id);
    var canonical = clean(item && item.seo && item.seo.canonicalPath);
    return safeHref(canonical || item && item.url, fallback);
  }

  function itemImage(item) {
    return safeImage(item && (item.imagem || item.media && item.media.mainImage && item.media.mainImage.url));
  }

  // Foto própria do item (sem o fallback genérico da cidade). Ordem: capa oficial →
  // primeira foto da galeria do próprio registro. Registros do CMS podem ter galeria
  // sem capa (ex.: Hotel São Mateus), e a galeria é do mesmo empreendimento.
  function ownImage(item) {
    var raw = ownImageRaw(item);
    return raw ? safeImage(raw) : "";
  }

  function ownImageRaw(item) {
    var candidates = [
      item && item.imagem,
      item && item.media && item.media.mainImage && item.media.mainImage.url
    ];
    ensureArray(item && item.media && item.media.gallery).forEach(function (entry) {
      candidates.push(entry && (typeof entry === "string" ? entry : entry.url));
    });
    ensureArray(item && item.galeria).forEach(function (entry) {
      candidates.push(entry && (typeof entry === "string" ? entry : entry.url));
    });
    for (var i = 0; i < candidates.length; i += 1) {
      var raw = clean(candidates[i]);
      if (!raw) continue;
      if (safeImage(raw) !== FALLBACK_IMAGE) return raw;
    }
    return "";
  }

  // Crédito discreto da foto do card (autor e licença), no fim do corpo do card para não
  // sobrepor a foto nem desalinhar títulos. O card inteiro é um link, então aqui vai só
  // texto; os links de fonte e licença ficam na ficha (local.html).
  var creditStyleInjected = false;
  function cardCredit(item) {
    return photoCreditMarkup(item, ownImageRaw(item));
  }

  function photoCreditMarkup(item, rawUrl) {
    var attribution = window.SMSImageAttribution;
    if (!attribution || !rawUrl) return "";
    var text = attribution.text(attribution.forItemImage(item, rawUrl));
    if (!text) return "";
    if (!creditStyleInjected && document.head) {
      creditStyleInjected = true;
      var style = document.createElement("style");
      style.setAttribute("data-photo-credit-style", "");
      style.textContent = ".card-photo-credit{display:block;margin:.45rem 0 0;padding:0;font-size:.68rem;letter-spacing:0;text-transform:none;line-height:1.35;font-weight:400;color:#6b6b6b;text-align:left;overflow-wrap:anywhere}";
      document.head.appendChild(style);
    }
    return '<small class="card-photo-credit">' + escapeHtml(text) + "</small>";
  }

  // Apresentação editorial (vitrine da home): mesma ordem oficial, mas registros com
  // fotografia própria abrem a seção. Nenhum registro é removido do catálogo; os demais
  // completam as vagas e continuam no mapa com o mesmo critério do catálogo oficial.
  function photoFirst(items) {
    var withPhoto = [];
    var withoutPhoto = [];
    ensureArray(items).forEach(function (item) {
      (ownImage(item) ? withPhoto : withoutPhoto).push(item);
    });
    return withPhoto.concat(withoutPhoto);
  }

  // Bloco de mídia: foto real quando existir; senão, tile tipográfico com a inicial e a categoria.
  // Evita que a foto aérea genérica represente lugares diferentes como se fosse deles.
  function mediaMarkup(item, imgClass, width, height) {
    var ownRaw = ownImageRaw(item);
    var own = ownRaw ? safeImage(ownRaw) : "";
    var name = itemName(item);
    if (own) {
      return '<img src="' + own + '" class="' + imgClass + '" alt="' + escapeHtml(name) + '" loading="lazy" decoding="async" width="' + (width || 640) + '" height="' + (height || 360) + '">';
    }
    return '<div class="' + imgClass + ' card-media-typographic" aria-hidden="true">' +
      '<span class="card-media-initial">' + escapeHtml(name.charAt(0)) + '</span>' +
      '<span class="card-media-category">' + escapeHtml(itemCategory(item)) + '</span>' +
    '</div>';
  }

  function itemName(item) {
    return clean(item && (item.nome || item.name)) || "Empreendimento";
  }

  function itemDescription(item) {
    return clean(item && (item.descricao || item.description || item.subtitulo));
  }

  function itemCategory(item) {
    return clean(item && (item.categoria || item.category && item.category.label)) || "Turismo";
  }

  // Notas internas do cadastro não aparecem ao visitante: lembretes "(confirmar …)"
  // no endereço e o telefone de preenchimento (42) 3532-0000.
  function itemAddress(item) {
    return clean(item && (item.endereco || item.localizacao || item.address)).replace(/\s*\(confirmar[^)]*\)/gi, "").trim();
  }

  function itemPhone(item) {
    var phone = clean(item && (item.telefone || item.contact && item.contact.phone));
    return /^\(?42\)?\s*3532-?0000$/.test(phone) ? "" : phone;
  }

  function itemHours(item) {
    return clean(item && (item.horario || item.content && item.content.openingHours));
  }

  function priority(item) {
    var value = Number(item && item.display && item.display.priority);
    return Number.isFinite(value) ? value : 0;
  }

  function sortEditorial(items) {
    return ensureArray(items).slice().sort(function (left, right) {
      var priorityDifference = priority(right) - priority(left);
      if (priorityDifference) return priorityDifference;
      return itemName(left).localeCompare(itemName(right), "pt-BR");
    });
  }

  function allEstablishments(data) {
    var seen = {};
    return sortEditorial([]
      .concat(ensureArray(data && data.pontos))
      .concat(ensureArray(data && data.hospedagens))
      .concat(ensureArray(data && data.restaurantes)))
      .filter(function (item) {
        var key = clean(item && (item.id || item.slug || item.nome));
        if (!key || seen[key]) return false;
        seen[key] = true;
        return true;
      });
  }

  function emptyMarkup(label) {
    return '<p class="public-establishments-empty" role="status">' + escapeHtml(label) + '</p>';
  }

  function renderFeatured(target, data) {
    // Todos os registros marcados como destaque no CMS são exibidos (decisão editorial
    // oficial); os que têm foto própria vêm primeiro, preservando a prioridade do CMS.
    var items = photoFirst(allEstablishments(data).filter(function (item) {
      return item && item.display && item.display.featured === true;
    }));
    if (!items.length) {
      // O HTML já traz uma seleção editorial estática; não trocá-la por estado vazio.
      if (target.children.length) return;
    }
    target.innerHTML = items.length ? items.map(function (item) {
      var name = itemName(item);
      return '<article class="featured-experience-card" data-establishment-id="' + escapeHtml(item.id || item.slug) + '">' +
        '<a href="' + itemUrl(item) + '">' +
          mediaMarkup(item, "featured-experience-media") +
          '<div class="featured-experience-body"><span>' + escapeHtml(itemCategory(item)) + '</span><h3>' + escapeHtml(name) + '</h3><small>Conhecer</small>' + cardCredit(item) + '</div>' +
        '</a>' +
      '</article>';
    }).join("") : emptyMarkup("Nenhum empreendimento foi marcado como destaque.");
  }

  function renderAttractions(target, data) {
    var all = sortEditorial(data && data.pontos);
    var items = photoFirst(all).slice(0, 12);
    target.setAttribute("data-catalog-total", String(all.length));
    var totalEl = document.querySelector("[data-attractions-total]");
    if (totalEl && all.length) totalEl.textContent = String(all.length);
    target.innerHTML = items.length ? items.map(function (item) {
      var name = itemName(item);
      return '<a class="attraction-card public-establishment-card-link" href="' + itemUrl(item) + '" data-establishment-id="' + escapeHtml(item.id || item.slug) + '">' +
        mediaMarkup(item, "attraction-image") +
        '<div class="attraction-content"><div class="attraction-icon" aria-hidden="true">📍</div><h3 class="attraction-title">' + escapeHtml(name) + '</h3>' +
        '<p class="attraction-desc">' + escapeHtml(itemDescription(item)) + '</p><p class="public-establishment-cta">Ver mais →</p>' + cardCredit(item) + '</div>' +
      '</a>';
    }).join("") : emptyMarkup("Nenhum atrativo publicado no momento.");
  }

  function renderHomeLodging(target, data) {
    var items = sortEditorial(data && data.hospedagens).slice(0, 8);
    target.innerHTML = items.length ? items.map(function (item) {
      var phone = itemPhone(item);
      var address = itemAddress(item);
      return '<article class="hotel-card" data-establishment-id="' + escapeHtml(item.id || item.slug) + '">' +
        '<a class="public-establishment-card-link" href="' + itemUrl(item) + '">' +
          mediaMarkup(item, "hotel-media") + '<h3 class="hotel-name">' + escapeHtml(itemName(item)) + '</h3>' +
          '<p class="hotel-description">' + escapeHtml(itemDescription(item)) + '</p>' +
          '<div class="hotel-contact">' + (phone ? '<span>📞 ' + escapeHtml(phone) + '</span>' : '') + (address ? '<span>📍 ' + escapeHtml(address) + '</span>' : '') + '</div>' +
          cardCredit(item) +
        '</a>' +
      '</article>';
    }).join("") : emptyMarkup("Nenhuma hospedagem publicada no momento.");
  }

  function renderRestaurants(target, data) {
    var items = sortEditorial(data && data.restaurantes);
    target.innerHTML = items.length ? items.map(function (item) {
      var contacts = [];
      if (itemAddress(item)) contacts.push('<span>📍 ' + escapeHtml(itemAddress(item)) + '</span>');
      if (itemHours(item)) contacts.push('<span>🕐 ' + escapeHtml(itemHours(item)) + '</span>');
      if (itemPhone(item)) contacts.push('<span>📞 ' + escapeHtml(itemPhone(item)) + '</span>');
      return '<a class="restaurant-card public-establishment-card-link" href="' + itemUrl(item) + '" data-establishment-id="' + escapeHtml(item.id || item.slug) + '">' +
        '<div class="restaurant-icon" aria-hidden="true">🍽️</div><div class="restaurant-info"><h4>' + escapeHtml(itemName(item)) + '</h4>' +
        '<span class="cuisine">' + escapeHtml(itemCategory(item)) + '</span><div class="contact">' + contacts.join("") + '</div></div>' +
      '</a>';
    }).join("") : emptyMarkup("Nenhum estabelecimento gastronômico publicado no momento.");
  }

  // Subtipo usado pelos filtros de Onde Ficar. Antes, tudo que não era pousada/rural caía
  // em "Hotéis" (ex.: Canil e CT São José — hotel de animais — e Pesqueiro do Luizão).
  // Agora "hotel" exige o termo no nome/tags; o restante aparece somente em "Todos".
  function lodgingSubtype(item) {
    var source = clean([itemName(item), itemCategory(item), ensureArray(item && item.tags).join(" ")].join(" ")).toLowerCase();
    if (/pousada|chale|chalé/.test(source)) return "pousada";
    if (/rural|sitio|sítio|fazenda|colonia|colônia/.test(source)) return "rural";
    var nameAndTags = clean([itemName(item), ensureArray(item && item.tags).join(" ")].join(" ")).toLowerCase();
    if (/\bhot[eé]is\b|\bhotel\b/.test(nameAndTags) && !/\bpet\b|canil|c[aã]es/.test(nameAndTags)) return "hotel";
    return "outros";
  }

  // Hospedagem para pessoas: hotel/creche de animais não entra (o registro continua no
  // mapa, em Serviços), nem registro genérico sem nenhum contato ("Pousadas Rurais"),
  // que não é um empreendimento específico.
  function isPetService(item) {
    var source = clean([itemName(item), itemDescription(item), ensureArray(item && item.tags).join(" ")].join(" ")).toLowerCase();
    return /\bpet\b|canil|c[aã]es de pastoreio/.test(source);
  }

  function isGenericListing(item) {
    var contact = (item && item.contact) || {};
    var hasContact = itemPhone(item) || clean(item && (item.whatsapp || item.email || item.site || item.instagram)) ||
      clean(contact.whatsapp || contact.email || contact.website || contact.instagram);
    return !hasContact && /^(pousadas|hot[eé]is|op[cç][oõ]es)\b/i.test(itemName(item));
  }

  function isPeopleLodging(item) {
    return !!item && !isPetService(item) && !isGenericListing(item);
  }

  function renderLodging(target, data) {
    var items = sortEditorial(data && data.hospedagens).filter(isPeopleLodging);
    target.innerHTML = items.length ? items.map(function (item) {
      var tags = ensureArray(item && item.tags).slice(0, 4);
      var phone = itemPhone(item);
      var address = itemAddress(item);
      return '<article class="hotel-card" data-category="' + lodgingSubtype(item) + '" data-establishment-id="' + escapeHtml(item.id || item.slug) + '">' +
        '<a class="public-establishment-card-link" href="' + itemUrl(item) + '">' +
          mediaMarkup(item, "hotel-image") +
          '<div class="hotel-content"><span class="hotel-category">' + escapeHtml(itemCategory(item)) + '</span><h3>' + escapeHtml(itemName(item)) + '</h3>' +
          '<p class="description">' + escapeHtml(itemDescription(item)) + '</p>' +
          '<div class="hotel-amenities">' + tags.map(function (tag) { return '<span class="amenity">✓ ' + escapeHtml(tag) + '</span>'; }).join("") + '</div>' +
          '<div class="hotel-contact">' + (phone ? '<span>📞 ' + escapeHtml(phone) + '</span>' : '') + (address ? '<span>📍 ' + escapeHtml(address) + '</span>' : '') + '</div>' + cardCredit(item) + '</div>' +
        '</a>' +
      '</article>';
    }).join("") : emptyMarkup("Nenhuma hospedagem publicada no momento.");
  }

  var renderers = {
    featured: renderFeatured,
    attractions: renderAttractions,
    "home-lodging": renderHomeLodging,
    restaurants: renderRestaurants,
    lodging: renderLodging
  };

  function renderAll(data) {
    var snapshot = data || window.TURISMO_DATA || {};
    Array.prototype.forEach.call(document.querySelectorAll("[data-public-establishments]"), function (target) {
      var renderer = renderers[target.getAttribute("data-public-establishments")];
      if (renderer) renderer(target, snapshot);
    });
    if (typeof window.dispatchEvent === "function" && typeof window.Event === "function") {
      window.dispatchEvent(new window.Event("resize"));
    }
    return snapshot;
  }

  function boot() {
    Promise.resolve(window.TURISMO_DATA_READY || window.TURISMO_DATA).then(renderAll).catch(function () {
      renderAll(window.TURISMO_DATA || {});
    });
  }

  window.PublicEstablishmentsRenderer = {
    allEstablishments: allEstablishments,
    itemUrl: itemUrl,
    isPeopleLodging: isPeopleLodging,
    renderAll: renderAll,
    renderers: renderers
  };

  window.addEventListener("turismo:data-ready", function () {
    renderAll(window.TURISMO_DATA || {});
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window, document);
