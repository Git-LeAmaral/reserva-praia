import { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Calendar } from '../Calendar/Calendar';
import { BookingForm } from '../BookingForm/BookingForm';
import { EditBookingForm } from '../BookingForm/EditBookingForm';
import Swal from 'sweetalert2';
import './Dashboard.css';

export interface CompanionInfo {
  name: string;
  cpf: string;
  age: string;
}

export interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  titularName: string;
  titularCpf?: string;
  titularAge?: string;
  titularPhone?: string;
  titularEmail?: string;
  companions?: CompanionInfo[];
  totalDays: number;
  totalPrice: number;
  dailyRate?: number;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const Dashboard: React.FC = () => {
  const [view, setView] = useState<'home' | 'calendar' | 'form' | 'editing'>('home');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Add view state for month navigator and details modal
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('reserva-praia-bookings');
    if (saved) {
      setBookings(JSON.parse(saved));
    }
  }, []);

  const handleDateSelection = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    setView('form');
  };

  const saveBooking = (newBooking: Booking) => {
    const updated = [...bookings, newBooking];
    setBookings(updated);
    localStorage.setItem('reserva-praia-bookings', JSON.stringify(updated));
  };

  const handleFinish = () => {
    setStartDate(null);
    setEndDate(null);
    setView('home');
  };

  const handleDeleteBooking = (id: string) => {
    Swal.fire({
      icon: 'warning',
      title: 'Excluir Reserva?',
      text: 'Esta ação não pode ser desfeita. As datas serão liberadas no calendário.',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: 'var(--border-color)',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
      width: '380px',
      padding: '1.5rem',
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = bookings.filter(b => b.id !== id);
        setBookings(updated);
        localStorage.setItem('reserva-praia-bookings', JSON.stringify(updated));
        setSelectedBooking(null);
        Swal.fire({
          icon: 'success',
          title: 'Reserva excluída!',
          timer: 1500,
          showConfirmButton: false,
          width: '350px',
          padding: '1.5rem',
        });
      }
    });
  };

  const handleUpdateBooking = (updated: Booking) => {
    const updatedList = bookings.map(b => b.id === updated.id ? updated : b);
    setBookings(updatedList);
    localStorage.setItem('reserva-praia-bookings', JSON.stringify(updatedList));
    setEditingBooking(null);
    setView('home');
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setSelectedBooking(null);
    setView('editing');
  };

  // Month navigation logic
  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Filtering bookings logic
  // Returns true if ANY part of the booking ([startDate, endDate]) falls within the current viewDate month/year
  const filteredBookings = bookings.filter((b) => {
    const bStart = new Date(b.startDate);
    const bEnd = new Date(b.endDate);
    
    const vYear = viewDate.getFullYear();
    const vMonth = viewDate.getMonth();
    
    const viewStart = new Date(vYear, vMonth, 1);
    const viewEnd = new Date(vYear, vMonth + 1, 0, 23, 59, 59);

    // B intercepts View if (B_start <= V_end) AND (B_end >= V_start)
    return bStart <= viewEnd && bEnd >= viewStart;
  });

  // Sort them so the closest ones appear first
  filteredBookings.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Aggregate financial data for the chart
  const calculateChartData = () => {
    const data = [];
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const DAILY_RATE = 300;

    for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), i);
        let dayRevenue = 0;

        filteredBookings.forEach(b => {
            const bStart = new Date(b.startDate);
            const bEnd = new Date(b.endDate);
            // Reset time part for accurate date comparison
            bStart.setHours(0,0,0,0);
            bEnd.setHours(0,0,0,0);
            
            if (currentDate >= bStart && currentDate <= bEnd) {
                dayRevenue += DAILY_RATE;
            }
        });

        if (dayRevenue > 0) {
            data.push({
                dia: `${i}`,
                valor: dayRevenue
            });
        }
    }
    return data;
  };

  const chartData = calculateChartData();
  const totalMonthRevenue = chartData.reduce((acc, curr) => acc + curr.valor, 0);

  return (
    <div className="dashboard-layout">
      {view === 'home' && (
        <div className="home-view fade-in">
          <div className="dashboard-header flex-between mb-2">
            <div>
              <h2>Agendamentos</h2>
              <p>Gerencie as reservas da casa de praia.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setView('calendar')}>
              + Nova Reserva
            </button>
          </div>

          <div className="month-navigator">
            <button className="nav-btn" onClick={prevMonth}>&lt;</button>
            <h3 className="month-title">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</h3>
            <button className="nav-btn" onClick={nextMonth}>&gt;</button>
          </div>

          <div className="dashboard-grid">
             {/* Financial Chart Card */}
             <div className="dashboard-card financial-card">
                 <div className="card-header">
                     <h3>Resumo Financeiro</h3>
                     <span className="revenue-total">
                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMonthRevenue)}
                     </span>
                 </div>
                 
                 <div className="chart-container">
                     {chartData.length > 0 ? (
                         <ResponsiveContainer width="100%" height={250}>
                             <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                 <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                                 <XAxis dataKey="dia" tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                                 <YAxis tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value}`} />
                                 <Tooltip 
                                    cursor={{fill: 'var(--border-color)', opacity: 0.4}}
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                    formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Ganhos']}
                                    labelFormatter={(label) => `Dia ${label}`}
                                 />
                                 <Bar dataKey="valor" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                             </BarChart>
                         </ResponsiveContainer>
                     ) : (
                         <div className="empty-chart">
                            <p>Sem rendimentos registrados neste mês.</p>
                         </div>
                     )}
                 </div>
             </div>

             {/* Bookings List */}
             <div className="dashboard-card bookings-card">
                <div className="card-header">
                     <h3>Reservas do Mês ({filteredBookings.length})</h3>
                </div>

                <div className="bookings-list mt-4">
                  {filteredBookings.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📅</div>
                      <p>Nenhum agendamento para <strong>{MONTHS[viewDate.getMonth()]}</strong>.</p>
                      {bookings.length === 0 && (
                        <button className="btn btn-outline mt-4" onClick={() => setView('calendar')}>
                          Fazer primeira reserva
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredBookings.map((b) => (
                      <div key={b.id} className="booking-card slide-in" onClick={() => setSelectedBooking(b)} style={{ cursor: 'pointer' }}>
                        <div className="booking-details">
                          <h3 className="titular-name">{b.titularName}</h3>
                          <div className="booking-date-range">
                            <span>{new Date(b.startDate).toLocaleDateString('pt-BR')}</span>
                            <span className="separator">até</span>
                            <span>{new Date(b.endDate).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)', marginTop: '0.25rem', display: 'inline-block' }}>Ver detalhes &rarr;</span>
                        </div>
                        <div className="booking-price-info">
                          <span className="days-badge">{b.totalDays} {b.totalDays === 1 ? 'diária' : 'diárias'}</span>
                          <strong className="total-price">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(b.totalPrice)}
                          </strong>
                        </div>
                      </div>
                    ))
                  )}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content slide-in" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-2">
               <h2 style={{ margin: 0 }}>Detalhes da Reserva</h2>
               <button className="remove-btn" onClick={() => setSelectedBooking(null)} style={{ padding: '0.5rem' }}>✕</button>
            </div>
            
            <div className="modal-summary">
              <div className="summary-row">
                <span>Período:</span>
                <strong>{new Date(selectedBooking.startDate).toLocaleDateString('pt-BR')} - {new Date(selectedBooking.endDate).toLocaleDateString('pt-BR')}</strong>
              </div>
              <div className="summary-row">
                <span>Diárias:</span>
                <strong>{selectedBooking.totalDays}</strong>
              </div>
              <div className="summary-row">
                <span>Valor Total:</span>
                <strong className="price-highlight">R$ {selectedBooking.totalPrice.toFixed(2)}</strong>
              </div>
            </div>

            <div className="modal-people">
               <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Lista de Hóspedes</h3>
               <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ display: 'block', color: 'var(--text-primary)' }}>👤 Titular: {selectedBooking.titularName}</strong>
                  <ul style={{ listStyle: 'none', paddingLeft: '1.5rem', marginTop: '0.25rem' }}>
                     <li>Idade: {selectedBooking.titularAge || 'Não informada'} | CPF: {selectedBooking.titularCpf || 'Não informado'}</li>
                     <li>Contato: {selectedBooking.titularPhone || 'N/A'} | {selectedBooking.titularEmail || 'N/A'}</li>
                  </ul>
               </div>

               {selectedBooking.companions && selectedBooking.companions.length > 0 && (
                 <div>
                    <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>👥 Acompanhantes ({selectedBooking.companions.length}):</strong>
                    <ul style={{ listStyle: 'none', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedBooking.companions.map((c, i) => (
                        <li key={i} style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '0.75rem' }}>
                           <span style={{ fontWeight: 600 }}>{c.name}</span><br />
                           <span style={{ fontSize: '0.85rem' }}>Idade: {c.age || 'N/A'} | CPF: {c.cpf || 'N/A'}</span>
                        </li>
                      ))}
                    </ul>
                 </div>
               )}
            </div>

            <div className="modal-actions action-buttons">
               <button className="btn btn-outline flex-1" onClick={() => setSelectedBooking(null)}>
                 Fechar
               </button>
               <button className="btn btn-secondary flex-1" onClick={() => handleEditBooking(selectedBooking)}>
                 ✏️ Editar
               </button>
               <button className="btn btn-danger flex-1" onClick={() => handleDeleteBooking(selectedBooking.id)}>
                 🗑️ Excluir
               </button>
            </div>
          </div>
        </div>
      )}

      {view === 'calendar' && (
        <div className="calendar-section fade-in">
          <button className="back-btn" onClick={() => setView('home')}>
            &larr; Voltar
          </button>
          <div className="dashboard-header">
            <h2>Selecionar Datas</h2>
            <p>Escolha a data de entrada e de saída (Diária R$ 300,00).</p>
          </div>
          <Calendar bookings={bookings} onDateSelection={handleDateSelection} />
        </div>
      )}

      {view === 'form' && startDate && endDate && (
        <div className="booking-section slide-in">
          <button className="back-btn" onClick={() => setView('calendar')}>
            &larr; Voltar ao Calendário
          </button>
          <BookingForm 
            startDate={startDate} 
            endDate={endDate} 
            onSave={saveBooking} 
            onFinish={handleFinish} 
          />
        </div>
      )}

      {view === 'editing' && editingBooking && (
        <div className="booking-section slide-in">
          <button className="back-btn" onClick={() => { setView('home'); setEditingBooking(null); }}>
            &larr; Voltar
          </button>
          <EditBookingForm
            booking={editingBooking}
            allBookings={bookings}
            onUpdate={handleUpdateBooking}
            onCancel={() => { setView('home'); setEditingBooking(null); }}
          />
        </div>
      )}
    </div>
  );
};
