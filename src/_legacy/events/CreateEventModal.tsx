import { X } from 'lucide-react';
import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface CreateEventModalProps {
  onClose: () => void;
  onCreate: (event: {
    id: string;
    name: string;
    client: string;
    date: string;
    status: 'Approved' | 'Pending' | 'Rejected';
  }) => void;
}

export default function CreateEventModal({
  onClose,
  onCreate
}: CreateEventModalProps) {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'Approved' | 'Pending' | 'Rejected'>(
    'Pending'
  );

  const submit = () => {
    if (!name || !client || !date) return;

    onCreate({
      id: crypto.randomUUID(),
      name,
      client,
      date,
      status
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Create Event
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Corporate Summit 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <input
              value={client}
              onChange={e => setClient(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Tech Corp"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'Pending' | 'Approved' | 'Rejected')}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>
            Create Event
          </Button>
        </div>
      </Card>
    </div>
  );
}
