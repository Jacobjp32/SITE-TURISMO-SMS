(function () {
  "use strict";

  function makeEntry(title, category, description, url, keywords) {
    return {
      title: title,
      category: category,
      description: description,
      url: url,
      keywords: keywords
    };
  }

  function fromCollection(collection, mapper) {
    if (!Array.isArray(collection)) return [];
    return collection.map(mapper).filter(Boolean);
  }

  function getData() {
    if (window.TURISMO_DATA) {
      return window.TURISMO_DATA;
    }

    return {
      pontos: window.TURISMO_PONTOS,
      rotas: window.TURISMO_ROTAS,
      hospedagens: window.TURISMO_HOSPEDAGENS,
      restaurantes: window.TURISMO_RESTAURANTES,
      eventos: window.TURISMO_EVENTOS,
      informacoesEssenciais: window.TURISMO_INFORMACOES_ESSENCIAIS
    };
  }

  var fixedEntries = [
    makeEntry("Mapa Turístico", "Explore", "Visualização geral de pontos, rotas e referências do turismo local.", "/mapa-turistico", ["mapa", "turistico", "rotas", "pontos", "guia"]),
    makeEntry("Roteiros", "Explore", "As rotas e experiencias agora estao reunidas no mapa turistico interativo.", "/mapa-turistico?grupo=roteiros", ["roteiros", "rotas", "experiencias", "trajeto", "mapa"]),
    makeEntry("Galeria", "Explore", "Fotos e registros visuais das paisagens, cultura e eventos.", "/galeria", ["galeria", "fotos", "midias", "imagens"]),
    makeEntry("Pontos Turísticos", "Explore", "Atrações e locais de interesse para conhecer em São Mateus do Sul.", "/mapa-turistico?grupo=pontos-turisticos", ["atracoes", "pontos", "turisticos", "locais"]),
    makeEntry("Experiências", "Explore", "Vivências culturais, rurais, gastronômicas e náuticas.", "/mapa-turistico?grupo=roteiros", ["experiencias", "vivencias", "turismo", "rural", "cultura"]),
    makeEntry("Notícias", "Agenda", "Atualizações, chamadas públicas e novidades do turismo.", "/noticias", ["noticias", "novidades", "portal", "turismo"]),
    makeEntry("São Mateus do Sul", "Sobre", "Visão geral sobre identidade, cultura e posicionamento do destino.", "/#sobre", ["sao mateus do sul", "cidade", "destino", "sobre"]),
    makeEntry("História", "Sobre", "Origem, colonização e marcos históricos do município.", "/#sobre", ["historia", "origem", "colonizacao", "memoria"]),
    makeEntry("Capital Polonesa do Paraná", "Sobre", "Título e legado da herança polonesa na cidade.", "/mapa-turistico?categoria=Cultura", ["capital polonesa", "polonesa", "imigracao", "cultura"]),
    makeEntry("Terra da Erva-mate", "Sobre", "Importância econômica e cultural da erva-mate para a região.", "/mapa-turistico?grupo=roteiros", ["terra da erva-mate", "erva-mate", "economia", "tradicao"]),
    makeEntry("Xisto", "Sobre", "Dimensão histórica e produtiva ligada ao xisto no município.", "/#sobre", ["xisto", "terra do xisto", "industria", "energia"]),
    makeEntry("Institucional", "Sobre", "Transparência, conselho, fundo municipal e informações oficiais.", "/transparencia", ["institucional", "transparencia", "comtur", "fumtur", "prefeitura"])
  ];

  var data = getData();

  var pontoEntries = fromCollection(data.pontos, function (item) {
    return makeEntry(item.nome, "Ponto Turístico", item.descricao, item.url || "/mapa-turistico?grupo=pontos-turisticos", item.tags || []);
  });

  var rotaEntries = fromCollection(data.rotas, function (item) {
    return makeEntry(item.nome, "Agenda" === item.categoria ? item.categoria : "Explore", item.descricao, item.url || "/mapa-turistico?grupo=roteiros", item.tags || []);
  });

  var hospedagemEntries = fromCollection(data.hospedagens, function (item) {
    return makeEntry(item.nome, "Planeje sua visita", item.descricao, item.url || "/mapa-turistico?categoria=Hospedagem", (item.tags || []).concat([item.categoria || "hospedagem", item.localizacao || ""]));
  });

  var restauranteEntries = fromCollection(data.restaurantes, function (item) {
    return makeEntry(item.nome, "Sabores", item.descricao, item.url || "/mapa-turistico?categoria=Gastronomia", (item.tags || []).concat([item.categoria || "restaurantes"]));
  });

  var eventoEntries = fromCollection(data.eventos, function (item) {
    return makeEntry(item.nome, "Agenda", item.descricao, item.url || "/eventos", (item.tags || []).concat([item.categoria || "evento", item.periodo || "", item.local || ""]));
  });

  var infoEntries = fromCollection(data.informacoesEssenciais, function (item) {
    return makeEntry(item.nome, "Planeje sua visita", item.descricao, item.url || "/#visitor-guide-title", item.tags || []);
  });

  window.TURISMO_SEARCH_INDEX = fixedEntries
    .concat(pontoEntries)
    .concat(rotaEntries)
    .concat(restauranteEntries)
    .concat(eventoEntries)
    .concat(hospedagemEntries)
    .concat(infoEntries);
})();
