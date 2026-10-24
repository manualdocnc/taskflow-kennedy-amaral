/* Persistência isolada da interface. Mantido como script clássico para abrir em file:// sem servidor. */
(function (global) {
  'use strict';
  const KEY = 'taskflow-clinica-v1';
  const today = new Date();
  const localISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dateAt = (offset) => { const d = new Date(today); d.setDate(d.getDate() + offset); return localISO(d); };
  const initial = () => ({
    doctors: [
      { id: 'medico-1', name: 'Dra. Ana Clara', specialty: 'Cardiologia' },
      { id: 'medico-2', name: 'Dr. Rafael Mendes', specialty: 'Clínica geral' }
    ],
    slots: [
      { id: 's1', doctorId: 'medico-1', date: dateAt(1), time: '09:00' },
      { id: 's2', doctorId: 'medico-1', date: dateAt(1), time: '10:30' },
      { id: 's3', doctorId: 'medico-1', date: dateAt(2), time: '14:00' },
      { id: 's4', doctorId: 'medico-2', date: dateAt(1), time: '11:00' },
      { id: 's5', doctorId: 'medico-2', date: dateAt(3), time: '15:30' }
    ],
    appointments: [
      { id: 'a1', slotId: 's1', doctorId: 'medico-1', patient: 'Beatriz Oliveira', date: dateAt(1), time: '09:00', status: 'Confirmada' },
      { id: 'a2', slotId: 's4', doctorId: 'medico-2', patient: 'Lucas Ferreira', date: dateAt(1), time: '11:00', status: 'Confirmada' }
    ]
  });
  function read() {
    try {
      const raw = global.localStorage.getItem(KEY);
      if (!raw) { const data = initial(); write(data); return data; }
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.doctors) || !Array.isArray(data.slots) || !Array.isArray(data.appointments)) throw new Error('Dados locais inválidos.');
      return data;
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error('Os dados salvos estão inválidos. Não foi possível carregar a agenda.');
      if (error && error.name === 'SecurityError') throw new Error('O navegador bloqueou o armazenamento local. Abra este arquivo em um navegador com armazenamento habilitado.');
      throw error;
    }
  }
  function write(data) {
    try { global.localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (_) { throw new Error('Não foi possível salvar os dados neste navegador. Verifique o armazenamento disponível.'); }
  }
  global.TaskFlowStorage = { read, write };
})(window);
