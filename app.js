const ENV = (typeof window !== 'undefined' && window.__ENV__) ? window.__ENV__ : {};

let rawUrl = (ENV.SUPABASE_URL || localStorage.getItem('SUPABASE_URL') || '').trim();
let rawKey = (ENV.SUPABASE_ANON_KEY || localStorage.getItem('SUPABASE_ANON_KEY') || '').trim();

if (rawKey.startsWith('http') && !rawUrl.startsWith('http')) {
  const tmp = rawUrl;
  rawUrl = rawKey;
  rawKey = tmp;
}

const urlMatch = rawUrl.match(/https?:\/\/[a-z0-9-]+\.supabase\.co/i);
const SUPABASE_URL = urlMatch ? urlMatch[0] : rawUrl.replace(/\/+$/, '');
const SUPABASE_KEY = rawKey;

if (SUPABASE_URL && localStorage.getItem('SUPABASE_URL') !== SUPABASE_URL) {
  localStorage.setItem('SUPABASE_URL', SUPABASE_URL);
}
if (SUPABASE_KEY && localStorage.getItem('SUPABASE_ANON_KEY') !== SUPABASE_KEY) {
  localStorage.setItem('SUPABASE_ANON_KEY', SUPABASE_KEY);
}

const supabaseClient = (window.supabase && SUPABASE_URL && SUPABASE_KEY) 
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

let tools = [];
let employees = [];
let traceabilityLogs = [];
let currentViewMode = localStorage.getItem('tooltracking_view') || 'grid'; // 'grid' | 'table'
let toolPendingDelete = null;
let currentDetailToolId = null;

const toolsGrid = document.getElementById('toolsGrid');
const toolsTableContainer = document.getElementById('toolsTableContainer');
const toolsTableBody = document.getElementById('toolsTableBody');
const emptyState = document.getElementById('emptyState');
const resultsCount = document.getElementById('resultsCount');

const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const statusFilter = document.getElementById('statusFilter');
const cuadrillaFilter = document.getElementById('cuadrillaFilter');
const btnRefresh = document.getElementById('btnRefresh');

const viewModeGridBtn = document.getElementById('viewModeGrid');
const viewModeTableBtn = document.getElementById('viewModeTable');

const dbStatusBadge = document.getElementById('dbStatusBadge');
const dbStatusText = document.getElementById('dbStatusText');

const statTotal = document.getElementById('statTotal');
const statAvailable = document.getElementById('statAvailable');
const statBorrowed = document.getElementById('statBorrowed');
const statEmployees = document.getElementById('statEmployees');

const modalLoan = document.getElementById('modalLoan');
const modalAddTool = document.getElementById('modalAddTool');
const modalEditTool = document.getElementById('modalEditTool');
const modalDeleteTool = document.getElementById('modalDeleteTool');
const modalAddEmployee = document.getElementById('modalAddEmployee');

const modalToolDetails = document.getElementById('modalToolDetails');
const modalTraceability = document.getElementById('modalTraceability');
const btnOpenTraceability = document.getElementById('btnOpenTraceability');

const formLoan = document.getElementById('formLoan');
const formAddTool = document.getElementById('formAddTool');
const formEditTool = document.getElementById('formEditTool');
const formAddEmployee = document.getElementById('formAddEmployee');

const loanToolId = document.getElementById('loanToolId');
const loanToolSubtitle = document.getElementById('loanToolSubtitle');
const loanEmployeeSelect = document.getElementById('loanEmployeeSelect');

const editToolId = document.getElementById('editToolId');
const editToolName = document.getElementById('editToolName');
const editToolSubtitle = document.getElementById('editToolSubtitle');

const deleteToolTargetText = document.getElementById('deleteToolTargetText');
const btnConfirmDeleteTool = document.getElementById('btnConfirmDeleteTool');

const traceSearchInput = document.getElementById('traceSearchInput');
const traceTypeFilter = document.getElementById('traceTypeFilter');
const btnExportTraceability = document.getElementById('btnExportTraceability');
const traceTableBody = document.getElementById('traceTableBody');
const traceCountBadge = document.getElementById('traceCountBadge');
const traceEmptyState = document.getElementById('traceEmptyState');

let currentUser = JSON.parse(localStorage.getItem('tooltracking_user') || 'null');
const loginOverlay = document.getElementById('loginOverlay');
const formLogin = document.getElementById('formLogin');
const userProfileBadge = document.getElementById('userProfileBadge');
const headerUserName = document.getElementById('headerUserName');
const headerUserRole = document.getElementById('headerUserRole');
const btnLogout = document.getElementById('btnLogout');


document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  setupAuthSystem();
  applyViewMode(currentViewMode);

  if (currentUser) {
    applyUserSession(currentUser);
    await loadData();
    await loadTraceability();
  } else {
    showLoginScreen();
  }
});

function sha256Sync(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';

  const words = [];
  const asciiBitLength = ascii.length * 8;

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  ascii += '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = ((asciiBitLength / maxWord) | 0);
  words[words.length] = (asciiBitLength);

  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = [...hash];

    for (let i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ ((~e) & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
          w[i - 16]
          + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
          + w[i - 7]
          + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
        ) | 0
      );
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (8 * b)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }
  return result;
}

