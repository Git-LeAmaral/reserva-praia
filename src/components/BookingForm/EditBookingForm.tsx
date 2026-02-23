import { useState } from 'react';
import Swal from 'sweetalert2';
import './BookingForm.css';
import type { Booking, CompanionInfo } from '../Dashboard/Dashboard';

interface EditBookingFormProps {
  booking: Booking;
  allBookings: Booking[];
  onUpdate: (updated: Booking) => void;
  onCancel: () => void;
}

interface EditableCompanion {
  id: number;
  name: string;
  cpf: string;
  age: string;
}

// Converts ISO string to YYYY-MM-DD for use in <input type="date">
const toInputDate = (isoStr: string) => isoStr.split('T')[0];

export const EditBookingForm: React.FC<EditBookingFormProps> = ({ booking, allBookings, onUpdate, onCancel }) => {
  const [startDateStr, setStartDateStr] = useState<string>(toInputDate(booking.startDate));
  const [endDateStr, setEndDateStr] = useState<string>(toInputDate(booking.endDate));

  const initialRate = booking.dailyRate ?? booking.totalPrice / (booking.totalDays || 1);
  const [dailyRateStr, setDailyRateStr] = useState<string>(String(initialRate));

  const [formData, setFormData] = useState({
    fullName: booking.titularName,
    cpf: booking.titularCpf ?? '',
    age: booking.titularAge ?? '',
    phone: booking.titularPhone ?? '',
    email: booking.titularEmail ?? '',
  });

  const [companions, setCompanions] = useState<EditableCompanion[]>(
    (booking.companions ?? []).map((c, i) => ({ id: i, name: c.name, cpf: c.cpf, age: c.age }))
  );

  const [showModal, setShowModal] = useState(false);

  const MAX_COMPANIONS = 5;
  const dailyRate = parseFloat(dailyRateStr.replace(',', '.')) || 0;

  // Recalculate days dynamically from current date inputs
  const startDate = startDateStr ? new Date(startDateStr + 'T12:00:00') : new Date(booking.startDate);
  const endDate = endDateStr ? new Date(endDateStr + 'T12:00:00') : new Date(booking.endDate);
  const diffTime = endDate.getTime() - startDate.getTime();
  const totalDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 1;
  const totalPrice = totalDays * dailyRate;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanionChange = (id: number, field: keyof EditableCompanion, value: string) => {
    setCompanions(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addCompanion = () => {
    if (companions.length < MAX_COMPANIONS) {
      setCompanions(prev => [...prev, { id: Date.now(), name: '', cpf: '', age: '' }]);
    }
  };

  const removeCompanion = (id: number) => {
    setCompanions(prev => prev.filter(c => c.id !== id));
  };

  // Checks if the new date range conflicts with any other booking (excluding this one)
  const hasDateConflict = (): boolean => {
    const sTime = startDate.getTime();
    const eTime = endDate.getTime();
    return allBookings
      .filter(b => b.id !== booking.id)
      .some(b => {
        const bStart = new Date(b.startDate); bStart.setHours(0, 0, 0, 0);
        const bEnd = new Date(b.endDate); bEnd.setHours(23, 59, 59, 999);
        return Math.max(sTime, bStart.getTime()) <= Math.min(eTime, bEnd.getTime());
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDateStr || !endDateStr) {
      Swal.fire({ icon: 'warning', title: 'Datas inválidas', text: 'Selecione as datas de entrada e saída.', width: '350px', padding: '1.5rem' });
      return;
    }

    if (endDate <= startDate) {
      Swal.fire({ icon: 'warning', title: 'Datas inválidas', text: 'A data de saída deve ser posterior à data de entrada.', width: '350px', padding: '1.5rem' });
      return;
    }

    if (hasDateConflict()) {
      Swal.fire({ icon: 'error', title: 'Período Indisponível', text: 'O novo período conflita com outra reserva existente.', width: '350px', padding: '1.5rem' });
      return;
    }

    setShowModal(true);
  };

  const confirmUpdate = () => {
    const updatedCompanions: CompanionInfo[] = companions.map(c => ({
      name: c.name, cpf: c.cpf, age: c.age,
    }));

    const updatedBooking: Booking = {
      ...booking,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      titularName: formData.fullName,
      titularCpf: formData.cpf,
      titularAge: formData.age,
      titularPhone: formData.phone,
      titularEmail: formData.email,
      companions: updatedCompanions,
      dailyRate,
      totalDays,
      totalPrice,
    };

    onUpdate(updatedBooking);
    setShowModal(false);
  };

  return (
    <>
      <div className="booking-form">
        <div className="form-header flex-between mb-4">
          <div>
            <h2>Editar Reserva</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {totalDays} {totalDays === 1 ? 'diária' : 'diárias'} · Total: <strong style={{ color: 'var(--success-color)' }}>R$ {totalPrice.toFixed(2)}</strong>
            </p>
          </div>
          <div className="price-card">
            <span className="price-label">{totalDays} {totalDays === 1 ? 'diária' : 'diárias'}</span>
            <strong className="price-value">R$ {totalPrice.toFixed(2)}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-container">

          {/* Dates */}
          <div className="form-section">
            <h3>Datas da Reserva</h3>
            <div className="form-row" style={{ minWidth: 0, overflow: 'hidden' }}>
              <div className="form-group" style={{ minWidth: 0 }}>
                <label htmlFor="startDate">Data de Entrada</label>
                <input
                  type="date"
                  id="startDate"
                  min={todayStr}
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  style={{ width: '100%', minWidth: 0 }}
                />
              </div>
              <div className="form-group" style={{ minWidth: 0 }}>
                <label htmlFor="endDate">Data de Saída</label>
                <input
                  type="date"
                  id="endDate"
                  min={startDateStr || todayStr}
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  style={{ width: '100%', minWidth: 0 }}
                />
              </div>
            </div>
          </div>

          {/* Daily Rate */}
          <div className="form-section">
            <h3>Valor por Diária</h3>
            <div className="form-group">
              <label htmlFor="dailyRate">Valor da Diária (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                id="dailyRate"
                name="dailyRate"
                value={dailyRateStr}
                onChange={(e) => setDailyRateStr(e.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="Ex: 300"
              />
            </div>
          </div>

          {/* Titular */}
          <div className="form-section">
            <h3>Dados do Titular</h3>
            <div className="form-group">
              <label htmlFor="fullName">Nome Completo</label>
              <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Ex: João da Silva" />
            </div>
            <div className="form-row" style={{ minWidth: 0, overflow: 'hidden' }}>
              <div className="form-group" style={{ minWidth: 0 }}>
                <label htmlFor="cpf">CPF</label>
                <input type="text" id="cpf" name="cpf" value={formData.cpf} onChange={handleInputChange} placeholder="000.000.000-00" style={{ width: '100%', minWidth: 0 }} />
              </div>
              <div className="form-group" style={{ minWidth: 0 }}>
                <label htmlFor="age">Idade</label>
                <input type="number" id="age" name="age" min="0" value={formData.age} onChange={handleInputChange} placeholder="Ex: 30" style={{ width: '100%', minWidth: 0 }} />
              </div>
            </div>
            <div className="form-row" style={{ minWidth: 0, overflow: 'hidden' }}>
              <div className="form-group" style={{ minWidth: 0 }}>
                <label htmlFor="phone">Telefone</label>
                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="(11) 99999-9999" style={{ width: '100%', minWidth: 0 }} />
              </div>
              <div className="form-group" style={{ minWidth: 0 }}>
                <label htmlFor="email">E-mail</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="joao@exemplo.com" style={{ width: '100%', minWidth: 0 }} />
              </div>
            </div>
          </div>

          {/* Companions */}
          <div className="form-section companions-section">
            <div className="section-header">
              <h3>Acompanhantes ({companions.length}/{MAX_COMPANIONS})</h3>
              <span className="badge">Total: {1 + companions.length}/6</span>
            </div>
            <p className="helper-text">Você pode adicionar mais {MAX_COMPANIONS - companions.length} pessoa(s).</p>
            <div className="companions-list">
              {companions.map((companion, index) => (
                <div key={companion.id} className="companion-item slide-in">
                  <div className="companion-header flex-between">
                    <label>Acompanhante {index + 1}</label>
                    <button type="button" className="remove-btn" onClick={() => removeCompanion(companion.id)} title="Remover">✕</button>
                  </div>
                  <div className="form-group">
                    <input type="text" value={companion.name} onChange={(e) => handleCompanionChange(companion.id, 'name', e.target.value)} placeholder="Nome completo" />
                  </div>
                  <div className="form-row" style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div className="form-group mb-0" style={{ minWidth: 0 }}>
                      <input type="text" value={companion.cpf} onChange={(e) => handleCompanionChange(companion.id, 'cpf', e.target.value)} placeholder="CPF" style={{ width: '100%', minWidth: 0 }} />
                    </div>
                    <div className="form-group mb-0" style={{ minWidth: 0 }}>
                      <input type="number" min="0" value={companion.age} onChange={(e) => handleCompanionChange(companion.id, 'age', e.target.value)} placeholder="Idade" style={{ width: '100%', minWidth: 0 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-outline border-dashed w-full mt-4" onClick={addCompanion} disabled={companions.length >= MAX_COMPANIONS}>
              + Adicionar Acompanhante
            </button>
          </div>

          <div className="form-actions action-buttons">
            <button type="button" className="btn btn-secondary flex-1" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn btn-primary flex-1">Salvar Alterações</button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content slide-in">
            <h2>Confirmar Edição?</h2>
            <p className="modal-subtitle">Revise os dados antes de salvar.</p>
            <div className="modal-summary">
              <div className="summary-row">
                <span>Período:</span>
                <strong>{startDate.toLocaleDateString('pt-BR')} - {endDate.toLocaleDateString('pt-BR')}</strong>
              </div>
              <div className="summary-row">
                <span>Diárias:</span>
                <strong>{totalDays}</strong>
              </div>
              <div className="summary-row">
                <span>Valor da Diária:</span>
                <strong>R$ {dailyRate.toFixed(2)}</strong>
              </div>
              <div className="summary-row">
                <span>Valor Total:</span>
                <strong className="price-highlight">R$ {totalPrice.toFixed(2)}</strong>
              </div>
            </div>
            <div className="modal-people">
              <h4 style={{ marginBottom: '0.5rem' }}>Hóspedes ({1 + companions.length}):</h4>
              <ul style={{ listStyle: 'none' }}>
                <li>👤 {formData.fullName || booking.titularName} (Titular)</li>
                {companions.map(c => (<li key={c.id}>👥 {c.name}</li>))}
              </ul>
            </div>
            <div className="modal-actions action-buttons">
              <button className="btn btn-secondary flex-1" onClick={() => setShowModal(false)}>Voltar</button>
              <button className="btn btn-primary flex-1" onClick={confirmUpdate}>Sim, Salvar!</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
