const SUPABASE_URL = 'https://iuavuxtstzpbwvmbrely.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YI0EmePfKteihRVmCvvhaw_bonybHbx';

// Inicializar cliente Supabase
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Estado global en memoria
let tools = [];
let employees = [];

// Elementos del DOM
const toolsGrid = document.getElementById('toolsGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const statusFilter = document.getElementById('statusFilter');
const cuadrillaFilter = document.getElementById('cuadrillaFilter');
const btnRefresh = document.getElementById('btnRefresh');
const resultsCount = document.getElementById('resultsCount');

// Estadísticas
const statTotal = document.getElementById('statTotal');
const statAvailable = document.getElementById('statAvailable');
const statBorrowed = document.getElementById('statBorrowed');
const statEmployees = document.getElementById('statEmployees');

// Modales
const modalLoan = document.getElementById('modalLoan');
const modalAddTool = document.getElementById('modalAddTool');
const modalAddEmployee = document.getElementById('modalAddEmployee');

// Formularios
const formLoan = document.getElementById('formLoan');
const formAddTool = document.getElementById('formAddTool');
const formAddEmployee = document.getElementById('formAddEmployee');

const loanToolId = document.getElementById('loanToolId');
const loanToolSubtitle = document.getElementById('loanToolSubtitle');
const loanEmployeeSelect = document.getElementById('loanEmployeeSelect');

// ==========================================
// Inicialización
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadData();
});

// ==========================================
// Carga de Datos desde Supabase
// ==========================================
async function loadData() {
  try {
    showToast('Cargando inventario...', 'info');

    // 1. Cargar Empleados
    const { data: empData, error: empError } = await supabaseClient
      .from('empleados')
      .select('*')
      .order('nombre', { ascending: true });

    if (empError) throw empError;
    employees = empData || [];

    // 2. Cargar Herramientas
    const { data: toolData, error: toolError } = await supabaseClient
      .from('herramientas')
      .select('*')
      .order('id', { ascending: true });

    if (toolError) throw toolError;
    tools = toolData || [];

    updateStats();
    populateEmployeeSelect();
    renderTools();
    showToast('Datos actualizados', 'success');
  } catch (err) {
    console.error('Error al conectar con Supabase:', err);
    showToast('Error al conectar con Supabase: ' + err.message, 'error');
  }
}

// ==========================================
// Renderizado de Tarjetas de Herramientas
// ==========================================
function renderTools() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const selectedCuadrilla = cuadrillaFilter.value;

  // Filtrar herramientas
  const filteredTools = tools.filter(tool => {
    // Filtro de texto
    const matchName = tool.nombre && tool.nombre.toLowerCase().includes(searchTerm);
    const matchId = tool.id && tool.id.toString().includes(searchTerm);
    const matchEmployee = tool.prestada_a && tool.prestada_a.toLowerCase().includes(searchTerm);
    const matchesSearch = matchName || matchId || matchEmployee;

    // Filtro de estado
    const matchesStatus = (selectedStatus === 'all') || (tool.estado === selectedStatus);

    // Filtro de cuadrilla
    let matchesCuadrilla = true;
    if (selectedCuadrilla !== 'all') {
      if (tool.estado === 'Prestada' && tool.prestada_a) {
        const emp = employees.find(e => e.nombre === tool.prestada_a);
        matchesCuadrilla = emp && emp.cuadrilla.toString() === selectedCuadrilla;
      } else {
        matchesCuadrilla = false;
      }
    }

    return matchesSearch && matchesStatus && matchesCuadrilla;
  });

  // Actualizar conteo de resultados
  resultsCount.textContent = `Mostrando ${filteredTools.length} de ${tools.length} herramientas`;

  // Limpiar grid
  toolsGrid.innerHTML = '';

  if (filteredTools.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  filteredTools.forEach(tool => {
    const isAvailable = tool.estado === 'Disponible';
    const card = document.createElement('div');
    card.className = `tool-card ${isAvailable ? 'status-available' : 'status-borrowed'}`;

    // Buscar cuadrilla del operario si está prestada
    let cuadrillaText = '';
    if (!isAvailable && tool.prestada_a) {
      const emp = employees.find(e => e.nombre === tool.prestada_a);
      cuadrillaText = emp ? `Cuadrilla ${emp.cuadrilla}` : 'Cuadrilla sin asignar';
    }

    const formattedDate = tool.fecha_salida ? formatDate(tool.fecha_salida) : '';

    card.innerHTML = `
      <div>
        <div class="card-top">
          <span class="tool-id-tag">#${tool.id}</span>
          <span class="status-badge ${isAvailable ? 'badge-available' : 'badge-borrowed'}">
            <i data-lucide="${isAvailable ? 'check-circle' : 'clock'}" style="width: 14px; height: 14px;"></i>
            ${tool.estado || 'Disponible'}
          </span>
        </div>

        <h3 class="tool-name" style="margin-top: 0.75rem;">${escapeHtml(tool.nombre)}</h3>
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
            <span>Lista en bodega para prestar</span>
          </div>
        </div>
      `}

      <div class="card-actions">
        ${isAvailable ? `
          <button class="btn btn-primary btn-sm" onclick="openLoanModal(${tool.id}, '${escapeHtml(tool.nombre)}')">
            <i data-lucide="arrow-up-right" style="width: 14px; height: 14px;"></i> Prestar
          </button>
        ` : `
          <button class="btn btn-success btn-sm" onclick="returnTool(${tool.id})">
            <i data-lucide="arrow-down-left" style="width: 14px; height: 14px;"></i> Devolver a Bodega
          </button>
        `}
      </div>
    `;

    toolsGrid.appendChild(card);
  });

  // Re-inicializar iconos de Lucide
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ==========================================
// Acciones: Prestar y Devolver
// ==========================================
window.openLoanModal = function(id, name) {
  loanToolId.value = id;
  loanToolSubtitle.textContent = `#${id} - ${name}`;
  loanEmployeeSelect.value = '';
  modalLoan.style.display = 'flex';
};

formLoan.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = parseInt(loanToolId.value, 10);
  const employeeName = loanEmployeeSelect.value;

  if (!employeeName) {
    showToast('Por favor selecciona un operario', 'error');
    return;
  }

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

    showToast(`Herramienta #${id} prestada a ${employeeName}`, 'success');
    closeModals();
    await loadData();
  } catch (err) {
    console.error('Error al prestar herramienta:', err);
    showToast('Error al prestar: ' + err.message, 'error');
  }
});