async function hashPassword(plainText) {
  try {
    if (window.crypto && window.crypto.subtle && window.isSecureContext) {
      const msgBuffer = new TextEncoder().encode(plainText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}
  return sha256Sync(plainText);
}


async function loadData() {
  setConnectionStatus('checking', 'Sincronizando...');
  try {
    if (!supabaseClient) {
      throw new Error('Cliente de Supabase no inicializado');
    }

  
    const { data: empData, error: empError } = await supabaseClient
      .from('empleados')
      .select('*')
      .order('nombre', { ascending: true });

    if (empError) throw empError;
    employees = empData || [];


    const { data: toolData, error: toolError } = await supabaseClient
      .from('herramientas')
      .select('*')
      .order('id', { ascending: true });

    if (toolError) throw toolError;
    tools = toolData || [];


    setConnectionStatus('connected', 'En Línea (Supabase)');
    updateStats();
    populateEmployeeSelect();
    renderAllViews();
  } catch (err) {
    console.error('Error al conectar con Supabase:', err);
    setConnectionStatus('error', 'Sin Conexión');
    showToast('Error de conexión con la base de datos: ' + err.message, 'error');
  }
}


function setConnectionStatus(status, text) {
  if (!dbStatusBadge || !dbStatusText) return;
  dbStatusBadge.className = `db-status-badge status-${status}`;
  dbStatusText.textContent = text;
}


function getInitialMockTraceability() {
  const now = Date.now();
  return [
    {
      id: 1,
      herramienta_id: 104,
      herramienta_nombre: 'Martillo Demoledor Hilti TE 2000',
      tipo_movimiento: 'DEVOLUCION',
      operario: 'carlos perez',
      cuadrilla: 1,
      usuario_sistema: 'Jeime Jiménez',
      fecha_hora: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
      observaciones: 'Equipo devuelto en perfecto estado de funcionamiento'
    },
    {
      id: 2,
      herramienta_id: 104,
      herramienta_nombre: 'Martillo Demoledor Hilti TE 2000',
      tipo_movimiento: 'PRESTAMO',
      operario: 'carlos perez',
      cuadrilla: 1,
      usuario_sistema: 'Jeime Jiménez',
      fecha_hora: new Date(now - 1000 * 60 * 60 * 28).toISOString(),
      observaciones: 'Salida para demolición en frente este'
    },
    {
      id: 3,
      herramienta_id: 106,
      herramienta_nombre: 'Amoladora Angular DeWalt 4-1/2"',
      tipo_movimiento: 'DEVOLUCION',
      operario: 'andres gomez',
      cuadrilla: 2,
      usuario_sistema: 'Rhonis Julio',
      fecha_hora: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
      observaciones: 'Devuelta con cable y guarda ajustados'
    },
    {
      id: 4,
      herramienta_id: 106,
      herramienta_nombre: 'Amoladora Angular DeWalt 4-1/2"',
      tipo_movimiento: 'PRESTAMO',
      operario: 'andres gomez',
      cuadrilla: 2,
      usuario_sistema: 'Rhonis Julio',
      fecha_hora: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
      observaciones: 'Asignada para corte de perfiles metálicos'
    },
    {
      id: 5,
      herramienta_id: 101,
      herramienta_nombre: 'Taladro Percutor Bosch 650W',
      tipo_movimiento: 'REGISTRO',
      operario: null,
      cuadrilla: null,
      usuario_sistema: 'Administrador General',
      fecha_hora: new Date(now - 1000 * 60 * 60 * 120).toISOString(),
      observaciones: 'Ingreso inicial a inventario de bodega'
    }
  ];
}

async function loadTraceability() {
  try {
    if (!supabaseClient) return;

    const { data, error } = await supabaseClient
      .from('trazabilidad')
      .select('*')
      .order('fecha_hora', { ascending: false });

    if (error) {
      console.warn('Tabla trazabilidad en Supabase aún no creada o sin permisos. Usando almacenamiento local.', error);
      const local = localStorage.getItem('tooltracking_trazabilidad');
      traceabilityLogs = local ? JSON.parse(local) : getInitialMockTraceability();
      localStorage.setItem('tooltracking_trazabilidad', JSON.stringify(traceabilityLogs));
    } else if (data && data.length > 0) {
      traceabilityLogs = data;
      localStorage.setItem('tooltracking_trazabilidad', JSON.stringify(data));
    } else {
      
      traceabilityLogs = getInitialMockTraceability();
      localStorage.setItem('tooltracking_trazabilidad', JSON.stringify(traceabilityLogs));
      try {
        await supabaseClient.from('trazabilidad').insert(
          traceabilityLogs.map(({ id, ...rest }) => rest)
        );
      } catch (err) {}
    }

    renderTraceability();
  } catch (err) {
    console.error('Error cargando trazabilidad:', err);
    const local = localStorage.getItem('tooltracking_trazabilidad');
    traceabilityLogs = local ? JSON.parse(local) : getInitialMockTraceability();
    renderTraceability();
  }
}

async function registrarTrazabilidad({ herramienta_id, herramienta_nombre, tipo_movimiento, operario, cuadrilla, observaciones }) {
  const supervisorName = currentUser ? (currentUser.nombre || currentUser.email) : 'Supervisor de Bodega';
  const newRecord = {
    herramienta_id,
    herramienta_nombre,
    tipo_movimiento,
    operario: operario || null,
    cuadrilla: cuadrilla || null,
    usuario_sistema: supervisorName,
    fecha_hora: new Date().toISOString(),
    observaciones: observaciones || ''
  };


  traceabilityLogs.unshift({ ...newRecord, id: Date.now() });
  localStorage.setItem('tooltracking_trazabilidad', JSON.stringify(traceabilityLogs));


  if (supabaseClient) {
    try {
      await supabaseClient.from('trazabilidad').insert([newRecord]);
    } catch (err) {
      console.warn('Aviso al insertar en Supabase (trazabilidad):', err);
    }
  }

  renderTraceability();
}

function renderTraceability() {
  if (!traceTableBody) return;

  const searchTerm = traceSearchInput ? traceSearchInput.value.trim().toLowerCase() : '';
  const selectedType = traceTypeFilter ? traceTypeFilter.value : 'all';

  const filtered = traceabilityLogs.filter(log => {
    const matchType = (selectedType === 'all') || (log.tipo_movimiento === selectedType);
    const textTarget = `${log.herramienta_id} ${log.herramienta_nombre} ${log.operario || ''} ${log.usuario_sistema} ${log.observaciones || ''}`.toLowerCase();
    const matchSearch = !searchTerm || textTarget.includes(searchTerm);
    return matchType && matchSearch;
  });

  if (traceCountBadge) {
    traceCountBadge.textContent = `${filtered.length} eventos`;
  }

  if (filtered.length === 0) {
    traceTableBody.innerHTML = '';
    if (traceEmptyState) traceEmptyState.style.display = 'block';
    return;
  }

  if (traceEmptyState) traceEmptyState.style.display = 'none';

  traceTableBody.innerHTML = filtered.map(log => {
    let movementClass = 'prestamo';
    let iconName = 'arrow-up-right';

    switch (log.tipo_movimiento) {
      case 'PRESTAMO':
        movementClass = 'prestamo';
        iconName = 'arrow-up-right';
        break;
      case 'DEVOLUCION':
        movementClass = 'devolucion';
        iconName = 'arrow-down-left';
        break;
      case 'REGISTRO':
        movementClass = 'registro';
        iconName = 'plus-circle';
        break;
      case 'MODIFICACION':
        movementClass = 'modificacion';
        iconName = 'pencil';
        break;
      case 'ELIMINACION':
        movementClass = 'eliminacion';
        iconName = 'trash-2';
        break;
    }

    return `
      <tr>
        <td style="white-space: nowrap; font-size: 0.78rem; color: var(--text-secondary);">
          ${formatDate(log.fecha_hora)}
        </td>
        <td>
          <span class="badge-movement ${movementClass}">
            <i data-lucide="${iconName}" style="width: 12px; height: 12px;"></i>
            ${log.tipo_movimiento}
          </span>
        </td>
        <td>
          <strong>#${log.herramienta_id}</strong> - ${escapeHtml(log.herramienta_nombre)}
        </td>
        <td>
          ${log.operario ? `<strong>${escapeHtml(log.operario)}</strong>` : '<span style="color: var(--text-muted);">-</span>'}
        </td>
        <td>
          ${log.cuadrilla ? `Cuadrilla ${log.cuadrilla}` : '<span style="color: var(--text-muted);">-</span>'}
        </td>
        <td>
          <span style="color: #93c5fd; font-weight: 500;">${escapeHtml(log.usuario_sistema)}</span>
        </td>
        <td style="color: var(--text-secondary); font-size: 0.8rem;">
          ${escapeHtml(log.observaciones || '-')}
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function exportTraceabilityToCSV() {
  if (traceabilityLogs.length === 0) {
    showToast('No hay registros de trazabilidad para exportar', 'warning');
    return;
  }

  const headers = ['ID', 'Fecha y Hora', 'Tipo Movimiento', 'Herramienta ID', 'Nombre Herramienta', 'Operario', 'Cuadrilla', 'Autorizado Por', 'Observaciones'];
  const rows = traceabilityLogs.map(log => [
    log.id || '',
    formatDate(log.fecha_hora),
    log.tipo_movimiento,
    log.herramienta_id,
    `"${(log.herramienta_nombre || '').replace(/"/g, '""')}"`,
    `"${(log.operario || '').replace(/"/g, '""')}"`,
    log.cuadrilla || '',
    `"${(log.usuario_sistema || '').replace(/"/g, '""')}"`,
    `"${(log.observaciones || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Trazabilidad_ToolTracking_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Reporte de trazabilidad exportado a CSV exitosamente', 'success');
}

window.openToolDetailModal = function(id) {
  const tool = tools.find(t => t.id === id);
  if (!tool) return;
  currentDetailToolId = id;

  const isAvailable = tool.estado === 'Disponible';
  let cuadrillaVal = 'Sin asignar';
  if (!isAvailable && tool.prestada_a) {
    const emp = employees.find(e => e.nombre.toLowerCase() === tool.prestada_a.toLowerCase());
    cuadrillaVal = emp ? `Cuadrilla ${emp.cuadrilla}` : 'Sin asignar';
  }


  document.getElementById('detailToolIdBadge').textContent = `#${tool.id}`;
  document.getElementById('detailToolTitle').textContent = tool.nombre;
  document.getElementById('detailFieldId').textContent = `#${tool.id}`;
  document.getElementById('detailFieldName').textContent = tool.nombre;
  document.getElementById('detailFieldEmployee').textContent = tool.prestada_a || 'En Bodega General';
  document.getElementById('detailFieldCuadrilla').textContent = cuadrillaVal;
  document.getElementById('detailFieldLoanDate').textContent = tool.fecha_salida ? formatDate(tool.fecha_salida) : 'No retirado';
  document.getElementById('detailBarcodeText').textContent = `TOOL-${String(tool.id).padStart(4, '0')}-TRACE`;

  const statusDot = document.getElementById('detailStatusDot');
  const statusText = document.getElementById('detailStatusText');
  const timeElapsed = document.getElementById('detailTimeElapsed');

  if (isAvailable) {
    statusDot.className = 'status-dot-large available';
    statusText.textContent = 'Disponible para Préstamo';
    statusText.style.color = 'var(--color-success)';
    timeElapsed.textContent = 'Custodiada en bodega de inventario general';
  } else {
    statusDot.className = 'status-dot-large borrowed';
    statusText.textContent = `Prestada a: ${tool.prestada_a}`;
    statusText.style.color = 'var(--color-warning)';
    timeElapsed.textContent = tool.fecha_salida ? `Tiempo en uso: ${calcElapsedTime(tool.fecha_salida)}` : 'En poder de cuadrilla';
  }


  const historyList = document.getElementById('detailHistoryList');
  const toolLogs = traceabilityLogs.filter(log => log.herramienta_id === tool.id);
  const badgeCount = document.getElementById('detailHistoryCountBadge');
  if (badgeCount) badgeCount.textContent = `${toolLogs.length} eventos`;

  if (toolLogs.length === 0) {
    historyList.innerHTML = `<div class="detail-history-empty">Sin movimientos registrados recientemente para este equipo.</div>`;
  } else {
    historyList.innerHTML = toolLogs.map(log => {
      const isLoan = log.tipo_movimiento === 'PRESTAMO';
      const isReturn = log.tipo_movimiento === 'DEVOLUCION';
      const itemClass = isLoan ? 'loan' : (isReturn ? 'return' : '');

      return `
        <div class="detail-history-item ${itemClass}">
          <div>
            <strong>${log.tipo_movimiento}</strong>: ${log.operario ? `Operario <em>${escapeHtml(log.operario)}</em>` : (log.observaciones || 'Inventario')}
          </div>
          <div style="color: var(--text-muted); font-size: 0.75rem;">
            ${formatDate(log.fecha_hora)}
          </div>
        </div>
      `;
    }).join('');
  }

 
  const footerActions = document.getElementById('detailFooterActions');
  footerActions.innerHTML = `
    <button class="btn btn-secondary btn-sm" onclick="closeModals(); openEditToolModal(${tool.id}, '${escapeQuote(tool.nombre)}')">
      <i data-lucide="pencil"></i> Editar
    </button>
    ${isAvailable ? `
      <button class="btn btn-primary btn-sm" onclick="closeModals(); openLoanModal(${tool.id}, '${escapeQuote(tool.nombre)}')">
        <i data-lucide="arrow-up-right"></i> Prestar Herramienta
      </button>
    ` : `
      <button class="btn btn-success btn-sm" onclick="closeModals(); returnTool(${tool.id})">
        <i data-lucide="arrow-down-left"></i> Recibir en Bodega
      </button>
    `}
  `;

  if (window.lucide) window.lucide.createIcons();
  modalToolDetails.style.display = 'flex';
};

function calcElapsedTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `Hace ${diffDays} día(s) y ${diffHours % 24} hora(s)`;
  if (diffHours > 0) return `Hace ${diffHours} hora(s) y ${diffMins % 60} minuto(s)`;
  return `Hace ${Math.max(1, diffMins)} minuto(s)`;
}


function getFilteredTools() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const selectedCuadrilla = cuadrillaFilter.value;

  return tools.filter(tool => {
    
    const matchName = tool.nombre && tool.nombre.toLowerCase().includes(searchTerm);
    const matchId = tool.id && tool.id.toString().includes(searchTerm);
    const matchEmployee = tool.prestada_a && tool.prestada_a.toLowerCase().includes(searchTerm);
    const matchesSearch = matchName || matchId || matchEmployee;

 
    const matchesStatus = (selectedStatus === 'all') || (tool.estado === selectedStatus);

   
    let matchesCuadrilla = true;
    if (selectedCuadrilla !== 'all') {
      if (tool.estado === 'Prestada' && tool.prestada_a) {
        const emp = employees.find(e => e.nombre.toLowerCase() === tool.prestada_a.toLowerCase());
        matchesCuadrilla = emp && emp.cuadrilla.toString() === selectedCuadrilla;
      } else {
        matchesCuadrilla = false;
      }
    }

    return matchesSearch && matchesStatus && matchesCuadrilla;
  });
}

