(function(root) {
  'use strict';

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function canonical(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    return '{' + Object.keys(value).sort().map(function(key) {
      return JSON.stringify(key) + ':' + canonical(value[key]);
    }).join(',') + '}';
  }

  function localDateTimeToIso(date, time) {
    var parsed = new Date(String(date) + 'T' + String(time) + ':00');
    if (!date || !time || !Number.isFinite(parsed.getTime())) throw new Error('Fecha u hora inválida.');
    return parsed.toISOString();
  }

  function openStreetMapUrl(latitude, longitude) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return '';
    var lat = latitude.toFixed(6);
    var lng = longitude.toFixed(6);
    return 'https://www.openstreetmap.org/?mlat=' + lat + '&mlon=' + lng + '#map=18/' + lat + '/' + lng;
  }

  function hardwareSnapshot(state) {
    return {
      bisagras: { selection: state.bisagra || null, completed: !!state.herrajesAtendidos.bisagras },
      correderas: { selection: state.corredera || null, completed: !!state.herrajesAtendidos.correderas },
      cajones: { selections: copy(state.cajones || []), not_applicable: !!state.herrajesNoAplica.cajones, completed: !!state.herrajesAtendidos.cajones },
      basureros: { selection: state.basurero || null, not_applicable: !!state.herrajesNoAplica.basureros, completed: !!state.herrajesAtendidos.basureros },
      especiero: { selection: state.especias || null, not_applicable: !!state.herrajesNoAplica.especiero, completed: !!state.herrajesAtendidos.especiero },
      modulos_especiales: { selections: copy(state.modulos || []), not_applicable: !!state.herrajesNoAplica.modulos, completed: !!state.herrajesAtendidos.modulos },
    };
  }

  function buildPayload(state) {
    if (!root.MHGAdvisorCatalog || !root.MHGAdvisorCatalog.isValid(state.cliente.asesor)) {
      throw new Error('Selecciona quién te atendió.');
    }
    var requested = localDateTimeToIso(state.cliente.fecha, state.cliente.hora);
    var hardware = hardwareSnapshot(state);
    var countertop = {
      category: state.cubiertaCategoria || null,
      material: state.cubierta || null,
      reference_price: state.cubPrecio || null,
    };
    var finish = state.cubiertaVariante ? copy(state.cubiertaVariante) : null;
    var extras = (state.extras || []).map(function(label) { return { label: label }; });
    var selections = {
      situation: state.situacion,
      interior_board: state.interior,
      exterior_fronts: copy(state.frentes || {}),
      hardware: hardware,
      countertop: countertop,
      finish: finish,
      extras: extras,
    };
    var configuration = {
      current_situation: state.situacion,
      interior_board: { id: state.interior },
      exterior_fronts: copy(state.frentes || {}),
      hardware: hardware,
      countertop: countertop,
      finish: finish,
      extras: extras,
      address: state.cliente.dir,
      latitude: state.cliente.lat == null ? null : Number(state.cliente.lat),
      longitude: state.cliente.lng == null ? null : Number(state.cliente.lng),
      branch: state.cliente.sucursal,
      advisor: state.cliente.asesor,
      requested_datetime: requested,
      notes: state.cliente.obs || null,
      selection_version: 1,
      selections: selections,
    };
    return {
      configuration: configuration,
      appointment: {
        requested_datetime: requested,
        branch: configuration.branch,
        address: configuration.address,
        latitude: configuration.latitude,
        longitude: configuration.longitude,
        notes: configuration.notes,
      },
      contact: {
        source: 'kitchen_customizer',
        name: state.cliente.nombre,
        phone: state.cliente.tel,
        email: state.cliente.email || null,
        message: state.cliente.obs || null,
      },
    };
  }

  function createKey(cryptoApi) {
    if (cryptoApi && typeof cryptoApi.randomUUID === 'function') return cryptoApi.randomUUID();
    if (!cryptoApi || typeof cryptoApi.getRandomValues !== 'function') throw new Error('Este navegador no puede generar un identificador seguro.');
    var bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    var hex = Array.from(bytes, function(value) { return value.toString(16).padStart(2, '0'); }).join('');
    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
  }

  function identityFor(previous, payload, cryptoApi) {
    var fingerprint = canonical(payload);
    if (previous && previous.fingerprint === fingerprint && previous.key) return previous;
    return { key: createKey(cryptoApi), fingerprint: fingerprint };
  }

  function parseReceipt(value) {
    if (!value || typeof value !== 'object') throw new Error('La API devolvió una respuesta inválida.');
    var uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    var folio = /^(?:COC-[0-9]{5,}|MHG-[A-Z0-9]+)$/;
    if (!uuid.test(value.submission_id) || !uuid.test(value.configuration_id) || !uuid.test(value.appointment_id) || !uuid.test(value.lead_id) || typeof value.folio !== 'string' || !folio.test(value.folio) || value.status !== 'received') {
      throw new Error('La API devolvió una respuesta inválida.');
    }
    return {
      submission_id: value.submission_id,
      configuration_id: value.configuration_id,
      appointment_id: value.appointment_id,
      lead_id: value.lead_id,
      folio: value.folio,
      status: value.status,
      replayed: value.replayed === true,
    };
  }

  async function send(apiBaseUrl, payload, identity, fetcher) {
    var base;
    try { base = new URL(apiBaseUrl); } catch (_) { throw new Error('El envío en línea aún no está configurado.'); }
    if (base.protocol !== 'http:' && base.protocol !== 'https:') throw new Error('El envío en línea aún no está configurado.');
    var response;
    try {
      response = await fetcher(base.href.replace(/\/$/, '') + '/kitchen-submissions', {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': identity.key },
        body: JSON.stringify(payload),
      });
    } catch (_) {
      throw new Error('No pudimos conectar con MHG. Revisa tu conexión e inténtalo nuevamente.');
    }
    var body;
    try { body = await response.json(); } catch (_) { throw new Error('MHG recibió una respuesta que no pudimos interpretar.'); }
    if (!response.ok) {
      throw new Error((body && body.error && body.error.message) || 'No pudimos enviar tu solicitud.');
    }
    return parseReceipt(body);
  }

  root.MHGKitchenSubmission = Object.freeze({
    buildPayload: buildPayload,
    canonical: canonical,
    identityFor: identityFor,
    localDateTimeToIso: localDateTimeToIso,
    openStreetMapUrl: openStreetMapUrl,
    parseReceipt: parseReceipt,
    send: send,
  });
})(typeof window !== 'undefined' ? window : globalThis);
