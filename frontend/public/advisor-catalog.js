(function (root) {
  'use strict';
  var advisors = Object.freeze([
    'Cotización en línea',
    'Arq. Max Herrera',
    'Arq. Marco Rodriguez',
    'Arq. Daniel Aguilar',
    'Arq. Monse Galicia',
    'Arq. Itzel Suarez',
    'Lic. Alma Altamirano'
  ]);
  root.MHGAdvisorCatalog = Object.freeze({
    advisors: advisors,
    isValid: function (value) { return advisors.indexOf(value) >= 0; }
  });
})(window);