function renderAllViews() {
  const filteredTools = getFilteredTools();
  resultsCount.textContent = `Mostrando ${filteredTools.length} de ${tools.length} herramientas`;

  if (filteredTools.length === 0) {
    toolsGrid.style.display = 'none';
    toolsTableContainer.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';
  renderToolsGrid(filteredTools);
  renderToolsTable(filteredTools);
  applyViewMode(currentViewMode);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderToolsGrid(toolList) {
  toolsGrid.innerHTML = '';

  toolList.forEach(tool => {
    const isAvailable = tool.estado === 'Disponible';
    const card = document.createElement('div');
    card.className = `tool-card ${isAvailable ? 'status-available' : 'status-borrowed'}`;

    let cuadrillaText = '';
    if (!isAvailable && tool.prestada_a) {
      const emp = employees.find(e => e.nombre.toLowerCase() === tool.prestada_a.toLowerCase());
      cuadrillaText = emp ? `Cuadrilla ${emp.cuadrilla}` : 'Cuadrilla sin asignar';
    }

    const formattedDate = tool.fecha_salida ? formatDate(tool.fecha_salida) : '';

    card.innerHTML = `
      <div>
        <div class="card-top">
          <span class="tool-id-tag">#${tool.id}</span>
          <span class="status-badge ${isAvailable ? 'badge-available' : 'badge-borrowed'}">
            <i data-lucide="${isAvailable ? 'check-circle' : 'clock'}" style="width: 14px; height: 14px;"></i>
            ${escapeHtml(tool.estado || 'Disponible')}
          </span>
        </div>

        <h3 class="tool-name" style="margin-top: 0.75rem; cursor: pointer;" onclick="openToolDetailModal(${tool.id})">
          ${escapeHtml(tool.nombre)}
        </h3>
      </div>

      ${!isAvailable && tool.prestada_a ? `
        <div class="loan-info-box">
          <div class="loan-row">
            <i data-lucide="user" style="width: 14px; height: 14px; color: #94a3b8;"></i>
            <span>En poder de: <strong>${escapeHtml(tool.prestada_a)}</strong></span>
          </div>
          <div class="loan-row">
            <i data-lucide="hard-hat" style="width: 14px; height: 14px; color: #94a3b8;"></i>
            <span>Equipo: <strong>${cuadrillaText}</strong></span>
          </div>
          ${formattedDate ? `
            <div class="loan-row">
              <i data-lucide="calendar" style="width: 14px; height: 14px; color: #94a3b8;"></i>
              <span>Retirado: <strong>${formattedDate}</strong></span>
            </div>
          ` : ''}
        </div>
      ` : `
        <div class="loan-info-box" style="background: rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.2);">
          <div class="loan-row" style="color: #34d399;">
            <i data-lucide="package-check" style="width: 14px; height: 14px;"></i>
            <span>Lista en bodega para préstamo</span>
          </div>
        </div>
      `}

      <div class="card-actions">
        <div class="card-actions-primary">
          ${isAvailable ? `
            <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="openLoanModal(${tool.id}, '${escapeQuote(tool.nombre)}')">
              <i data-lucide="arrow-up-right" style="width: 14px; height: 14px;"></i> Prestar
            </button>
          ` : `
            <button class="btn btn-success btn-sm" style="width: 100%;" onclick="returnTool(${tool.id})">
              <i data-lucide="arrow-down-left" style="width: 14px; height: 14px;"></i> Recibir en Bodega
            </button>
          `}
        </div>
        <div class="card-actions-secondary">
          <button class="btn btn-icon-sm btn-outline-info" title="Ver ficha técnica y detalles" onclick="openToolDetailModal(${tool.id})">
            <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
          </button>
          <button class="btn btn-icon-sm btn-outline-warning" title="Editar herramienta" onclick="openEditToolModal(${tool.id}, '${escapeQuote(tool.nombre)}')">
            <i data-lucide="pencil" style="width: 14px; height: 14px;"></i>
          </button>
          <button class="btn btn-icon-sm btn-outline-danger" title="Eliminar herramienta" onclick="openDeleteModal(${tool.id}, '${escapeQuote(tool.nombre)}')">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </div>
    `;

    toolsGrid.appendChild(card);
  });
}

function renderToolsTable(toolList) {
  toolsTableBody.innerHTML = '';

  toolList.forEach(tool => {
    const isAvailable = tool.estado === 'Disponible';
    const tr = document.createElement('tr');

    let cuadrillaText = '-';
    if (!isAvailable && tool.prestada_a) {
      const emp = employees.find(e => e.nombre.toLowerCase() === tool.prestada_a.toLowerCase());
      cuadrillaText = emp ? `Cuadrilla ${emp.cuadrilla}` : 'Sin asignar';
    }

    const formattedDate = tool.fecha_salida ? formatDate(tool.fecha_salida) : '-';

    tr.innerHTML = `
      <td class="table-tool-id">#${tool.id}</td>
      <td class="table-tool-name" style="cursor: pointer;" onclick="openToolDetailModal(${tool.id})">
        <strong>${escapeHtml(tool.nombre)}</strong>
      </td>
      <td>
        <span class="status-badge ${isAvailable ? 'badge-available' : 'badge-borrowed'}">
          <i data-lucide="${isAvailable ? 'check-circle' : 'clock'}" style="width: 13px; height: 13px;"></i>
          ${escapeHtml(tool.estado || 'Disponible')}
        </span>
      </td>
      <td>${tool.prestada_a ? `<strong>${escapeHtml(tool.prestada_a)}</strong>` : '<span style="color: var(--text-muted); font-size: 0.8125rem;">Bodega</span>'}</td>
      <td>${cuadrillaText}</td>
      <td style="font-size: 0.8125rem; color: var(--text-secondary);">${formattedDate}</td>
      <td>
        <div class="table-actions">
          ${isAvailable ? `
            <button class="btn btn-primary btn-sm" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="openLoanModal(${tool.id}, '${escapeQuote(tool.nombre)}')">
              <i data-lucide="arrow-up-right" style="width: 13px; height: 13px;"></i> Prestar
            </button>
          ` : `
            <button class="btn btn-success btn-sm" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="returnTool(${tool.id})">
              <i data-lucide="arrow-down-left" style="width: 13px; height: 13px;"></i> Recibir
            </button>
          `}
          <button class="btn btn-icon-sm btn-outline-info" title="Ver ficha técnica" onclick="openToolDetailModal(${tool.id})">
            <i data-lucide="eye" style="width: 13px; height: 13px;"></i>
          </button>
          <button class="btn btn-icon-sm btn-outline-warning" title="Editar herramienta" onclick="openEditToolModal(${tool.id}, '${escapeQuote(tool.nombre)}')">
            <i data-lucide="pencil" style="width: 13px; height: 13px;"></i>
          </button>
          <button class="btn btn-icon-sm btn-outline-danger" title="Eliminar herramienta" onclick="openDeleteModal(${tool.id}, '${escapeQuote(tool.nombre)}')">
            <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
          </button>
        </div>
      </td>
    `;

    toolsTableBody.appendChild(tr);
  });
}


function applyViewMode(mode) {
  currentViewMode = mode;
  localStorage.setItem('tooltracking_view', mode);

  if (mode === 'table') {
    toolsGrid.style.display = 'none';
    toolsTableContainer.style.display = 'block';
    viewModeTableBtn.classList.add('active');
    viewModeGridBtn.classList.remove('active');
  } else {
    toolsGrid.style.display = 'grid';
    toolsTableContainer.style.display = 'none';
    viewModeGridBtn.classList.add('active');
    viewModeTableBtn.classList.remove('active');
  }
}


formAddTool.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearInputErrors(formAddTool);

  const idInput = document.getElementById('newToolId');
  const nameInput = document.getElementById('newToolName');

  const idValue = idInput.value.trim();
  const nameValue = nameInput.value.trim();

  let hasError = false;

  const idNum = parseInt(idValue, 10);
  if (!idValue || isNaN(idNum) || idNum <= 0) {
    showFieldError(idInput, 'newToolIdError', 'El código debe ser un número entero mayor a 0.');
    hasError = true;
  } else if (tools.some(t => t.id === idNum)) {
    showFieldError(idInput, 'newToolIdError', `El código #${idNum} ya existe en el inventario.`);
    hasError = true;
  }

  if (!nameValue || nameValue.length < 3) {
    showFieldError(nameInput, 'newToolNameError', 'El nombre debe tener al menos 3 caracteres descriptivos.');
    hasError = true;
  }

  if (hasError) return;

  try {
    const { error } = await supabaseClient
      .from('herramientas')
      .insert([{
        id: idNum,
        nombre: nameValue,
        estado: 'Disponible'
      }]);

    if (error) throw error;

    await registrarTrazabilidad({
      herramienta_id: idNum,
      herramienta_nombre: nameValue,
      tipo_movimiento: 'REGISTRO',
      observaciones: 'Nueva herramienta incorporada al inventario'
    });

    showToast(`Herramienta #${idNum} "${nameValue}" agregada exitosamente`, 'success');
    formAddTool.reset();
    closeModals();
    await loadData();
  } catch (err) {
    console.error('Error al agregar herramienta:', err);
    showToast('Error al registrar en Supabase: ' + err.message, 'error');
  }
});


