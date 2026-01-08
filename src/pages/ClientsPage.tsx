import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getClients, createClient } from '../services/clientService';
import { Client } from '../types/event';
import { useAuth } from '../contexts/AuthContext';

export function ClientsPage() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    representative_name: '',
    phone_number: '',
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientsData = await getClients();
        setClients(clientsData);
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewClient((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateClient = async () => {
    try {
      const createdClient = await createClient(newClient);
      setClients((prevClients) => [...prevClients, createdClient]);
      setCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create client:', error);
    }
  };

  const canCreateClient = profile?.role === 'admin' || profile?.role === 'senior_manager' || profile?.role === 'manager';

  if (isLoading) {
    return <div>Loading clients...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-600 mt-1">Manage all client information.</p>
        </div>
        {canCreateClient && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Client</span>
          </button>
        )}
      </div>

      {/* Clients List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="space-y-4">
          {clients.map((client) => (
            <Link to={`/clients/${client.id}`} key={client.id} className="block p-4 border rounded-lg hover:bg-slate-50">
              <p className="font-semibold text-slate-800">{client.name}</p>
              <p className="text-sm text-slate-500">{client.representative_name} | {client.phone_number}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Create Client Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">Create New Client</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateClient(); }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">Client Name</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={newClient.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label htmlFor="representative_name" className="block text-sm font-medium text-slate-700">Representative Name</label>
                  <input
                    type="text"
                    name="representative_name"
                    id="representative_name"
                    value={newClient.representative_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    name="phone_number"
                    id="phone_number"
                    value={newClient.phone_number}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
