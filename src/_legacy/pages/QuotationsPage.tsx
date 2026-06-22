import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getQuotations, createQuotation } from '../services/quotationService';
import { getClients } from '../services/clientService';
import { getEvents } from '../services/eventService';
import { Quotation } from '../types/quotation';
import { Client, Event } from '../types/event';
import { generatePdfFromHtml } from '../utils/pdfGenerator';
import { useAuth } from '../contexts/AuthContext';

export function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const { profile } = useAuth();
  const [newQuotation, setNewQuotation] = useState({
    client_id: '',
    event_id: '',
    total_amount: 0,
    status: 'draft',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quotationsData, clientsData, eventsData] = await Promise.all([
          getQuotations(),
          getClients(),
          getEvents(),
        ]);
        setQuotations(quotationsData);
        setClients(clientsData);
        setEvents(eventsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewQuotation((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateQuotation = async () => {
    try {
      await createQuotation(newQuotation);
      const quotationsData = await getQuotations();
      setQuotations(quotationsData);
      setCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create quotation:', error);
    }
  };

  const handleDownloadPdf = async (quotation: Quotation) => {
    const data = {
      CLIENT_NAME: quotation.client_name,
      ELEMENT: quotation.event_title,
      QUOTATION_DATE: new Date(quotation.created_at).toLocaleDateString(),
      QUOTATION_NO: quotation.id.substring(0, 8),
      QUOTATION_ROWS: `<tr><td>1</td><td>${quotation.event_title}</td><td></td><td>1</td><td>${quotation.total_amount}</td><td>${quotation.total_amount}</td></tr>`,
      NET_AMOUNT: quotation.total_amount.toString(),
      VAT: (quotation.total_amount * 0.05).toString(),
      TOTAL: (quotation.total_amount * 1.05).toString(),
    };
    const pdf = await generatePdfFromHtml('/quotation.html', data);
    pdf.save(`quotation-${quotation.id}.pdf`);
  };

  if (isLoading) {
    return <div>Loading quotations...</div>;
  }

  const canCreateQuotation = profile?.role === 'admin' || profile?.role === 'accountant';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Quotations</h1>
        {canCreateQuotation && (
          <button onClick={() => setCreateModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
            <Plus className="w-5 h-5" />
            <span>Create Quotation</span>
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        {quotations.map((q) => (
          <div key={q.id} className="p-4 border rounded-lg flex items-center justify-between">
            <p>{q.event_title} for {q.client_name} - ${q.total_amount}</p>
            <button
              onClick={() => handleDownloadPdf(q)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Download PDF
            </button>
          </div>
        ))}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">Create New Quotation</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateQuotation(); }}>
              <select name="client_id" onChange={handleInputChange}>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select name="event_id" onChange={handleInputChange}>
                {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
              <input type="number" name="total_amount" onChange={handleInputChange} />
              <button type="submit">Save</button>
              <button type="button" onClick={() => setCreateModalOpen(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
