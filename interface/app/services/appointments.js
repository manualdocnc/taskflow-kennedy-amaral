/* Regras de negócio independentes da apresentação. */
(function (global) {
  'use strict';
  const Store = global.TaskFlowStorage;
  const uid = () => (global.crypto && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const sameSlot = (a, b) => a.doctorId === b.doctorId && a.date === b.date && a.time === b.time;
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function list() { return Store.read(); }
  function availableSlots(data, doctorId, date) {
    const booked = data.appointments.map(a => a.slotId);
    return data.slots.filter(s => s.doctorId === doctorId && (!date || s.date === date) && !booked.includes(s.id));
  }
  function book({ doctorId, patient, slotId }) {
    const data = Store.read();
    if (!doctorId || !data.doctors.some(d => d.id === doctorId)) throw new Error('Selecione um médico.');
    const name = String(patient || '').trim();
    if (!name) throw new Error('Informe o nome do paciente.');
    if (name.length > 100) throw new Error('O nome do paciente deve ter até 100 caracteres.');
    const slot = data.slots.find(s => s.id === slotId && s.doctorId === doctorId);
    if (!slot) throw new Error('Selecione um horário disponível para o médico escolhido.');
    if (data.appointments.some(a => a.slotId === slot.id || sameSlot(a, slot))) throw new Error('Este horário não está disponível. O médico já possui uma consulta nesse período.');
    const appointment = { id: uid(), slotId: slot.id, doctorId, patient: name, date: slot.date, time: slot.time, status: 'Confirmada' };
    data.appointments.push(appointment); Store.write(data); return appointment;
  }
  function addSlot({ doctorId, date, time, actorId }) {
    const data = Store.read();
    if (!actorId || actorId !== doctorId || !data.doctors.some(d => d.id === doctorId)) throw new Error('Você só pode cadastrar seus próprios horários.');
    if (!date || !time || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Informe uma data e um horário válidos.');
    if (date < todayISO()) throw new Error('Não é possível cadastrar horário em uma data passada.');
    if (data.slots.some(s => sameSlot(s, { doctorId, date, time }))) throw new Error('Você já possui um horário cadastrado nessa data e hora.');
    if (data.appointments.some(a => sameSlot(a, { doctorId, date, time }))) throw new Error('Já existe uma consulta nesse horário.');
    const slot = { id: uid(), doctorId, date, time }; data.slots.push(slot); Store.write(data); return slot;
  }
  function updateSlot({ slotId, actorId, date, time }) {
    const data = Store.read();
    const slot = data.slots.find(s => s.id === slotId);
    if (!slot || actorId !== slot.doctorId) throw new Error('Você só pode alterar seus próprios horários.');
    if (data.appointments.some(a => a.slotId === slotId)) throw new Error('Este horário já tem uma consulta e não pode ser alterado.');
    if (!date || !time || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Informe uma data e um horário válidos.');
    if (date < todayISO()) throw new Error('Não é possível alterar para uma data passada.');
    if (data.slots.some(s => s.id !== slotId && sameSlot(s, { doctorId: slot.doctorId, date, time }))) throw new Error('Você já possui um horário cadastrado nessa data e hora.');
    Object.assign(slot, { date, time }); Store.write(data); return slot;
  }
  function appointmentsFor(actorId) {
    const data = Store.read();
    return data.appointments.filter(a => actorId === 'recepcao' || a.doctorId === actorId).sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }
  global.TaskFlowAppointments = {
    list, availableSlots, book, addSlot, updateSlot, appointmentsFor,
    cancel() { throw new Error('O cancelamento de consultas não é permitido.'); }
  };
})(window);
