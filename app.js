const firebaseConfig = {
    apiKey: "AIzaSyBVAUP4agCEN6pVXWXOsQDG7Bzfile2OWU",
    authDomain: "planejamento-lofty-4029e.firebaseapp.com",
    projectId: "planejamento-lofty-4029e",
    storageBucket: "planejamento-lofty-4029e.firebasestorage.app",
    messagingSenderId: "281028453977",
    appId: "1:281028453977:web:79401f37adcbef469eb348"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let docRef;

document.addEventListener('DOMContentLoaded', () => {
    // A lógica de autenticação continua a mesma
    const auth = firebase.auth();
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    function showApp(userRole, userEmail) { loginScreen.classList.add('hidden'); appContainer.classList.remove('hidden'); initializeAppLogic(userRole, userEmail); }
    function showLogin() { appContainer.classList.add('hidden'); loginScreen.classList.remove('hidden'); if (typeof stopListeningToFirebase === 'function') { stopListeningToFirebase(); } }
    loginForm.addEventListener('submit', (e) => { e.preventDefault(); const email = document.getElementById('username').value; const password = document.getElementById('password').value; loginError.textContent = ''; auth.signInWithEmailAndPassword(email, password).catch(() => { loginError.textContent = 'E-mail ou senha inválidos.'; document.getElementById('password').value = ''; }); });
    logoutBtn.addEventListener('click', () => { auth.signOut().then(() => { location.reload(); }); });
    auth.onAuthStateChanged(user => { if (user) { db.collection("user_roles").doc(user.uid).get().then((doc) => { showApp(doc.exists && doc.data().role === 'editor' ? 'editor' : 'viewer', user.email); }).catch(() => { showApp('viewer', user.email); }); } else { showLogin(); } });

    let stopListeningToFirebase = null;

    function initializeAppLogic(userRole, userEmail) {
        const isEditor = userRole === 'editor';
        
        // Seletores de elementos
        const yearSelect = document.getElementById('year-select');
        const calendarContainer = document.getElementById('calendar-container');
        const employeeSelect = document.getElementById('employee-select');
        const newEmployeeInput = document.getElementById('new-employee-name');
        const newEmployeeEmailInput = document.getElementById('new-employee-email');
        const addEmployeeBtn = document.getElementById('add-employee-btn');
        const removeEmployeeBtn = document.getElementById('remove-employee-btn');
        const changePasswordBtn = document.getElementById('change-password-btn');
        const modal = document.getElementById('day-editor-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalColorSelect = document.getElementById('modal-color-select');
        const modalExtraHours = document.getElementById('modal-extra-hours');
        const modalExtraHoursObs = document.getElementById('modal-extra-hours-obs');
        const modalLateHours = document.getElementById('modal-late-hours');
        const modalLateHoursObs = document.getElementById('modal-late-hours-obs');
        const modalSaveBtn = document.getElementById('modal-save-btn');
        const modalCancelBtn = document.getElementById('modal-cancel-btn');
        const tooltip = document.getElementById('day-tooltip');
        
        // Variáveis de estado
        const MONTHS = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
        let selectedYear = parseInt(yearSelect.value);
        let currentlyEditingDate = null;
        let state = { funcionarios: [], funcionarioSelecionadoId: null };
        let localStateLoaded = false;
        
        // --- FUNÇÕES PRINCIPAIS (sem alterações na lógica interna, apenas para manter o código completo) ---
        function setupUIForRole() { newEmployeeInput.disabled = !isEditor; newEmployeeEmailInput.disabled = !isEditor; addEmployeeBtn.disabled = !isEditor; removeEmployeeBtn.disabled = !isEditor; employeeSelect.disabled = !isEditor; yearSelect.disabled = false; const viewOnlyNotice = document.getElementById('view-only-notice'); if (!isEditor) viewOnlyNotice.classList.remove('hidden'); else viewOnlyNotice.classList.add('hidden'); }
        function saveState() { if (!localStateLoaded || !isEditor || !docRef) return; docRef.set(state).catch(error => console.error("Erro ao salvar no Firebase: ", error)); }
        function listenForChanges() { if (stopListeningToFirebase) { stopListeningToFirebase(); } selectedYear = parseInt(yearSelect.value); docRef = db.collection("planejamentos").doc(`dados${selectedYear}`); stopListeningToFirebase = docRef.onSnapshot(doc => { if (doc.exists) { state = doc.data(); } else { state = { funcionarios: [], funcionarioSelecionadoId: null }; if (isEditor) { const initialId = `func-${Date.now()}`; state.funcionarios.push({ id: initialId, nome: "Meu Planejamento", email: userEmail, calendario: {} }); state.funcionarioSelecionadoId = initialId; saveState(); } } localStateLoaded = true; renderApp(); }); }
        function calculateAndDisplaySummaries() { const funcionarioAtual = state.funcionarios.find(f => f.id === state.funcionarioSelecionadoId); let folgasUteis = 0, folgasFeriadoFDS = 0, totalExtras = 0, totalAtrasos = 0; if (funcionarioAtual && funcionarioAtual.calendario) { for (const dateString in funcionarioAtual.calendario) { const data = funcionarioAtual.calendario[dateString] || {}; const date = new Date(dateString + 'T00:00:00'); const dayOfWeek = date.getDay(); const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; if (isWeekday && data.cor === 'amarelo') { folgasUteis++; } if (['verde', 'laranja'].includes(data.cor) || (!isWeekday && ['amarelo', 'vermelho'].includes(data.cor))) { folgasFeriadoFDS++; } totalExtras += parseFloat(data.extras) || 0; totalAtrasos += parseFloat(data.atrasos) || 0; } } const saldoHoras = totalExtras - totalAtrasos; const saldoEl = document.getElementById('summary-saldo'); document.getElementById('summary-uteis').textContent = folgasUteis; document.getElementById('summary-feriado-fds').textContent = folgasFeriadoFDS; document.getElementById('summary-total').textContent = folgasUteis + folgasFeriadoFDS; document.getElementById('summary-extras').textContent = totalExtras.toFixed(2); document.getElementById('summary-atrasos').textContent = totalAtrasos.toFixed(2); saldoEl.textContent = saldoHoras.toFixed(2); saldoEl.className = ''; saldoEl.classList.add(saldoHoras > 0 ? 'saldo-positivo' : (saldoHoras < 0 ? 'saldo-negativo' : '')); }
        function renderEmployeeControls() { employeeSelect.innerHTML = ''; let funcionariosParaExibir = []; if (isEditor) { funcionariosParaExibir = state.funcionarios || []; } else { const funcionarioDoUsuario = (state.funcionarios || []).find(f => f.email === userEmail); if (funcionarioDoUsuario) { funcionariosParaExibir = [funcionarioDoUsuario]; state.funcionarioSelecionadoId = funcionarioDoUsuario.id; } } if (funcionariosParaExibir.length === 0) { const option = document.createElement('option'); option.textContent = isEditor ? "Adicione um funcionário" : "Nenhum planejamento para este ano"; employeeSelect.appendChild(option); employeeSelect.disabled = true; removeEmployeeBtn.disabled = true; } else { employeeSelect.disabled = !isEditor; removeEmployeeBtn.disabled = !isEditor; funcionariosParaExibir.forEach(func => { const option = document.createElement('option'); option.value = func.id; option.textContent = func.nome; employeeSelect.appendChild(option); }); if (!funcionariosParaExibir.some(f => f.id === state.funcionarioSelecionadoId) && funcionariosParaExibir.length > 0) { state.funcionarioSelecionadoId = funcionariosParaExibir[0].id; } employeeSelect.value = state.funcionarioSelecionadoId; } }
        function renderCalendar() { calendarContainer.innerHTML = ''; const funcionarioAtual = state.funcionarios ? state.funcionarios.find(f => f.id === state.funcionarioSelecionadoId) : null; MONTHS.forEach((monthName, monthIndex) => { const monthContainer = document.createElement('div'); monthContainer.className = 'month-container'; monthContainer.innerHTML = `<h3 class="month-title">${monthName}</h3>`; const monthGrid = document.createElement('div'); monthGrid.className = 'month-grid'; ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].forEach(day => { monthGrid.innerHTML += `<div class="header-cell">${day}</div>`; }); const firstDayOfWeek = (new Date(selectedYear, monthIndex, 1).getDay() + 6) % 7; for (let i = 0; i < firstDayOfWeek; i++) { monthGrid.innerHTML += '<div class="day-cell empty"></div>'; } for (let day = 1; day <= new Date(selectedYear, monthIndex + 1, 0).getDate(); day++) { const dateString = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; const dayOfWeek = new Date(dateString + 'T00:00:00').getDay(); let classes = 'day-cell valid-day'; if (isEditor) classes += ' editable'; if (dayOfWeek === 0 || dayOfWeek === 6) classes += ' weekend'; let hasData = false; if (funcionarioAtual && funcionarioAtual.calendario && funcionarioAtual.calendario[dateString]) { const data = funcionarioAtual.calendario[dateString]; if (data.cor && data.cor !== 'default') classes += ` color-${data.cor}`; hasData = (data.cor && data.cor !== 'default') || (parseFloat(data.extras) || 0) > 0 || (parseFloat(data.atrasos) || 0) > 0 || data.extrasObs || data.atrasosObs; if (hasData) classes += ' has-hours'; } monthGrid.innerHTML += `<div class="${classes}" data-date="${dateString}">${day}</div>`; } monthContainer.appendChild(monthGrid); calendarContainer.appendChild(monthContainer); }); }
        function renderApp() { setupUIForRole(); renderEmployeeControls(); renderCalendar(); calculateAndDisplaySummaries(); }
        function handleDayClick(event) { if (!isEditor) return; const cell = event.target.closest('.valid-day.editable'); if (!cell || !state.funcionarioSelecionadoId) return; currentlyEditingDate = cell.dataset.date; const funcionario = state.funcionarios.find(f => f.id === state.funcionarioSelecionadoId); const data = funcionario?.calendario?.[currentlyEditingDate] || {}; modalTitle.textContent = `Editar Dia - ${new Date(currentlyEditingDate + 'T00:00:00').toLocaleDateString('pt-BR')}`; modalColorSelect.value = data.cor || 'default'; modalExtraHours.value = data.extras || ''; modalExtraHoursObs.value = data.extrasObs || ''; modalLateHours.value = data.atrasos || ''; modalLateHoursObs.value = data.atrasosObs || ''; modal.classList.remove('hidden'); }
        function handleSaveDay() { if (!currentlyEditingDate || !isEditor) return; const funcionario = state.funcionarios.find(f => f.id === state.funcionarioSelecionadoId); if (!funcionario) return; if (!funcionario.calendario) { funcionario.calendario = {}; } const newColor = modalColorSelect.value; const newExtras = parseFloat(modalExtraHours.value) || 0; const newExtrasObs = modalExtraHoursObs.value.trim(); const newAtrasos = parseFloat(modalLateHours.value) || 0; const newAtrasosObs = modalLateHoursObs.value.trim(); const isDefault = newColor === 'default' && newExtras === 0 && newAtrasos === 0 && !newExtrasObs && !newAtrasosObs; if (isDefault) { delete funcionario.calendario[currentlyEditingDate]; } else { funcionario.calendario[currentlyEditingDate] = { cor: newColor, extras: newExtras, extrasObs: newExtrasObs, atrasos: newAtrasos, atrasosObs: newAtrasosObs }; } saveState(); modal.classList.add('hidden'); currentlyEditingDate = null; }
        function handleAddEmployee() { if (!isEditor) return; const name = newEmployeeInput.value.trim(); const email = newEmployeeEmailInput.value.trim(); if (name) { const newId = `func-${Date.now()}`; if (!state.funcionarios) { state.funcionarios = []; } state.funcionarios.push({ id: newId, nome: name, email: email, calendario: {} }); state.funcionarioSelecionadoId = newId; newEmployeeInput.value = ''; newEmployeeEmailInput.value = ''; saveState(); } else { alert('Por favor, insira um nome para o funcionário.'); } }
        function handleRemoveEmployee() { if (!isEditor || !state.funcionarioSelecionadoId || !state.funcionarios || state.funcionarios.length === 0) return; const selectedEmployee = state.funcionarios.find(f => f.id === state.funcionarioSelecionadoId); if(confirm(`Tem certeza que deseja remover "${selectedEmployee.nome}"? Esta ação não pode ser desfeita.`)) { state.funcionarios = state.funcionarios.filter(f => f.id !== state.funcionarioSelecionadoId); state.funcionarioSelecionadoId = state.funcionarios.length > 0 ? state.funcionarios[0].id : null; saveState(); } }
        function handleSelectEmployee() { state.funcionarioSelecionadoId = employeeSelect.value; renderCalendar(); calculateAndDisplaySummaries(); }
        function handleYearChange() { localStateLoaded = false; calendarContainer.innerHTML = '<p style="text-align:center;">Carregando dados do novo ano...</p>'; employeeSelect.innerHTML = ''; listenForChanges(); }
        function handleChangePassword() { const newPassword = prompt("Digite sua nova senha (mínimo 6 caracteres):"); if (newPassword && newPassword.length >= 6) { const user = firebase.auth().currentUser; if (user) { user.updatePassword(newPassword).then(() => { alert("Senha alterada com sucesso!"); }).catch((error) => { alert(`Erro ao alterar a senha: ${error.message}\n\nNota: Para sua segurança, pode ser necessário fazer login novamente antes de alterar a senha.`); }); } } else if (newPassword) { alert("A senha deve ter pelo menos 6 caracteres."); } }
        
        // --- LÓGICA DO TOOLTIP (CORRIGIDA E ROBUSTA) ---
        function handleShowTooltip(event) {
            const dayCell = event.target.closest('.day-cell.has-hours');
            if (!dayCell) return;

            const dateStr = dayCell.dataset.date;
            const funcionarioAtual = state.funcionarios.find(f => f.id === state.funcionarioSelecionadoId);
            const dayData = funcionarioAtual?.calendario?.[dateStr];
            if (!dayData) return;

            const statusMap = { 'default': 'Dia Normal', 'verde': 'Feriado Nacional', 'amarelo': 'Emenda', 'laranja': 'Feriado Estadual', 'vermelho': 'Falta', 'roxo': 'Afastado' };
            
            let content = `<h4>${new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: 'long'})}</h4>`;
            content += `<p><span>Status:</span> <strong>${statusMap[dayData.cor] || 'Normal'}</strong></p>`;
            
            if (dayData.extras > 0) {
                content += `<p><span>Horas Extras:</span> <strong>${dayData.extras}h</strong></p>`;
                if (dayData.extrasObs) {
                    content += `<p class="obs">${dayData.extrasObs}</p>`;
                }
            }
            if (dayData.atrasos > 0) {
                content += `<p><span>Horas de Atraso:</span> <strong>${dayData.atrasos}h</strong></p>`;
                if (dayData.atrasosObs) {
                    content += `<p class="obs">${dayData.atrasosObs}</p>`;
                }
            }
            
            tooltip.innerHTML = content;
            
            const rect = dayCell.getBoundingClientRect();
            tooltip.style.left = `${window.scrollX + rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
            tooltip.style.top = `${window.scrollY + rect.top - tooltip.offsetHeight - 10}px`;

            tooltip.classList.add('visible');
        }

        function handleHideTooltip() {
            tooltip.classList.remove('visible');
        }

        // --- INICIALIZAÇÃO E EVENT LISTENERS ---
        listenForChanges();

        // Eventos do Calendário
        calendarContainer.addEventListener('click', handleDayClick);

        // CORREÇÃO FINAL: Delegação de eventos para 'mouseover' e 'mouseout'
        calendarContainer.addEventListener('mouseover', handleShowTooltip);
        calendarContainer.addEventListener('mouseout', handleHideTooltip);

        // Outros Listeners
        addEmployeeBtn.addEventListener('click', handleAddEmployee);
        removeEmployeeBtn.addEventListener('click', handleRemoveEmployee);
        employeeSelect.addEventListener('change', handleSelectEmployee);
        yearSelect.addEventListener('change', handleYearChange);
        modalSaveBtn.addEventListener('click', handleSaveDay);
        modalCancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
        changePasswordBtn.addEventListener('click', handleChangePassword);
    }
});
