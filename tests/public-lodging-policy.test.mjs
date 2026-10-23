import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source=await readFile(new URL('../js/public-establishments-renderer.js',import.meta.url),'utf8');
function renderer(){
  const document={readyState:'loading',addEventListener(){},querySelectorAll:()=>[]};
  const window={addEventListener(){},dispatchEvent(){},Event:class{},document};
  vm.runInNewContext(source,{window,document,console});
  return window.PublicEstablishmentsRenderer;
}
function hotel(overrides={}){
  return {id:'sadas-hotel',name:'SADAS HOTEL',categoria:'Hospedagem',description:'HOSPEDAGEM, COM UM ÓTIMO CAFÉ DA MANHÃ, PET-FRIENDLY',contact:{phone:'(42) 99999-0000'},...overrides};
}
function lodgingMarkup(items){const target={innerHTML:''};renderer().renderers.lodging(target,{hospedagens:items});return target.innerHTML;}

test('hotel pet-friendly permanece elegível e aparece em Onde Ficar como hotel',()=>{
  assert.equal(renderer().isPeopleLodging(hotel()),true);
  const html=lodgingMarkup([hotel()]);
  assert.match(html,/data-category="hotel"/);
  assert.match(html,/data-establishment-id="sadas-hotel"/);
  assert.match(html,/HOSPEDAGEM, COM UM ÓTIMO CAFÉ DA MANHÃ, PET-FRIENDLY/);
});
test('comodidade pet friendly com espaço ou hífen em tags não retira o filtro Hotéis',()=>{
  for(const tag of ['pet-friendly','Pet Friendly']){
    const item=hotel({description:'Hospedagem para visitantes.',tags:[tag]});
    assert.equal(renderer().isPeopleLodging(item),true);
    assert.match(lodgingMarkup([item]),/data-category="hotel"/);
  }
});
test('canil e hotel de animais continuam fora da listagem de hospedagem para pessoas',()=>{
  for(const item of [hotel({name:'Canil e CT São José'}),hotel({name:'Hotel Pet',description:'Hospedagem de animais'}),hotel({name:'Creche Pet',description:'Serviço pet-friendly'}),hotel({name:'Centro de cães de pastoreio'})]){
    assert.equal(renderer().isPeopleLodging(item),false);
    assert.doesNotMatch(lodgingMarkup([item]),/class="hotel-card"/);
  }
});
test('pet-friendly não remove o sinal explícito de canil no mesmo cadastro',()=>{
  const item=hotel({name:'Canil pet-friendly',description:'Hotel para animais'});
  assert.equal(renderer().isPeopleLodging(item),false);
});
test('pousada pet-friendly preserva sua categoria na listagem',()=>{
  const item=hotel({name:'Pousada Exemplo',id:'pousada-exemplo',description:'Pousada pet friendly'});
  assert.match(lodgingMarkup([item]),/data-category="pousada"/);
});
test('cadastro genérico sem contato continua excluído e hospedagem rural mantém subtipo',()=>{
  assert.equal(renderer().isPeopleLodging({name:'Pousadas Rurais',description:'Opções de hospedagem'}),false);
  assert.match(lodgingMarkup([hotel({name:'Fazenda Exemplo',description:'Hospedagem rural'})]),/data-category="rural"/);
});