formAddEmployee.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearInputErrors(formAddEmployee);

  const nameInput = document.getElementById('newEmployeeName');
  const cuadrillaInput = document.getElementById('newEmployeeCuadrilla');

  const nameValue = nameInput.value.trim();
  const cuadrillaValue = parseInt(cuadrillaInput.value, 10);

  let hasError = false;

  
  if (!nameValue || nameValue.length < 3) {
    showFieldError(nameInput, 'newEmployeeNameError', 'El nombre del operario debe tener al menos 3 caracteres.');
    hasError = true;
  } else if (employees.some(emp => emp.nombre.toLowerCase() === nameValue.toLowerCase())) {
    showFieldError(nameInput, 'newEmployeeNameError', 'Ya existe un operario registrado con este nombre.');
    hasError = true;
  }

  if (hasError) return;

  try {
    const { error } = await supabaseClient
      .from('empleados')
      .insert([{
        nombre: nameValue,
        cuadrilla: cuadrillaValue
      }]);

    if (error) throw error;

    showToast(`Operario "${nameValue}" asignado a Cuadrilla ${cuadrillaValue}`, 'success');
    formAddEmployee.reset();
    closeModals();
    await loadData();
  } catch (err) {
    console.error('Error al registrar empleado:', err);
    showToast('Error al registrar en Supabase: ' + err.message, 'error');
  }
});


