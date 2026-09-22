const SUPABASE_URL = 'https://iuavuxtstzpbwvmbrely.supabase.co';

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let tools = [];
let employees = [];
let currentViewMode = localStorage.getItem('tooltracking_view') || 'grid'; // 'grid' | 'table'
let toolPendingDelete = null;

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
  } else {
    showLoginScreen();
  }
});

async function loadData() {
  setConnectionStatus('checking', 'Sincronizando...');
  try {
    if (!supabaseClient) {
      throw new Error('Cliente de Supabase no cargado');
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
      <td class="table-tool-name">${escapeHtml(tool.nombre)}</td>
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
    showToast('Error al registrar préstamo: ' + err.message, 'error');
  }
});

window.returnTool = async function(id) {
  const tool = tools.find(t => t.id === id);
  const toolName = tool ? tool.nombre : `#${id}`;

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
  btnRefresh.addEventListener('click', loadData);

  viewModeGridBtn.addEventListener('click', () => applyViewMode('grid'));
  viewModeTableBtn.addEventListener('click', () => applyViewMode('table'));

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
  toolPendingDelete = null;
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
      const plainPassword = document.getElementById('loginPassword').value;
      clearInputErrors(formLogin);

      let hasErrors = false;
      if (!email) {
        showFieldError(document.getElementById('loginEmail'), 'loginEmailError', 'Ingresa tu correo electrónico');
        hasErrors = true;
      }
      if (!plainPassword) {
        showFieldError(document.getElementById('loginPassword'), 'loginPasswordError', 'Ingresa tu contraseña');
        hasErrors = true;
      }
      if (hasErrors) return;

      const password = CryptoJS.SHA256(plainPassword).toString();

      handleLogin(email, password);
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', handleLogout);
  }
}

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

    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('usuarios')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('password', password)
        .maybeSingle();

      if (!error && data) {
        loggedUser = data;
      }
    }

    if (!loggedUser) {
      const demoUsers = [
        { 
          nombre: 'Administrador General', 
          email: 'admin@tooltracking.com', 
          password: CryptoJS.SHA256('admin123').toString(), 
          rol: 'Administrador General' 
        },
        { 
          nombre: 'Jeime Jiménez', 
          email: 'jeime@tooltracking.com', 
          password: CryptoJS.SHA256('123456').toString(), 
          rol: 'Supervisor de Bodega' 
        },
        { 
          nombre: 'Rhonis Julio', 
          email: 'rhonis@tooltracking.com', 
          password: CryptoJS.SHA256('123456').toString(), 
          rol: 'Supervisor de Bodega' 
        }
      ];

      const match = demoUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (match) {
        loggedUser = match;
      }
    }

    if (loggedUser) {
      applyUserSession(loggedUser);
      showToast(`¡Bienvenido al sistema, ${loggedUser.nombre}!`, 'success');
      await loadData();
    } else {
      showFieldError(document.getElementById('loginPassword'), 'loginPasswordError', 'Correo o contraseña incorrectos');
      showToast('Acceso denegado. Solo usuarios autorizados.', 'error');
    }
  } catch (err) {
    console.error('Error durante login:', err);
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
