(() => {
  'use strict';
  const API = window.TaskFlowAppointments;
  const $ = (selector, root = document) => root.querySelector(selector);
  const content = $('#app-content');
  const titles = { inicio: 'Visão geral', agenda: 'Agenda de consultas', agendar: 'Agendar consulta', horarios: 'Meus horários', ajuda: 'Como usar' };
  let role = localStorage.getItem('taskflow-profile') || 'recepcao';
  let activeHash = '';
  let toastTimer;
  const initials = name => name.split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase();
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const dateFmt = value => new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'long', year:'numeric' }).format(new Date(`${value}T12:00:00`));
  const shortDate = value => new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'short' }).format(new Date(`${value}T12:00:00`));
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const currentDoctor = () => role.startsWith('medico-') ? role : null;
  const doctorName = (data, id) => data.doctors.find(d => d.id === id)?.name || 'Médico';
  const doctorByRole = (data) => data.doctors.find(d => d.id === role);
  const toast = (message, type = 'success') => {
    const region = $('#toast-region'); region.innerHTML = `<div class="toast ${type}" role="${type === 'error' ? 'alert' : 'status'}"><span aria-hidden="true">${type === 'error' ? '!' : '✓'}</span>${safe(message)}<button aria-label="Fechar mensagem" class="toast-close">×</button></div>`;
    $('.toast-close', region).onclick = () => region.replaceChildren(); clearTimeout(toastTimer); toastTimer = setTimeout(() => region.replaceChildren(), 5000);
  };
  const wrap = (eyebrow, title, desc, action = '') => `<section class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${desc}</p></div>${action}</section>`;
  const empty = (icon, title, detail, action = '') => `<div class="empty-state"><span class="empty-icon" aria-hidden="true">${icon}</span><h3>${title}</h3><p>${detail}</p>${action}</div>`;
  const button = (label, href, kind = 'primary') => `<a class="button ${kind}" href="#${href}">${label}</a>`;
  function profileUI(data) {
    const doctor = doctorByRole(data);
    const name = doctor?.name || 'Mariana Souza';
    $('#profile-name').textContent = name; $('#profile-role').textContent = doctor ? `Médica · ${doctor.specialty}` : 'Recepção';
    $('#profile-avatar').textContent = initials(name);
    $('#profile-switch').value = role;
    document.querySelectorAll('[data-role="recepcao"]').forEach(el => el.hidden = !!doctor);
    document.querySelectorAll('[data-role="medico"]').forEach(el => el.hidden = !doctor);
  }
  function cardTable(items, data, compact = false) {
    if (!items.length) return empty('▦', 'Nenhuma consulta encontrada', 'Quando houver consultas registradas, elas aparecerão aqui.', role === 'recepcao' ? button('＋ Agendar consulta', 'agendar', 'secondary') : '');
    return `<div class="table-wrap"><table><thead><tr><th>Paciente</th><th>Médico</th><th>Data</th><th>Horário</th><th>Status</th><th><span class="sr-only">Detalhes</span></th></tr></thead><tbody>${items.map(a => `<tr><td><span class="patient-cell"><span class="patient-avatar">${initials(a.patient)}</span><strong>${safe(a.patient)}</strong></span></td><td>${safe(doctorName(data, a.doctorId))}</td><td>${dateFmt(a.date)}</td><td><span class="time-cell">${safe(a.time)}</span></td><td><span class="status-badge"><i></i>${safe(a.status)}</span></td><td><button class="text-button" data-detail="${safe(a.id)}" aria-label="Ver detalhes de ${safe(a.patient)}">Detalhes <span aria-hidden="true">→</span></button></td></tr>`).join('')}</tbody></table></div>`;
  }
  function dashboard(data) {
    const doctor = currentDoctor();
    const all = API.appointmentsFor(role);
    const upcoming = all.filter(a => a.date >= todayISO());
    const slots = data.slots.filter(s => (!doctor || s.doctorId === doctor) && s.date >= todayISO() && !data.appointments.some(a => a.slotId === s.id));
    const who = doctor ? doctorByRole(data)?.name : 'Mariana';
    const quick = doctor ? button('◷ Gerenciar horários', 'horarios') : button('＋ Nova consulta', 'agendar');
    return `${wrap('PAINEL DA CLÍNICA', `Olá, ${safe(who)} 👋`, 'Aqui está o resumo da agenda e dos próximos atendimentos.', quick)}
      <section class="welcome-banner"><div class="welcome-copy"><span class="welcome-icon" aria-hidden="true">✳</span><div><span class="banner-label">CLÍNICA VIVER BEM</span><h2>${doctor ? 'Sua agenda, sempre organizada.' : 'Cuidado começa com organização.'}</h2><p>${doctor ? 'Acompanhe seus horários e os pacientes que você atenderá.' : 'Encontre horários disponíveis e organize os atendimentos da equipe.'}</p></div></div><div class="banner-illustration" aria-hidden="true"><span>✚</span><span>◷</span><span>✦</span></div></section>
      <section class="stat-grid"><article class="stat-card"><span class="stat-icon purple" aria-hidden="true">▦</span><div class="stat-label">Consultas agendadas</div><div class="stat-value">${upcoming.length}</div><small>na sua agenda</small></article><article class="stat-card"><span class="stat-icon green" aria-hidden="true">◷</span><div class="stat-label">Horários disponíveis</div><div class="stat-value">${slots.length}</div><small>aguardando agendamento</small></article><article class="stat-card stat-highlight"><div class="stat-label">Acesso rápido</div><h3>${doctor ? 'Precisa atualizar sua agenda?' : 'Um novo agendamento?'}</h3><p>${doctor ? 'Cadastre ou ajuste um horário livre.' : 'Leva só um instante para organizar.'}</p>${button(doctor ? 'Meus horários →' : 'Agendar consulta →', doctor ? 'horarios' : 'agendar', 'secondary')}</article></section>
      <section class="panel"><div class="panel-heading"><div><div class="eyebrow">AGENDA</div><h2>Próximas consultas</h2></div><a class="text-button" href="#agenda">Ver agenda completa <span aria-hidden="true">→</span></a></div>${cardTable(upcoming.slice(0, 5), data, true)}</section>`;
  }
  function appointmentsPage(data) {
    const doctor = currentDoctor();
    let items = API.appointmentsFor(role);
    const filters = `<div class="filter-row"><label>Data<input type="date" id="filter-date"></label>${doctor ? '' : `<label>Médico<select id="filter-doctor"><option value="">Todos os médicos</option>${data.doctors.map(d => `<option value="${d.id}">${safe(d.name)}</option>`).join('')}</select></label>`}<button class="button outline" id="clear-filters">Limpar filtros</button></div>`;
    return `${wrap('ACOMPANHAMENTO', 'Agenda de consultas', doctor ? 'Consulte os pacientes da sua agenda.' : 'Consulte e localize os agendamentos da clínica.', !doctor ? button('＋ Agendar consulta', 'agendar') : '')}<section class="panel"><div class="panel-heading"><div><div class="eyebrow">CONSULTAS</div><h2 id="agenda-count">${items.length} ${items.length === 1 ? 'consulta' : 'consultas'}</h2></div></div>${filters}<div id="agenda-results">${cardTable(items, data)}</div></section>`;
  }
  function bookingPage(data) {
    if (role !== 'recepcao') return `${wrap('ACESSO DA RECEPÇÃO', 'Agendar consulta', 'Este fluxo está disponível para o perfil da recepção.')}${empty('♙', 'Troque para o perfil Recepção', 'Use o seletor no topo para acessar o formulário de agendamento.')}`;
    return `${wrap('NOVO ATENDIMENTO', 'Agendar consulta', 'Preencha os dados e confira o resumo antes de confirmar.', button('← Voltar à agenda', 'agenda', 'outline'))}<div class="form-layout"><form class="panel form-panel" id="booking-form" novalidate><div class="form-section-title"><span>01</span><div><h2>Dados do atendimento</h2><p>Os campos marcados com * são obrigatórios.</p></div></div><label class="field">Nome do paciente *<input name="patient" maxlength="100" required placeholder="Ex.: Beatriz Oliveira" autocomplete="name"><small>Informe o nome completo do paciente.</small></label><label class="field">Médico *<select name="doctorId" required><option value="">Selecione o médico</option>${data.doctors.map(d => `<option value="${d.id}">${safe(d.name)} · ${safe(d.specialty)}</option>`).join('')}</select></label><div class="field-grid"><label class="field">Data *<input name="date" type="date" min="${todayISO()}" required><small>Escolha uma data a partir de hoje.</small></label><label class="field">Horário disponível *<select name="slotId" required disabled><option value="">Selecione o médico e a data</option></select></label></div><div class="form-actions"><a class="button outline" href="#agenda">Voltar</a><button class="button primary" type="submit">Confirmar agendamento <span aria-hidden="true">→</span></button></div></form><aside class="panel summary-panel"><div class="summary-icon" aria-hidden="true">▤</div><div class="eyebrow">CONFIRA ANTES DE SALVAR</div><h2>Resumo do agendamento</h2><p>As informações escolhidas aparecerão aqui.</p><dl id="booking-summary"><div><dt>Paciente</dt><dd id="sum-patient">—</dd></div><div><dt>Médico</dt><dd id="sum-doctor">—</dd></div><div><dt>Data</dt><dd id="sum-date">—</dd></div><div><dt>Horário</dt><dd id="sum-time">—</dd></div></dl><div class="summary-foot">✓ O horário só será reservado após a confirmação.</div></aside></div>`;
  }
  function slotsPage(data) {
    const doctor = currentDoctor();
    if (!doctor) return `${wrap('AGENDA MÉDICA', 'Meus horários', 'Cadastre e ajuste os horários disponíveis da sua agenda.')}${empty('◷', 'Área exclusiva do médico', 'Troque para um perfil médico no seletor acima para continuar.')}`;
    const slots = data.slots.filter(s => s.doctorId === doctor).sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const rows = slots.map(s => { const appt = data.appointments.find(a => a.slotId === s.id); return `<tr><td>${dateFmt(s.date)}</td><td><span class="time-cell">${s.time}</span></td><td><span class="${appt ? 'status-badge booked' : 'status-badge available'}"><i></i>${appt ? 'Agendado' : 'Disponível'}</span></td><td>${appt ? `<span class="patient-name">${safe(appt.patient)}</span>` : `<button class="text-button" data-edit-slot="${safe(s.id)}">Alterar horário</button>`}</td></tr>`; }).join('');
    return `${wrap('SUA AGENDA', 'Meus horários', 'Gerencie os horários disponíveis para os pacientes.', '<button class="button primary" id="add-slot-button">＋ Cadastrar horário</button>')}<section class="panel"><div class="panel-heading"><div><div class="eyebrow">${safe(doctorByRole(data)?.name || '')}</div><h2>Horários cadastrados</h2></div><span class="count-pill">${slots.length} horários</span></div>${slots.length ? `<div class="table-wrap"><table><thead><tr><th>Data</th><th>Horário</th><th>Situação</th><th>Paciente / ação</th></tr></thead><tbody>${rows}</tbody></table></div>` : empty('◷', 'Nenhum horário cadastrado', 'Cadastre seus horários para que a recepção possa agendar consultas.', '<button class="button secondary" id="empty-add-slot">＋ Cadastrar horário</button>')}</section><dialog id="slot-dialog" class="modal"><form id="slot-form" novalidate><div class="modal-head"><div><div class="eyebrow" id="slot-eyebrow">NOVO HORÁRIO</div><h2 id="slot-title">Cadastrar horário</h2></div><button type="button" class="icon-button" id="close-modal" aria-label="Fechar">×</button></div><input type="hidden" name="slotId"><label class="field">Data *<input name="date" type="date" min="${todayISO()}" required></label><label class="field">Horário *<input name="time" type="time" required step="1800"></label><p class="form-error" id="slot-error" role="alert"></p><div class="form-actions"><button type="button" class="button outline" id="cancel-modal">Voltar</button><button class="button primary" type="submit">Salvar horário</button></div></form></dialog>`;
  }
  function helpPage() {
    const steps = role === 'recepcao' ? [['01','Encontre um horário','Abra “Agendar consulta”, informe o paciente e escolha o médico. A lista mostra apenas horários livres.'],['02','Confira e confirme','Revise o resumo do atendimento e confirme. A consulta aparecerá na agenda da clínica.'],['03','Consulte a agenda','Use “Agenda de consultas” para ver os registros. Filtre por data ou médico quando precisar.']] : [['01','Cadastre sua disponibilidade','Em “Meus horários”, escolha uma data e hora para abrir um novo horário na sua agenda.'],['02','Ajuste quando necessário','Horários livres podem ser alterados. Um horário com consulta agendada fica protegido.'],['03','Acompanhe seus pacientes','A agenda mostra somente as consultas do seu perfil médico.']];
    return `${wrap('CENTRAL DE AJUDA', 'Como usar o TaskFlow', 'Um guia rápido para as tarefas do seu perfil.')}
      <section class="help-intro"><span class="help-mark" aria-hidden="true">?</span><div><h2>Comece por aqui</h2><p>O TaskFlow mantém a agenda organizada neste computador. Seus dados ficam salvos no navegador que você está usando.</p></div></section><div class="steps-grid">${steps.map(([n,t,d]) => `<article class="step-card"><span class="step-number">${n}</span><h3>${t}</h3><p>${d}</p></article>`).join('')}</div><section class="help-callout"><span aria-hidden="true">ⓘ</span><div><strong>Precisa trocar de perfil?</strong><p>Use o seletor “Perfil” no alto da tela para acessar a visão da recepção ou de um dos médicos. Esta seleção serve para demonstrar os fluxos neste MVP local.</p></div></section><section class="help-callout subtle"><span aria-hidden="true">▣</span><div><strong>Sobre seus dados</strong><p>Os dados de exemplo e as alterações ficam apenas neste navegador e neste computador. Não há sincronização com outros dispositivos.</p></div></section>`;
  }
  function filterAgenda(data) {
    const date = $('#filter-date')?.value || ''; const doctor = $('#filter-doctor')?.value || '';
    const all = API.appointmentsFor(role).filter(a => (!date || a.date === date) && (!doctor || a.doctorId === doctor));
    $('#agenda-count').textContent = `${all.length} ${all.length === 1 ? 'consulta' : 'consultas'}`;
    $('#agenda-results').innerHTML = cardTable(all, data);
    $('#clear-filters').disabled = !date && !doctor;
  }
  function bindBooking(data) {
    const form = $('#booking-form'); if (!form) return;
    const patient = form.elements.patient, doctor = form.elements.doctorId, date = form.elements.date, slot = form.elements.slotId;
    const updateSummary = () => {
      $('#sum-patient').textContent = patient.value.trim() || '—';
      $('#sum-doctor').textContent = doctor.options[doctor.selectedIndex]?.text.split(' · ')[0] || '—';
      $('#sum-date').textContent = date.value ? dateFmt(date.value) : '—';
      $('#sum-time').textContent = slot.value ? slot.options[slot.selectedIndex].text.split(' · ')[0] : '—';
    };
    const populate = () => {
      const available = doctor.value && date.value ? API.availableSlots(data, doctor.value, date.value) : [];
      slot.innerHTML = available.length ? `<option value="">Selecione um horário</option>${available.sort((a,b) => a.time.localeCompare(b.time)).map(s => `<option value="${s.id}">${s.time}</option>`).join('')}` : `<option value="">${doctor.value && date.value ? 'Nenhum horário livre nesta data' : 'Selecione o médico e a data'}</option>`;
      slot.disabled = !available.length; updateSummary();
    };
    [patient, doctor, date, slot].forEach(el => el.addEventListener('input', () => { el.removeAttribute('aria-invalid'); updateSummary(); }));
    doctor.addEventListener('change', populate); date.addEventListener('change', populate); slot.addEventListener('change', updateSummary);
    form.addEventListener('submit', e => { e.preventDefault(); const invalid = [patient, doctor, date, slot].find(el => !el.value); if (invalid) { invalid.setAttribute('aria-invalid', 'true'); invalid.focus(); toast(invalid === patient ? 'Informe o nome do paciente.' : invalid === doctor ? 'Selecione um médico.' : invalid === date ? 'Selecione uma data.' : 'Selecione um horário disponível.', 'error'); return; }
      try { API.book({ patient: patient.value, doctorId: doctor.value, slotId: slot.value }); toast('Consulta agendada com sucesso.'); navigate('agenda'); } catch (err) { toast(err.message, 'error'); populate(); }
    });
  }
  function bindSlots(data) {
    const dialog = $('#slot-dialog'); if (!dialog) return;
    const form = $('#slot-form');
    const open = slot => { form.reset(); $('#slot-error').textContent = ''; form.elements.slotId.value = slot?.id || ''; form.elements.date.value = slot?.date || ''; form.elements.time.value = slot?.time || ''; $('#slot-title').textContent = slot ? 'Alterar horário' : 'Cadastrar horário'; $('#slot-eyebrow').textContent = slot ? 'AJUSTAR DISPONIBILIDADE' : 'NOVO HORÁRIO'; dialog.showModal(); };
    $('#add-slot-button')?.addEventListener('click', () => open()); $('#empty-add-slot')?.addEventListener('click', () => open());
    document.querySelectorAll('[data-edit-slot]').forEach(el => el.addEventListener('click', () => open(data.slots.find(s => s.id === el.dataset.editSlot))));
    $('#close-modal').onclick = () => dialog.close(); $('#cancel-modal').onclick = () => dialog.close();
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    form.addEventListener('submit', e => { e.preventDefault(); try { const payload = { actorId: role, slotId: form.elements.slotId.value, date: form.elements.date.value, time: form.elements.time.value }; if (payload.slotId) API.updateSlot(payload); else API.addSlot({ ...payload, doctorId: role }); dialog.close(); toast(payload.slotId ? 'Horário atualizado.' : 'Horário cadastrado.'); render(); } catch (err) { $('#slot-error').textContent = err.message; } });
  }
  function detail(id) {
    try { const data = API.list(); const a = API.appointmentsFor(role).find(item => item.id === id); if (!a) return; const dlg = document.createElement('dialog'); dlg.className = 'modal detail-modal'; dlg.innerHTML = `<div class="modal-head"><div><div class="eyebrow">DETALHES DA CONSULTA</div><h2>${safe(a.patient)}</h2></div><button class="icon-button" aria-label="Fechar">×</button></div><dl class="detail-list"><div><dt>Médico</dt><dd>${safe(doctorName(data, a.doctorId))}</dd></div><div><dt>Data</dt><dd>${dateFmt(a.date)}</dd></div><div><dt>Horário</dt><dd>${safe(a.time)}</dd></div><div><dt>Status</dt><dd><span class="status-badge"><i></i>${safe(a.status)}</span></dd></div></dl><div class="form-actions"><button class="button primary" type="button">Fechar</button></div>`; document.body.append(dlg); dlg.querySelectorAll('button').forEach(b => b.onclick = () => dlg.close()); dlg.addEventListener('close', () => dlg.remove()); dlg.showModal(); } catch (e) { toast(e.message, 'error'); }
  }
  function render() {
    let data; try { data = API.list(); } catch (error) { content.innerHTML = `${wrap('ARMAZENAMENTO LOCAL', 'Não foi possível abrir a agenda', 'O navegador não disponibilizou os dados locais desta aplicação.')}${empty('!', error.message, 'Tente abrir o arquivo em um navegador com armazenamento local habilitado.')}`; return; }
    profileUI(data);
    const page = (location.hash.replace('#','') || 'inicio');
    const normalized = titles[page] ? page : 'inicio';
    activeHash = normalized; $('#page-crumb').textContent = titles[normalized];
    document.querySelectorAll('[data-nav]').forEach(a => { a.classList.toggle('active', a.dataset.nav === normalized); a.setAttribute('aria-current', a.dataset.nav === normalized ? 'page' : 'false'); });
    content.innerHTML = normalized === 'inicio' ? dashboard(data) : normalized === 'agenda' ? appointmentsPage(data) : normalized === 'agendar' ? bookingPage(data) : normalized === 'horarios' ? slotsPage(data) : helpPage();
    if (normalized === 'agenda') { $('#filter-date')?.addEventListener('change', () => filterAgenda(data)); $('#filter-doctor')?.addEventListener('change', () => filterAgenda(data)); $('#clear-filters')?.addEventListener('click', () => { $('#filter-date').value = ''; if ($('#filter-doctor')) $('#filter-doctor').value = ''; filterAgenda(data); }); }
    bindBooking(data); bindSlots(data);
    content.querySelectorAll('[data-detail]').forEach(el => el.addEventListener('click', () => detail(el.dataset.detail)));
    $('#sidebar').classList.remove('open'); $('#menu-toggle').setAttribute('aria-expanded', 'false');
  }
  function navigate(page) { location.hash = page; }
  $('#profile-switch').addEventListener('change', e => { role = e.target.value; localStorage.setItem('taskflow-profile', role); if (activeHash === 'agendar' && role !== 'recepcao') navigate('inicio'); else if (activeHash === 'horarios' && role === 'recepcao') navigate('inicio'); else render(); toast(`Perfil alterado para ${role === 'recepcao' ? 'Recepção' : 'médico'}.`); });
  $('#menu-toggle').addEventListener('click', () => { const open = $('#sidebar').classList.toggle('open'); $('#menu-toggle').setAttribute('aria-expanded', String(open)); });
  window.addEventListener('hashchange', render);
  $('#today-label').textContent = new Intl.DateTimeFormat('pt-BR', { weekday:'short', day:'2-digit', month:'short' }).format(new Date()).replace('.', '');
  render();
})();