window.returnTool = async function(id) {
  if (!confirm(`¿Confirmas la devolución de la herramienta #${id} a bodega?`)) {
    return;
  }

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

    showToast(`Herramienta #${id} recibida en bodega`, 'success');
    await loadData();
  } catch (err) {
    console.error('Error al devolver herramienta:', err);
    showToast('Error al devolver: ' + err.message, 'error');
  }
};

// ==========================================
// Registrar Nueva Herramienta
// ==========================================
formAddTool.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = parseInt(document.getElementById('newToolId').value, 10);
  const name = document.getElementById('newToolName').value.trim();

  if (!id || !name) {
    showToast('Por favor completa todos los campos', 'error');
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('herramientas')
      .insert([{
        id: id,
        nombre: name,
        estado: 'Disponible'
      }]);

    if (error) throw error;

    showToast(`Herramienta "${name}" guardada con éxito`, 'success');
    formAddTool.reset();
    closeModals();
    await loadData();
  } catch (err) {
    console.error('Error al agregar herramienta:', err);
    showToast('Error al guardar: ' + err.message, 'error');
  }
});

// ==========================================
// Registrar Nuevo Empleado
// ==========================================
formAddEmployee.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('newEmployeeName').value.trim();
  const cuadrilla = parseInt(document.getElementById('newEmployeeCuadrilla').value, 10);

  if (!name || !cuadrilla) {
    showToast('Por favor completa todos los campos', 'error');
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('empleados')
      .insert([{
        nombre: name,
        cuadrilla: cuadrilla
      }]);

    if (error) throw error;

    showToast(`Empleado "${name}" registrado en Cuadrilla ${cuadrilla}`, 'success');
    formAddEmployee.reset();
    closeModals();
    await loadData();
  } catch (err) {
    console.error('Error al registrar empleado:', err);
    showToast('Error al registrar: ' + err.message, 'error');
  }
});

// ==========================================
// Utilidades & Event Listeners
// ==========================================
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
  // Búsqueda
  searchInput.addEventListener('input', () => {
    clearSearchBtn.style.display = searchInput.value ? 'flex' : 'none';
    renderTools();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    renderTools();
  });

  // Filtros
  statusFilter.addEventListener('change', renderTools);
  cuadrillaFilter.addEventListener('change', renderTools);
  btnRefresh.addEventListener('click', loadData);

  // Apertura de Modales
  document.getElementById('btnOpenAddTool').addEventListener('click', () => {
    modalAddTool.style.display = 'flex';
  });

  document.getElementById('btnOpenAddEmployee').addEventListener('click', () => {
    modalAddEmployee.style.display = 'flex';
  });

  // Cierre de Modales
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', closeModals);
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      closeModals();
    }
  });
}

function closeModals() {
  modalLoan.style.display = 'none';
  modalAddTool.style.display = 'none';
  modalAddEmployee.style.display = 'none';
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
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
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
