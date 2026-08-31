/*********************************************************
 * AGENDA INTELIGENTE DE CLIENTES - Google Apps Script
 * -------------------------------------------------------
 * Base de datos: Google Sheets
 * Citas: Google Calendar
 *
 * FUNCIONES DEL MENU (puntos de entrada de la web app):
 *   - getTodas()
 *   - parseYguardar(texto, tipoOverride)
 *   - guardar(tipo, nombre, fechaISO, hora, telefono, direccion, comentario)
 *   - posponer(id, nuevaFechaISO, nuevaHora)
 *   - completar(id)
 *   - comentar(id, comentario)
 *   - gestionar(id, gestion)
 *   - eliminar(id)
 *********************************************************/

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Agenda Inteligente de Clientes')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ============ CONFIGURACIÓN DE LA HOJA ============ */
// Cambia por el ID de tu hoja de cálculo: la parte de la URL
// https://docs.google.com/spreadsheets/d/ <ID_AQUI> /edit
var SPREADSHEET_ID = 'PEGA-AQUI-EL-ID-DE-TU-HOJA';

/* ============ HOJA DE CÁLCULO (base de datos) ============ */
function getSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sh = ss.getSheetByName('Agenda');
  if (!sh) {
    sh = ss.insertSheet('Agenda');
    sh.appendRow(['ID', 'Tipo', 'Cliente', 'Fecha', 'Hora', 'Telefono',
      'Direccion', 'Gestion', 'Comentario', 'Estado', 'Creado', 'EventoCal']);
    sh.getRange(1, 1, 1, 12).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function ensureHeaders_(sh) {
  var headers = ['ID', 'Tipo', 'Cliente', 'Fecha', 'Hora', 'Telefono',
    'Direccion', 'Gestion', 'Comentario', 'Estado', 'Creado', 'EventoCal'];
  var actual = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (actual[i] !== headers[i]) {
      sh.getRange(1, i + 1).setValue(headers[i]);
    }
  }
}

function newId_() {
  return 'A' + new Date().getTime() + Math.floor(Math.random() * 1000);
}

/* ============ LEER ============ */
function getTodas() {
  var sh = getSheet_();
  ensureHeaders_(sh);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var data = sh.getRange(2, 1, last - 1, 12).getValues();
  var out = [];
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (!r[0]) continue;
    out.push({
      id: r[0],
      tipo: r[1],
      nombre: r[2],
      fecha: r[3],
      hora: r[4],
      telefono: r[5],
      direccion: r[6],
      gestion: r[7],
      comentario: r[8],
      estado: r[9] || 'Pendiente',
      eventoCal: r[11] || ''
    });
  }
  return sortPorFecha_(out);
}

function sortPorFecha_(list) {
  return list.sort(function (a, b) {
    var da = fechaVal_(a), db = fechaVal_(b);
    return da - db;
  });
}

function fechaVal_(item) {
  var f = new Date(item.fecha);
  if (item.hora) {
    var hp = String(item.hora).split(':');
    f.setHours(parseInt(hp[0], 10) || 0, parseInt(hp[1], 10) || 0, 0, 0);
  }
  return f.getTime();
}

/* ============ INTERPRETACIÓN / PARSEO (IA offline) ============ */
// Solo interpreta (NO guarda). Para vista previa.
function interpretar(texto, tipoOverride) {
  texto = (texto || '').trim();
  var p = parse_(texto);
  if (tipoOverride) p.tipo = tipoOverride;
  return p;
}

// Interpreta Y guarda de una vez.
function parseYguardar(texto, tipoOverride) {
  texto = (texto || '').trim();
  var p = parse_(texto);
  if (tipoOverride) p.tipo = tipoOverride;
  return guardar(p.tipo, p.nombre, p.fecha, p.hora, p.telefono, p.direccion, '');
}