window.openEditToolModal = function(id, name) {
  clearInputErrors(formEditTool);
  editToolId.value = id;
  editToolName.value = name;
  editToolSubtitle.textContent = `Modificando equipo #${id}`;
  modalEditTool.style.display = 'flex';
  editToolName.focus();
};

formEditTool.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearInputErrors(formEditTool);

  const id = parseInt(editToolId.value, 10);
  const updatedName = editToolName.value.trim();


  if (!updatedName || updatedName.length < 3) {
    showFieldError(editToolName, 'editToolNameError', 'El nombre debe tener al menos 3 caracteres.');
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('herramientas')
      .update({ nombre: updatedName })
      .eq('id', id);

    if (error) throw error;

 
    await registrarTrazabilidad({
      herramienta_id: id,
      herramienta_nombre: updatedName,
      tipo_movimiento: 'MODIFICACION',
      observaciones: `Nombre actualizado de equipo #${id}`
    });

    showToast(`Herramienta #${id} actualizada a "${updatedName}"`, 'success');
    closeModals();
    await loadData();
  } catch (err) {
    console.error('Error al actualizar herramienta:', err);
    showToast('Error al editar: ' + err.message, 'error');
  }
});


window.openDeleteModal = function(id, name) {
  toolPendingDelete = { id, name };
  deleteToolTargetText.textContent = `#${id} - ${name}`;
  modalDeleteTool.style.display = 'flex';
};

