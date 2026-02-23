import { useState } from 'react';
import './BookingForm.css';
import type { Booking } from '../Dashboard/Dashboard';

interface BookingFormProps {
  startDate: Date;
  endDate: Date;
  onSave: (booking: Booking) => void;
  onFinish: () => void;
}

interface Companion {
  id: number;
  name: string;
  cpf: string;
  age: string;
}

export const BookingForm: React.FC<BookingFormProps> = ({ startDate, endDate, onSave, onFinish }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    cpf: '',
    age: '',
    phone: '',
    email: '',
  });

  const [companions, setCompanions] = useState<Companion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Maximum 6 people total (1 titular + 5 companions)
  const MAX_COMPANIONS = 5;
  const DAILY_RATE = 300;

  // Calculate days difference
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // at least 1 day if same date
  const totalPrice = totalDays * DAILY_RATE;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanionChange = (id: number, field: keyof Companion, value: string) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  const confirmBooking = () => {
    const newBooking: Booking = {
      id: Date.now().toString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      titularName: formData.fullName,
      titularCpf: formData.cpf,
      titularAge: formData.age,
      titularPhone: formData.phone,
      titularEmail: formData.email,
      companions: companions.map(c => ({
        name: c.name,
        cpf: c.cpf,
        age: c.age
      })),
      totalDays,
      totalPrice
    };

    onSave(newBooking);
    setShowModal(false);
    setSubmitted(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    const totalPeople = 1 + companions.length;
    let body = `Reserva confirmada de ${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}\n\n`;
    body += `===== DADOS DO TITULAR =====\n`;
    body += `Nome: ${formData.fullName}\nCPF: ${formData.cpf}\nIdade: ${formData.age} anos\nTelefone: ${formData.phone}\nE-mail: ${formData.email}\n\n`;
    
    body += `===== RESUMO DA RESERVA =====\n`;
    body += `Total de Pessoas: ${totalPeople}\n`;
    body += `Total de Diárias: ${totalDays}\n`;
    body += `Valor Total: R$ ${totalPrice.toFixed(2)}\n`;
    
    if (companions.length > 0) {
      body += `\n===== ACOMPANHANTES =====\n`;
      companions.forEach((c, i) => {
        body += `${i + 1}. Nome: ${c.name} | CPF: ${c.cpf || 'Não info'} | Idade: ${c.age || 'Não info'} anos\n`;
      });
    }

    const mailto = `mailto:${formData.email}?subject=Resumo de Reserva - Reserva Praia&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  if (submitted) {
    return (
      <div className="booking-form success-card">
        <div className="success-icon">✓</div>
        <h2>Reserva Concluída!</h2>
        <p>Sua reserva foi registrada e aparecerá na página inicial.</p>
        
        <div className="summary-box">
          <p><strong>{startDate.toLocaleDateString('pt-BR')}</strong> até <strong>{endDate.toLocaleDateString('pt-BR')}</strong></p>
          <p>Total de diárias: <strong>{totalDays}</strong></p>
          <p>Valor total: <strong className="price-highlight">R$ {totalPrice.toFixed(2)}</strong></p>
          <p>Pessoas: <strong>{1 + companions.length}</strong> (Max 6)</p>
          
          <hr style={{ margin: '1rem 0', borderColor: 'var(--border-color)' }} />
          <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Pessoas na Reserva:</h4>
          <ul style={{ listStyle: 'inside', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
             <li>{formData.fullName} (Titular - {formData.age} anos)</li>
             {companions.map(c => (
               <li key={c.id}>{c.name} ({c.age} anos)</li>
             ))}
          </ul>
        </div>
        
        <div className="action-buttons print-hidden">
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ Imprimir Resumo
          </button>
          <button className="btn btn-secondary" onClick={handleEmail}>
            ✉️ Enviar por E-mail
          </button>
        </div>
        
        <button className="btn btn-outline text-center w-full mt-4 print-hidden" onClick={onFinish}>
          Voltar para Início
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="booking-form">
        <div className="form-header flex-between mb-4">
          <div>
            <h2>Detalhes da Reserva</h2>
            <p>
              <strong>{startDate.toLocaleDateString('pt-BR')}</strong> até <strong>{endDate.toLocaleDateString('pt-BR')}</strong>
            </p>
          </div>
          <div className="price-card">
            <span className="price-label">{totalDays} {totalDays === 1 ? 'diária' : 'diárias'}</span>
            <strong className="price-value">R$ {totalPrice.toFixed(2)}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-section">
            <h3>Dados do Titular</h3>
            <div className="form-group">
              <label htmlFor="fullName">Nome Completo</label>
              <input type="text" id="fullName" name="fullName" required value={formData.fullName} onChange={handleInputChange} placeholder="Ex: João da Silva" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cpf">CPF</label>
                <input type="text" id="cpf" name="cpf" required value={formData.cpf} onChange={handleInputChange} placeholder="000.000.000-00" />
              </div>
              <div className="form-group">
                <label htmlFor="age">Idade</label>
                <input type="number" id="age" name="age" required min="18" value={formData.age} onChange={handleInputChange} placeholder="Ex: 30" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Telefone</label>
                <input type="tel" id="phone" name="phone" required value={formData.phone} onChange={handleInputChange} placeholder="(11) 99999-9999" />
              </div>
              <div className="form-group">
                <label htmlFor="email">E-mail</label>
                <input type="email" id="email" name="email" required value={formData.email} onChange={handleInputChange} placeholder="joao@exemplo.com" />
              </div>
            </div>
          </div>

          <div className="form-section companions-section">
            <div className="section-header">
              <h3>Acompanhantes ({companions.length}/{MAX_COMPANIONS})</h3>
              <span className="badge">Total de Pessoas: {1 + companions.length}/6</span>
            </div>
            
            <p className="helper-text">Você pode adicionar mais {MAX_COMPANIONS - companions.length} pessoa(s).</p>
            
            <div className="companions-list">
              {companions.map((companion, index) => (
                <div key={companion.id} className="companion-item slide-in">
                  <div className="companion-header flex-between">
                     <label>Acompanhante {index + 1}</label>
                     <button type="button" className="remove-btn" onClick={() => removeCompanion(companion.id)} title="Remover">
                        ✕
                      </button>
                  </div>
                  <div className="form-group">
                      <input 
                        type="text" 
                        required 
                        value={companion.name} 
                        onChange={(e) => handleCompanionChange(companion.id, 'name', e.target.value)}
                        placeholder="Nome completo do acompanhante"
                      />
                  </div>
                  <div className="form-row">
                      <div className="form-group mb-0">
                          <input 
                            type="text" 
                            required 
                            value={companion.cpf} 
                            onChange={(e) => handleCompanionChange(companion.id, 'cpf', e.target.value)}
                            placeholder="CPF"
                          />
                      </div>
                      <div className="form-group mb-0">
                          <input 
                            type="number" 
                            required 
                            min="0"
                            value={companion.age} 
                            onChange={(e) => handleCompanionChange(companion.id, 'age', e.target.value)}
                            placeholder="Idade"
                          />
                      </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              type="button" 
              className="btn btn-outline border-dashed w-full mt-4" 
              onClick={addCompanion}
              disabled={companions.length >= MAX_COMPANIONS}
            >
              + Adicionar Acompanhante
            </button>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-large w-full">
              Confirmar Reserva
            </button>
          </div>
        </form>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content slide-in">
            <h2>Confirmar Reserva?</h2>
            <p className="modal-subtitle">Por favor, revise os dados antes de finalizar.</p>
            
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
                <span>Valor Total:</span>
                <strong className="price-highlight">R$ {totalPrice.toFixed(2)}</strong>
              </div>
            </div>

            <div className="modal-people">
              <h4 style={{ marginBottom: '0.5rem' }}>Lista de Hóspedes ({1 + companions.length}):</h4>
              <ul style={{ listStyle: 'none' }}>
                <li>👤 {formData.fullName} (Titular, {formData.age} anos)</li>
                {companions.map(c => (
                  <li key={c.id}>👥 {c.name} ({c.age} anos)</li>
                ))}
              </ul>
            </div>

            <div className="modal-actions action-buttons">
               <button className="btn btn-secondary flex-1" onClick={() => setShowModal(false)}>
                 Voltar para Editar
               </button>
               <button className="btn btn-primary flex-1" onClick={confirmBooking}>
                 Sim, Confirmar!
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
