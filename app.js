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
            const auth = firebase.auth();
            const loginScreen = document.getElementById('login-screen');
            const appContainer = document.getElementById('app-container');
            const loginForm = document.getElementById('login-form');
            const loginError = document.getElementById('login-error');
            const logoutBtn = document.getElementById('logout-btn');

            function showApp(userRole, userEmail) {
                loginScreen.classList.add('hidden');
                appContainer.classList.remove('hidden');
                initializeAppLogic(userRole, userEmail);
            }

            function showLogin() {
                appContainer.classList.add('hidden');
                loginScreen.classList.remove('hidden');
                if (typeof stopListeningToFirebase === 'function') {
                    stopListeningToFirebase();
                }
            }
            
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                loginError.textContent = '';
                auth.signInWithEmailAndPassword(email, password)
                    .catch((error) => {
                        loginError.textContent = 'E-mail ou senha inválidos.';
                        document.getElementById('password').value = '';
                    });
            });

            logoutBtn.addEventListener('click', () => { auth.signOut().then(() => { location.reload(); }); });

            auth.onAuthStateChanged(user => {
                if (user) {
                    const userRoleRef = db.collection("user_roles").doc(user.uid);
                    userRoleRef.get().then((doc) => {
                        let role = 'viewer'; 
                        if (doc.exists && doc.data().role === 'editor') {
                            role = 'editor';
                        }
                        showApp(role, user.email); 
                    }).catch((error) => {
                        console.error("Erro ao buscar função do usuário:", error);
                        showApp('viewer', user.email);
                    });
                } else {
                    showLogin();
                }
            });
            
            let stopListeningToFirebase = null; 

            function initializeAppLogic(userRole, userEmail) {
                const isEditor = userRole === 'editor';

                const NATIONAL_HOLIDAYS = {
                    2024: { '2024-01-01':{c:'v'},'2024-02-12':{c:'v'},'2024-02-13':{c:'v'},'2024-03-29':{c:'v'},'2024-04-21':{c:'v'},'2024-05-01':{c:'v'},'2024-05-30':{c:'v'},'2024-09-07':{c:'v'},'2024-10-12':{c:'v'},'2024-11-02':{c:'v'},'2024-11-15':{c:'v'},'2024-11-20':{c:'v'},'2024-12-25':{c:'v'} },
                    2025: { '2025-01-01':{c:'v'},'2025-03-03':{c:'v'},'2025-03-04':{c:'v'},'2025-04-18':{c:'v'},'2025-04-21':{c:'v'},'2025-05-01':{c:'v'},'2025-06-19':{c:'v'},'2025-09-07':{c:'v'},'2025-10-12':{c:'v'},'2025-11-02':{c:'v'},'2025-11-15':{c:'v'},'2025-11-20':{c:'v'},'2025-12-25':{c:'v'} },
                    2026: { '2026-01-01':{c:'v'},'2026-02-16':{c:'v'},'2026-02-17':{c:'v'},'2026-04-03':{c:'v'},'2026-04-21':{c:'v'},'2026-05-01':{c:'v'},'2026-06-04':{c:'v'},'2026-09-07':{c:'v'},'2026-10-12':{c:'v'},'2026-11-02':{c:'v'},'2026-11-15':{c:'v'},'2026-12-25':{c:'v'} },
                    2027: { '2027-01-01':{c:'v'},'2027-02-08':{c:'v'},'2027-02-09':{c:'v'},'2027-03-26':{c:'v'},'2027-04-21':{c:'v'},'2027-05-01':{c:'v'},'2027-05-27':{c:'v'},'2027-09-07':{c:'v'},'2027-10-12':{c:'v'},'2027-11-02':{c:'v'},'2027-11-15':{c:'v'},'2027-12-25':{c:'v'} },
                    2028: { '2028-01-01':{c:'v'},'2028-02-28':{c:'v'},'2028-02-29':{c:'v'},'2028-04-14':{c:'v'},'2028-04-21':{c:'v'},'2028-05-01':{c:'v'},'2028-06-15':{c:'v'},'2028-09-07':{c:'v'},'2028-10-12':{c:'v'},'2028-11-02':{c:'v'},'2028-11-15':{c:'v'},'2028-11-20':{c:'v'},'2028-12-25':{c:'v'} },
                    2029: { '2029-01-01':{c:'v'},'2029-02-12':{c:'v'},'2029-02-13':{c:'v'},'2029-03-30':{c:'v'},'2029-04-21':{c:'v'},'2029-05-01':{c:'v'},'2029-05-31':{c:'v'},'2029-09-07':{c:'v'},'2029-10-12':{c:'v'},'2029-11-02':{c:'v'},'2029-11-15':{c:'v'},'2029-12-25':{c:'v'} },
                    2030: { '2030-01-01':{c:'v'},'2030-03-04':{c:'v'},'2030-03-05':{c:'v'},'2030-04-19':{c:'v'},'2030-04-21':{c:'v'},'2030-05-01':{c:'v'},'2030-06-20':{c:'v'},'2030-09-07':{c:'v'},'2030-10-12':{c:'v'},'2030-11-02':{c:'v'},'2030-11-15':{c:'v'},'2030-12-25':{c:'v'} }
                };
                
                const yearSelect = document.getElementById('year-select');
                let selectedYear = parseInt(yearSelect.value);

                const MONTHS = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
                const DAYS_OF_WEEK = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
                
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
                const modalLateHours = document.getElementById('modal-late-hours');
                const modalSaveBtn = document.getElementById('modal-save-btn');
                const modalCancelBtn = document.getElementById('modal-cancel-btn');
                let currentlyEditingDate = null;

                let state = { funcionarios: [], funcionarioSelecionadoId: null };
                let localStateLoaded = false;
                
                function populateHoursDatalist() {
                    const datalist = document.getElementById('hours-datalist');
                    if (datalist.options.length > 0) return; 

                    const options = [];
                    for (let min = 5; min <= 55; min += 5) {
                         options.push({ label: `${min} min`, value: (min / 60).toFixed(4) });
                    }
                    
                    for (let h = 1; h <= 8; h++) {
                        options.push({ label: `${h} hora${h > 1 ? 's' : ''}`, value: h });
                        options.push({ label: `${h}h 30 min`, value: h + 0.5 });
                    }

                    options.forEach(opt => {
                        const optionEl = document.createElement('option');
                        optionEl.value = opt.value;
                        optionEl.label = opt.label;
                        datalist.appendChild(optionEl);
                    });
                }


                function setupUIForRole() {
                    newEmployeeInput.disabled = !isEditor;
                    newEmployeeEmailInput.disabled = !isEditor;
                    addEmployeeBtn.disabled = !isEditor;
                    removeEmployeeBtn.disabled = !isEditor;
                    employeeSelect.disabled = !isEditor;
                    yearSelect.disabled = false; 

                    const viewOnlyNotice = document.getElementById('view-only-notice');
                    if (!isEditor) viewOnlyNotice.classList.remove('hidden');
                    else viewOnlyNotice.classList.add('hidden');
                }

                function saveState() {
                    if (!localStateLoaded || !isEditor || !docRef) return;
                    docRef.set(state).catch(error => console.error("Erro ao salvar no Firebase: ", error));
                }

                function listenForChanges() {
                    if (stopListeningToFirebase) { stopListeningToFirebase(); }
                    
                    selectedYear = parseInt(yearSelect.value);
                    docRef = db.collection("planejamentos").doc(`dados${selectedYear}`);

                    stopListeningToFirebase = docRef.onSnapshot(doc => {
                        if (doc.exists) {
                            state = doc.data();
                        } else {
                            if (isEditor) {
                                const initialId = `func-${Date.now()}`;
                                const holidaysForYear = NATIONAL_HOLIDAYS[selectedYear] || {};
                                const initialCalendar = {};
                                for (const date in holidaysForYear) {
                                    initialCalendar[date] = { cor: 'verde' };
                                }
                                state = {
                                    funcionarios: [{
                                        id: initialId, nome: "Meu Planejamento", email: userEmail,
                                        calendario: initialCalendar
                                    }],
                                    funcionarioSelecionadoId: initialId,
                                };
                                saveState();
                            } else {
                                state = { funcionarios: [], funcionarioSelecionadoId: null };
                            }
                        }
                        localStateLoaded = true;
                        renderApp();
                    });
                }
                
                function calculateAndDisplaySummaries() {
    const funcionarioAtual = state.funcionarios.find(f => f.id === state.funcionarioSelecionadoId);
    let folgasUteis = 0, folgasFeriadoFDS = 0, totalExtras = 0, totalAtrasos = 0;

    if (funcionarioAtual && funcionarioAtual.calendario) {
        for (const dateString in funcionarioAtual.calendario) {
            const entry = funcionarioAtual.calendario[dateString] || {};
            const data = typeof entry === 'string' ? { cor: entry } : entry;
            data.extras = parseFloat(data.extras) || 0;
            data.atrasos = parseFloat(data.atrasos) || 0;
            const date = new Date(dateString + 'T00:00:00');
            const dayOfWeek = date.getDay(); 
            const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

            // CORRIGIDO: Folgas úteis agora contam apenas 'amarelo' (Emendas).
            if (isWeekday && data.cor === 'amarelo') { folgasUteis++; }
            
            // CORRIGIDO: Folgas de feriado agora incluem 'laranja' (Estadual) junto com o 'verde' (Nacional).
            if (['verde', 'laranja'].includes(data.cor) || (!isWeekday && ['amarelo', 'vermelho'].includes(data.cor))) { folgasFeriadoFDS++; }
            
            totalExtras += data.extras;
            totalAtrasos += data.atrasos;
        }
    }
    
    const saldoHoras = totalExtras - totalAtrasos;
    const saldoEl = document.getElementById('summary-saldo');
    document.getElementById('summary-uteis').textContent = folgasUteis;
    document.getElementById('summary-feriado-fds').textContent = folgasFeriadoFDS;
    document.getElementById('summary-total').textContent = folgasUteis + folgasFeriadoFDS;
    document.getElementById('summary-extras').textContent = totalExtras.toFixed(2);
    document.getElementById('summary-atrasos').textContent = totalAtrasos.toFixed(2);
    saldoEl.textContent = saldoHoras.toFixed(2);
    saldoEl.className = ''; 
    saldoEl.classList.add(saldoHoras > 0 ? 'saldo-positivo' : (saldoHoras < 0 ? 'saldo-negativo' : ''));
}

                function renderApp() {
                    setupUIForRole(); 
                    renderEmployeeControls();
                    renderCalendar();
                    calculateAndDisplaySummaries();
                }

                function renderEmployeeControls() {
                    employeeSelect.innerHTML = '';
                    let funcionariosParaExibir = [];
                    if (isEditor) {
                        funcionariosParaExibir = state.funcionarios || [];
                    } else {
                        const funcionarioDoUsuario = (state.funcionarios || []).find(f => f.email === userEmail);
                        if (funcionarioDoUsuario) {
                            funcionariosParaExibir = [funcionarioDoUsuario];
                            state.funcionarioSelecionadoId = funcionarioDoUsuario.id;
                        }
                    }
                    
                    if (funcionariosParaExibir.length === 0) {
                        const option = document.createElement('option');
                        option.textContent = isEditor ? "Adicione um funcionário" : "Nenhum planejamento para este ano";
                        employeeSelect.appendChild(option);
                        employeeSelect.disabled = true; 
                        removeEmployeeBtn.disabled = true;
                    } else {
                        employeeSelect.disabled = !isEditor; 
                        removeEmployeeBtn.disabled = !isEditor;

                        funcionariosParaExibir.forEach(func => {
                            const option = document.createElement('option');
                            option.value = func.id;
                            option.textContent = func.nome;
                            employeeSelect.appendChild(option);
                        });

                        if (!funcionariosParaExibir.some(f => f.id === state.funcionarioSelecionadoId) && funcionariosParaExibir.length > 0) {
                             state.funcionarioSelecionadoId = funcionariosParaExibir[0].id;
                        }
                        employeeSelect.value = state.funcionarioSelecionadoId;
                    }
                }

                function renderCalendar() {
                    calendarContainer.innerHTML = '';
                    const funcionarioAtual = state.funcionarios ? state.funcionarios.find(f => f.id === state.funcionarioSelecionadoId) : null;
                    MONTHS.forEach((monthName, monthIndex) => {
                        const monthContainer = document.createElement('div');
                        monthContainer.className = 'month-container';
                        const title = document.createElement('h3');
                        title.className = 'month-title';
                        title.textContent = monthName;
                        monthContainer.appendChild(title);
                        const monthGrid = document.createElement('div');
                        monthGrid.className = 'month-grid';
                        DAYS_OF_WEEK.forEach(day => {
                            const headerCell = document.createElement('div');
                            headerCell.className = 'header-cell';
                            headerCell.textContent = day;
                            monthGrid.appendChild(headerCell);
                        });
                        const daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();
                        const firstDayOfWeek = (new Date(selectedYear, monthIndex, 1).getDay() + 6) % 7;
                        for (let i = 0; i < firstDayOfWeek; i++) {
                            monthGrid.appendChild(document.createElement('div')).classList.add('day-cell', 'empty');
                        }
                        for (let day = 1; day <= daysInMonth; day++) {
                            const dayCell = document.createElement('div');
                            dayCell.classList.add('day-cell', 'valid-day');
                            if (isEditor) { dayCell.classList.add('editable'); }
                            
                            dayCell.textContent = day;
                            const dateString = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            dayCell.dataset.date = dateString;
                            const dayOfWeek = new Date(selectedYear, monthIndex, day).getDay();
                            if (dayOfWeek === 0 || dayOfWeek === 6) { dayCell.classList.add('weekend'); }

                            if (funcionarioAtual && funcionarioAtual.calendario && funcionarioAtual.calendario[dateString]) {
                                const entry = funcionarioAtual.calendario[dateString];
                                const data = typeof entry === 'string' ? { cor: entry } : entry;
                                if (data.cor && data.cor !== 'default') { dayCell.classList.add(`color-${data.cor}`); }
                                if ((parseFloat(data.extras) || 0) > 0 || (parseFloat(data.atrasos) || 0) > 0) { dayCell.classList.add('has-hours'); }
                            }
                            monthGrid.appendChild(dayCell);
                        }
                        monthContainer.appendChild(monthGrid);
                        calendarContainer.appendChild(monthContainer);
                    });
                }
                
                function handleDayClick(event) {
                    if (!isEditor) return; 
                    const cell = event.target.closest('.valid-day');
                    if (!cell || !state.funcionarioSelecionadoId) return;

                    currentlyEditingDate = cell.dataset.date;
                    const funcionario = state.funcionarios.find(f => f.id === state.funcionarioSelecionadoId);
                    const entry = (funcionario?.calendario?.[currentlyEditingDate]) || {};
                    const data = typeof entry === 'string' ? { cor: entry } : entry;

                    modalTitle.textContent = `Editar Dia - ${new Date(currentlyEditingDate + 'T00:00:00').toLocaleDateString('pt-BR')}`;
                    modalColorSelect.value = data.cor || 'default';
                    
                    modalExtraHours.value = data.extras || '';
                    modalLateHours.value = data.atrasos || '';
                    
                    modal.classList.remove('hidden');
                }

                function handleSaveDay() {
                    if (!currentlyEditingDate || !isEditor) return;
                    const funcionario = state.funcionarios.find(f => f.id === state.funcionarioSelecionadoId);
                    if (!funcionario) return;
                    if (!funcionario.calendario) { funcionario.calendario = {}; }

                    const newColor = modalColorSelect.value;
                    const newExtras = parseFloat(modalExtraHours.value) || 0;
                    const newAtrasos = parseFloat(modalLateHours.value) || 0;

                    if (newColor === 'default' && newExtras === 0 && newAtrasos === 0) {
                        delete funcionario.calendario[currentlyEditingDate];
                    } else {
                        funcionario.calendario[currentlyEditingDate] = { cor: newColor, extras: newExtras, atrasos: newAtrasos };
                    }
                    
                    saveState();
                    modal.classList.add('hidden');
                    currentlyEditingDate = null;
                }
                
                function handleAddEmployee() {
                    if (!isEditor) return; 
                    const name = newEmployeeInput.value.trim();
                    const email = newEmployeeEmailInput.value.trim();
                    if (name) {
                        const newId = `func-${Date.now()}`;
                        if (!state.funcionarios) { state.funcionarios = []; }
                        state.funcionarios.push({ id: newId, nome: name, email: email, calendario: {} });
                        state.funcionarioSelecionadoId = newId;
                        newEmployeeInput.value = '';
                        newEmployeeEmailInput.value = '';
                        saveState();
                    } else { alert('Por favor, insira um nome para o funcionário.'); }
                }

                function handleRemoveEmployee() {
                    if (!isEditor || !state.funcionarioSelecionadoId || !state.funcionarios || state.funcionarios.length === 0) return;
                    const selectedEmployee = state.funcionarios.find(f => f.id === state.funcionarioSelecionadoId);
                    if(confirm(`Tem certeza que deseja remover "${selectedEmployee.nome}"? Esta ação não pode ser desfeita.`)) {
                        state.funcionarios = state.funcionarios.filter(f => f.id !== state.funcionarioSelecionadoId);
                        state.funcionarioSelecionadoId = state.funcionarios.length > 0 ? state.funcionarios[0].id : null;
                        saveState();
                    }
                }

                function handleSelectEmployee() {
                    state.funcionarioSelecionadoId = employeeSelect.value;
                    renderCalendar();
                    calculateAndDisplaySummaries();
                }

                function handleYearChange() {
                    localStateLoaded = false;
                    calendarContainer.innerHTML = '<p style="text-align:center;">Carregando dados do novo ano...</p>';
                    employeeSelect.innerHTML = '';
                    listenForChanges();
                }
                
                function handleChangePassword() {
                    const newPassword = prompt("Digite sua nova senha (mínimo 6 caracteres):");
                    if (newPassword && newPassword.length >= 6) {
                        const user = firebase.auth().currentUser;
                        if (user) {
                            user.updatePassword(newPassword).then(() => {
                                alert("Senha alterada com sucesso!");
                            }).catch((error) => {
                                console.error("Erro ao alterar senha:", error);
                                alert(`Erro ao alterar a senha: ${error.message}\n\nNota: Para sua segurança, pode ser necessário fazer login novamente antes de alterar a senha.`);
                            });
                        }
                    } else if (newPassword) {
                        alert("A senha deve ter pelo menos 6 caracteres.");
                    }
                }

                populateHoursDatalist();
                listenForChanges();

                calendarContainer.addEventListener('click', handleDayClick);
                addEmployeeBtn.addEventListener('click', handleAddEmployee);
                removeEmployeeBtn.addEventListener('click', handleRemoveEmployee);
                employeeSelect.addEventListener('change', handleSelectEmployee);
                yearSelect.addEventListener('change', handleYearChange);
                modalSaveBtn.addEventListener('click', handleSaveDay);
                modalCancelBtn.addEventListener('click', () => modal.classList.add('hidden'));
                
                changePasswordBtn.addEventListener('click', handleChangePassword);
            }
        });