btnConfirmDeleteTool.addEventListener('click', async () => {
  if (!toolPendingDelete) return;

  const { id, name } = toolPendingDelete;

  try {
    const { error } = await supabaseClient
      .from('herramientas')
      .delete()
      .eq('id', id);

    if (error) throw error;


    await registrarTrazabilidad({
      herramienta_id: id,
      herramienta_nombre: name,
      tipo_movimiento: 'ELIMINACION',
      observaciones: `Herramienta dada de baja y retirada del inventario`
    });

    showToast(`Herramienta #${id} "${name}" eliminada del inventario`, 'warning');
    closeModals();
    toolPendingDelete = null;
    await loadData();
  } catch (err) {
    console.error('Error al eliminar herramienta:', err);
    showToast('Error al eliminar: ' + err.message, 'error');
  }
});


window.openLoanModal = function(id, name) {
  clearInputErrors(formLoan);
  loanToolId.value = id;
  loanToolSubtitle.textContent = `#${id} - ${name}`;
  loanEmployeeSelect.value = '';
  modalLoan.style.display = 'flex';
};

formLoan.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearInputErrors(formLoan);

  const id = parseInt(loanToolId.value, 10);
  const employeeName = loanEmployeeSelect.value;

  if (!employeeName) {
    showFieldError(loanEmployeeSelect, 'loanEmployeeError', 'Por favor selecciona un operario responsable.');
    return;
  }

  const selectedEmp = employees.find(e => e.nombre.toLowerCase() === employeeName.toLowerCase());
  const tool = tools.find(t => t.id === id);
  const toolName = tool ? tool.nombre : `Herramienta #${id}`;

  try {
    const now = new Date().toISOString();
    const { error } = await supabaseClient
      .from('herramientas')
      .update({
        estado: 'Prestada',
        prestada_a: employeeName,
        fecha_salida: now,
        fecha_devolucion: null
      })
      .eq('id', id);

    if (error) throw error;

  
    await registrarTrazabilidad({
      herramienta_id: id,
      herramienta_nombre: toolName,
      tipo_movimiento: 'PRESTAMO',
      operario: employeeName,
      cuadrilla: selectedEmp ? selectedEmp.cuadrilla : null,
      observaciones: `Préstamo asignado a operario de cuadrilla ${selectedEmp ? selectedEmp.cuadrilla : 'sin asignar'}`
    });

    showToast(`Herramienta #${id} prestada a ${employeeName}`, 'success');
    closeModals();
    await loadData();
  } catch (err) {
    console.error('Error al prestar herramienta:', err);
    showToast('Error al registrar préstamo: ' + err.message, 'error');
  }
});