function parse_(texto) {
  var t = ' ' + texto.toLowerCase() + ' ';
  t = t.replace(/[.,!?¿¡;:()]/g, ' ').replace(/\s+/g, ' ');

  // Tipo
  var tipo = 'visita';
  if (/llamar|llama|comunicar|contactar/.test(t)) tipo = 'llamada';

  // Nombre
  var nombre = extraerNombre_(texto) || 'Cliente';

  // Fecha
  var fecha = extraerFecha_(t);

  // Hora
  var hora = extraerHora_(t);

  // Teléfono
  var telefono = extraerTelefono_(texto);

  // Dirección
  var direccion = extraerDireccion_(texto);

  return { tipo: tipo, nombre: nombre, fecha: fecha, hora: hora,
    telefono: telefono, direccion: direccion };
}

function extraerNombre_(texto) {
  var t = ' ' + texto.toLowerCase().replace(/[.,!?¿¡;]/g, ' ') + ' ';
  t = t.replace(/\bvisitar\s+(a\s+)?(la|el|las|los|al|l\s)?\s*/, '');
  t = t.replace(/\bvisita\s+(a\s+)?(la|el|las|los|al|l\s)?\s*/, '');
  t = t.replace(/\bllamar\s+(a\s+)?(la|el|las|los|al|l\s)?\s*/, '');
  t = t.replace(/\bver\s+(a\s+)?(la|el|las|los|al|l\s)?\s*/, '');
  t = t.replace(/\bcontactar\s+(a\s+)?(la|el|las|los|al|l\s)?\s*/, '');
  t = t.replace(/\bllamada\s+(a\s+)?(la|el|las|los|al|l\s)?\s*/, '');
  t = t.replace(/\bcliente\s*/, '');
  t = t.replace(/\b(la\s+)?(señora|senora|sra|sr\.?a|doña|dona|srta)\s+/g, '');
  t = t.replace(/\b(la\s+)?(señor|senor|sr|don|licenciado|licenciada|ingeniero|ingeniera|doctor|doctora|dr|dra|profesor|profesora)\s+/g, '');
  t = t.replace(/\btel(?:efono|éfono|f)?\s*[:.]?/, '');
  t = t.replace(/\b(telefono|teléfono|celular|cel|movil|móvil)\s*[:.]?\s*/, '');
  t = t.replace(/[+\d][\d\s\-]{7,}/g, ' ');
  t = t.replace(/\b\d{1,2}\s+(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/g, '');
  t = t.replace(/\b(lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo)\b/g, '');
  t = t.replace(/\b(pasado\s+manana|pasado\s+mañana|manana|mañana|hoy|semana\s+que\s+viene)\b/g, '');
  t = t.replace(/\b(el|la|los|las|de|del|para|por|a|al|con|durante|dia|fecha|y|luego|despues|después|etc|que)\b/g, ' ');
  t = t.replace(/\b(proximo|proxima|próximo|próxima)\s+(dia|semana|mes)\b/g, ' ');
  t = t.replace(/\b(proximo|proxima|próximo|próxima)\b/g, ' ');
  t = t.replace(/\b(?:a\s+las|a\s+la|las)\s+\d{1,2}(?::\d{2})?\s*(am|pm|de la mañana|de la tarde|de la noche|de la manana)?/g, '');
  t = t.replace(/\b\d{1,2}:\d{2}\b/g, ' ');
  t = t.replace(/\b\d{1,2}\s*(am|pm|de la tarde|de la noche|de la mañana|de la manana)\b/g, ' ');
  t = t.replace(/\b(de\s+la\s+)?(mañana|manana|tarde|noche)\b/g, ' ');
  t = t.replace(/\b(en|calle|carrera|av|avenida|urb|direccion|dirección)\s+[a-zA-Z0-9#]{2,}/g, ' ');
  t = t.replace(/\b\d+\b/g, ' ');
  t = t.replace(/\s+/g, ' ').replace(/\b(al|la|el|las|los)\b/g, ' ').replace(/\s+/g, ' ').trim();
  t = t.replace(/^(a|al|de|el|la|del|con|por)\s+/i, '');
  if (!t) return 'Cliente';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function extraerFecha_(t) {
  var MESES = { 'enero':0,'febrero':1,'marzo':2,'abril':3,'mayo':4,'junio':5,
    'julio':6,'agosto':7,'septiembre':8,'setiembre':8,'octubre':9,
    'noviembre':10,'diciembre':11 };
  var DIAS = { 'lunes':1,'martes':2,'miercoles':3,'miércoles':3,'jueves':4,
    'viernes':5,'sabado':6,'sábado':6,'domingo':0 };
  var hoy = new Date(); hoy.setHours(0,0,0,0);

  var dia = function (n) { var d = new Date(hoy); d.setDate(d.getDate() + n); return fmtISO_(d); };

  if (/pasado\s+(manana|mañana)/.test(t)) return dia(2);
  if (/\b(manana|mañana)\b/.test(t)) return dia(1);
  if (/\bhoy\b/.test(t)) return dia(0);

  for (var name in DIAS) {
    if (t.indexOf(name) !== -1) {
      var dow = DIAS[name];
      var delta = (dow - hoy.getDay() + 7) % 7;
      if (delta === 0) delta = 7;
      return dia(delta);
    }
  }

  var mF = t.match(/(?:el\s+)?(\d{1,2})\s+(?:de\s+)?([a-zA-Z]+)(?:\s+de\s+(\d{4}))?/);
  if (mF && MESES[mF[2]] !== undefined) {
    var year = mF[3] ? parseInt(mF[3], 10) : hoy.getFullYear();
    var d = new Date(year, MESES[mF[2]], parseInt(mF[1], 10));
    d.setHours(0,0,0,0);
    if (d < hoy) d.setFullYear(d.getFullYear() + 1);
    return fmtISO_(d);
  }

  var mN = t.match(/el\s+(\d{1,2})/);
  if (mN) {
    var d2 = new Date(hoy.getFullYear(), hoy.getMonth(), parseInt(mN[1], 10));
    d2.setHours(0,0,0,0);
    if (d2 < hoy) d2.setMonth(d2.getMonth() + 1);
    return fmtISO_(d2);
  }

  var mS = t.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?/);
  if (mS) {
    var mm = parseInt(mS[2], 10) - 1, yy = mS[3] ? parseInt(mS[3], 10) : hoy.getFullYear();
    var d3 = new Date(yy, mm, parseInt(mS[1], 10)); d3.setHours(0,0,0,0);
    if (d3 < hoy) d3.setFullYear(d3.getFullYear() + 1);
    return fmtISO_(d3);
  }

  return dia(7); // por defecto 7 días
}

function fmtISO_(d) {
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

function extraerHora_(t) {
  var m = t.match(/(?:a\s+(?:las|la)|las)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|de la mañana|de la tarde|de la noche)?/);
  if (m) {
    var hh = parseInt(m[1], 10), min = m[2] || '00', suf = (m[3] || '').toLowerCase();
    if (suf.indexOf('pm') !== -1 || suf.indexOf('tarde') !== -1 || suf.indexOf('noche') !== -1) {
      if (hh < 12) hh += 12;
    } else if (suf.indexOf('am') !== -1 && hh === 12) hh = 0;
    return ('0' + hh).slice(-2) + ':' + min;
  }
  var m2 = t.match(/(\d{1,2}):(\d{2})/);
  if (m2) return ('0' + m2[1]).slice(-2) + ':' + m2[2];
  return '';
}

function extraerTelefono_(texto) {
  var m = texto.match(/(?:tel|telefono|teléfono|cel|celular)\s*[:.]?\s*([+\d][\d\s\-]{6,})/i);
  if (m) return m[1].replace(/[^\d+]/g, '');
  var m2 = texto.match(/([+\d][\d\s\-]{7,})/);
  if (m2) return m2[1].replace(/[^\d+]/g, '');
  return '';
}

function extraerDireccion_(texto) {
  var m = texto.match(/(?:direccion|dirección|en|calle|carrera|av|avenida|urb)\s+([a-zA-ZÁÉÍÓÚáéíóúÑñ0-9#\s,.-]{4,})/i);
  if (m) {
    var a = m[1].trim().replace(/\.$/, '');
    return a.charAt(0).toUpperCase() + a.slice(1);
  }
  return '';
}

/* ============ GUARDAR ============ */
function guardar(tipo, nombre, fechaISO, hora, telefono, direccion, comentario) {
  var sh = getSheet_();
  ensureHeaders_(sh);
  var id = newId_();
  var eventos = crearEventoCal_(tipo, nombre, fechaISO, hora, direccion);
  var row = [id, tipo, nombre, fechaISO, hora, telefono, direccion,
    '', comentario, 'Pendiente', new Date(), eventos];
  sh.appendRow(row);
  return getTodas();
}

/* ============ CALENDARIO ============ */
function crearEventoCal_(tipo, nombre, fechaISO, hora, direccion) {
  try {
    var inicio;
    if (hora) {
      var hp = String(hora).split(':');
      inicio = new Date(fechaISO + 'T' + ('0' + hp[0]).slice(-2) + ':' + ('0' + (hp[1] || '00')).slice(-2) + ':00');
    } else {
      inicio = new Date(fechaISO + 'T09:00:00');
    }
    var fin = new Date(inicio.getTime());
    if (tipo === 'llamada') fin.setHours(inicio.getHours() + 1);
    else fin.setHours(inicio.getHours() + 2);

    var titulo = (tipo === 'llamada' ? '📞 Llamada - ' : '🚗 Visita - ') + nombre;
    var desc = 'Tipo: ' + tipo + '\nDirección: ' + (direccion || '');
    var evento = CalendarApp.getDefaultCalendar().createEvent(titulo, inicio, fin, { description: desc });
    return evento.getId();
  } catch (e) {
    return '';
  }
}

/* ============ POSPONER ============ */
function posponer(id, dias) {
  var sh = getSheet_();
  var row = findRow_(sh, id);
  if (row < 2) return getTodas();
  var fechas = sh.getRange(row, 4).getValue();
  var f = new Date(String(fechas));
  f.setDate(f.getDate() + (dias || 0));
  sh.getRange(row, 4).setValue(fmtISO_(f));
  sh.getRange(row, 9).setValue('Fue pospuesta (programada en Google Calendar).');
  return getTodas();
}

function reprogramar(id, nuevaFechaISO, nuevaHora) {
  var sh = getSheet_();
  var row = findRow_(sh, id);
  if (row < 2) return getTodas();
  sh.getRange(row, 4).setValue(nuevaFechaISO);
  if (nuevaHora) sh.getRange(row, 5).setValue(nuevaHora);
  return getTodas();
}

/* ============ GESTIONES Y COMENTARIOS ============ */
function completar(id) {
  var sh = getSheet_();
  var row = findRow_(sh, id);
  if (row < 2) return getTodas();
  sh.getRange(row, 10).setValue('Completado');
  return getTodas();
}

function comentar(id, comentario) {
  var sh = getSheet_();
  var row = findRow_(sh, id);
  if (row < 2) return getTodas();
  var prev = sh.getRange(row, 9).getValue();
  var nuevo = prev ? prev + '\n' + comentario : comentario;
  sh.getRange(row, 9).setValue(nuevo);
  return getTodas();
}

function gestionar(id, gestion) {
  var sh = getSheet_();
  var row = findRow_(sh, id);
  if (row < 2) return getTodas();
  sh.getRange(row, 8).setValue(gestion);
  return getTodas();
}

function eliminar(id) {
  var sh = getSheet_();
  var row = findRow_(sh, id);
  if (row >= 2) sh.deleteRow(row);
  return getTodas();
}

function findRow_(sh, id) {
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}