window.returnTool = async function(id) {
  const tool = tools.find(t => t.id === id);
  const toolName = tool ? tool.nombre : `#${id}`;
  const previousBorrower = tool ? tool.prestada_a : null;
  const emp = previousBorrower ? employees.find(e => e.nombre.toLowerCase() === previousBorrower.toLowerCase()) : null;

  try {
    const now = new Date().toISOString();
    const { error } = await supabaseClient
      .from('herramientas')
      .update({
        estado: 'Disponible',
        prestada_a: null,
        fecha_devolucion: now
      })
      .eq('id', id);

    if (error) throw error;

    
    await registrarTrazabilidad({
      herramienta_id: id,
      herramienta_nombre: toolName,
      tipo_movimiento: 'DEVOLUCION',
      operario: previousBorrower,
      cuadrilla: emp ? emp.cuadrilla : null,
      observaciones: 'Herramienta devuelta e ingresada nuevamente a bodega'
    });

    showToast(`Herramienta "${toolName}" recibida de vuelta en bodega`, 'success');
    await loadData();
  } catch (err) {
    console.error('Error al devolver herramienta:', err);
    showToast('Error al recibir herramienta: ' + err.message, 'error');
  }
};


function showFieldError(inputElement, errorElementId, message) {
  inputElement.classList.add('is-invalid');
  const errDiv = document.getElementById(errorElementId);
  if (errDiv) {
    errDiv.textContent = message;
    errDiv.classList.add('show');
  }
  inputElement.focus();
}

function clearInputErrors(form) {
  form.querySelectorAll('.is-invalid').forEach(input => input.classList.remove('is-invalid'));
  form.querySelectorAll('.invalid-feedback').forEach(feedback => {
    feedback.textContent = '';
    feedback.classList.remove('show');
  });
}

function updateStats() {
  const total = tools.length;
  const available = tools.filter(t => t.estado === 'Disponible').length;
  const borrowed = tools.filter(t => t.estado === 'Prestada').length;

  statTotal.textContent = total;
  statAvailable.textContent = available;
  statBorrowed.textContent = borrowed;
  statEmployees.textContent = employees.length;
}

function populateEmployeeSelect() {
  loanEmployeeSelect.innerHTML = '<option value="">-- Elige un operario --</option>';
  employees.forEach(emp => {
    const opt = document.createElement('option');
    opt.value = emp.nombre;
    opt.textContent = `${emp.nombre} (Cuadrilla ${emp.cuadrilla})`;
    loanEmployeeSelect.appendChild(opt);
  });
}

function setupEventListeners() {
 
  searchInput.addEventListener('input', () => {
    clearSearchBtn.style.display = searchInput.value ? 'flex' : 'none';
    renderAllViews();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    renderAllViews();
  });

  
  statusFilter.addEventListener('change', renderAllViews);
  cuadrillaFilter.addEventListener('change', renderAllViews);
  btnRefresh.addEventListener('click', async () => {
    await loadData();
    await loadTraceability();
  });

 
  viewModeGridBtn.addEventListener('click', () => applyViewMode('grid'));
  viewModeTableBtn.addEventListener('click', () => applyViewMode('table'));

  
  if (dbStatusBadge) {
    dbStatusBadge.style.cursor = 'pointer';
    dbStatusBadge.title = 'Haz clic para configurar o cambiar la conexión con Supabase';
    dbStatusBadge.addEventListener('click', () => {
      const currentUrl = localStorage.getItem('SUPABASE_URL') || '';
      const currentKey = localStorage.getItem('SUPABASE_ANON_KEY') || '';
      const newUrl = prompt('Configuración Segura Local:\nIngresa la SUPABASE_URL (ej: https://iuavuxtstzpbwvmbrely.supabase.co):', currentUrl);
      if (newUrl === null) return;
      const newKey = prompt('Configuración Segura Local:\nIngresa la SUPABASE_ANON_KEY (la que empieza por sb_publishable_...):', currentKey);
      if (newKey === null) return;

      const urlClean = (newUrl.match(/https?:\/\/[a-z0-9-]+\.supabase\.co/i) || [newUrl.replace(/\/+$/, '').trim()])[0];
      localStorage.setItem('SUPABASE_URL', urlClean);
      localStorage.setItem('SUPABASE_ANON_KEY', newKey.trim());
      window.location.reload();
    });
  }

  
  document.getElementById('btnOpenAddTool').addEventListener('click', () => {
    clearInputErrors(formAddTool);
    formAddTool.reset();
    modalAddTool.style.display = 'flex';
  });

  document.getElementById('btnOpenAddEmployee').addEventListener('click', () => {
    clearInputErrors(formAddEmployee);
    formAddEmployee.reset();
    modalAddEmployee.style.display = 'flex';
  });

  
  if (btnOpenTraceability) {
    btnOpenTraceability.addEventListener('click', () => {
      renderTraceability();
      modalTraceability.style.display = 'flex';
    });
  }

 
  if (traceSearchInput) {
    traceSearchInput.addEventListener('input', renderTraceability);
  }
  if (traceTypeFilter) {
    traceTypeFilter.addEventListener('change', renderTraceability);
  }
  if (btnExportTraceability) {
    btnExportTraceability.addEventListener('click', exportTraceabilityToCSV);
  }


  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', closeModals);
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      closeModals();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModals();
    }
  });
}

function closeModals() {
  modalLoan.style.display = 'none';
  modalAddTool.style.display = 'none';
  modalEditTool.style.display = 'none';
  modalDeleteTool.style.display = 'none';
  modalAddEmployee.style.display = 'none';
  if (modalToolDetails) modalToolDetails.style.display = 'none';
  if (modalTraceability) modalTraceability.style.display = 'none';
  toolPendingDelete = null;
  currentDetailToolId = null;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeQuote(text) {
  if (!text) return '';
  return text.toString().replace(/'/g, "\\'");
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}


function setupAuthSystem() {
  if (!loginOverlay) return;

 
  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      clearInputErrors(formLogin);

      let hasErrors = false;
      if (!email) {
        showFieldError(document.getElementById('loginEmail'), 'loginEmailError', 'Ingresa tu correo electrónico');
        hasErrors = true;
      }
      if (!password) {
        showFieldError(document.getElementById('loginPassword'), 'loginPasswordError', 'Ingresa tu contraseña');
        hasErrors = true;
      }
      if (hasErrors) return;

      handleLogin(email, password);
    });
  }


  if (btnLogout) {
    btnLogout.addEventListener('click', handleLogout);
  }
}


window.quickLogin = function(fillEmail, fillPassword) {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  if (emailInput && passInput) {
    emailInput.value = fillEmail;
    passInput.value = fillPassword;
    clearInputErrors(formLogin);
    handleLogin(fillEmail, fillPassword);
  }
};

async function handleLogin(email, password) {
  const submitBtn = document.getElementById('btnSubmitLogin');
  const originalText = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Verificando credenciales...';
    if (window.lucide) window.lucide.createIcons();
  }

  try {
    let loggedUser = null;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    
    const passwordHash = await hashPassword(cleanPassword);

   
    const demoUsers = [
      {
        nombre: 'Jeime Jiménez',
        email: 'jeime@tooltracking.com',
        aliases: ['jeime', 'jeime jimenez', 'jeime@tooltracking.com'],
        plainPass: '123456',
        passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
        rol: 'Supervisor de Bodega'
      },
      {
        nombre: 'Administrador General',
        email: 'admin@tooltracking.com',
        aliases: ['admin', 'administrador', 'admin@tooltracking.com'],
        plainPass: 'admin123',
        passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
        rol: 'Administrador General'
      },
      {
        nombre: 'Rhonis Julio',
        email: 'rhonis@tooltracking.com',
        aliases: ['rhonis', 'rhonis julio', 'rhonis@tooltracking.com'],
        plainPass: '123456',
        passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
        rol: 'Supervisor de Bodega'
      }
    ];

    
    const localMatch = demoUsers.find(u => {
      const matchUser = u.email === cleanEmail || (u.aliases && u.aliases.includes(cleanEmail));
      const matchPass = (u.passwordHash === passwordHash || u.plainPass === cleanPassword);
      return matchUser && matchPass;
    });

    if (localMatch) {
      loggedUser = {
        nombre: localMatch.nombre,
        email: localMatch.email,
        rol: localMatch.rol
      };
    }

   
    if (!loggedUser && supabaseClient) {
      try {
        const { data: hashedData } = await supabaseClient
          .from('usuarios')
          .select('*')
          .eq('email', cleanEmail)
          .eq('password', passwordHash)
          .maybeSingle();

        if (hashedData) {
          loggedUser = hashedData;
        } else {
          
          const { data: plainData } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('email', cleanEmail)
            .eq('password', cleanPassword)
            .maybeSingle();

          if (plainData) {
            loggedUser = plainData;
            try {
              await supabaseClient
                .from('usuarios')
                .update({ password: passwordHash })
                .eq('email', cleanEmail);
            } catch (migErr) {}
          }
        }
      } catch (dbErr) {
        console.warn('Consulta a Supabase usuarios omitida:', dbErr);
      }
    }

   
    if (!loggedUser && employees.length > 0) {
      const empMatch = employees.find(e => e.nombre.toLowerCase() === cleanEmail);
      if (empMatch && (cleanPassword === '123456' || cleanPassword === 'admin123')) {
        loggedUser = {
          nombre: empMatch.nombre,
          email: `${cleanEmail.replace(/\s+/g, '')}@tooltracking.com`,
          rol: `Operario (Cuadrilla ${empMatch.cuadrilla})`
        };
      }
    }

    if (loggedUser) {
      applyUserSession(loggedUser);
      showToast(`¡Sesión iniciada con éxito! Bienvenido, ${loggedUser.nombre}`, 'success');
      await loadData();
      await loadTraceability();
    } else {
      showFieldError(document.getElementById('loginPassword'), 'loginPasswordError', 'Credenciales incorrectas. Usa jeime@tooltracking.com (123456) o admin@tooltracking.com (admin123)');
      showToast('Acceso denegado. Verifica tu correo y contraseña.', 'error');
    }
  } catch (err) {
    console.error('Error durante autenticación:', err);
    showToast('Error al iniciar sesión: ' + err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      if (window.lucide) window.lucide.createIcons();
    }
  }
}

function applyUserSession(user) {
  currentUser = user;
  localStorage.setItem('tooltracking_user', JSON.stringify(user));

  if (loginOverlay) {
    loginOverlay.classList.add('hidden');
  }

  if (userProfileBadge && headerUserName && headerUserRole) {
    headerUserName.textContent = user.nombre || 'Usuario';
    headerUserRole.textContent = user.rol || 'Operador';
    userProfileBadge.style.display = 'flex';
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function showLoginScreen() {
  currentUser = null;
  if (loginOverlay) {
    loginOverlay.classList.remove('hidden');
  }
  if (userProfileBadge) {
    userProfileBadge.style.display = 'none';
  }
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function handleLogout() {
  localStorage.removeItem('tooltracking_user');
  currentUser = null;
  showLoginScreen();
  showToast('Has cerrado sesión correctamente', 'info');
}
