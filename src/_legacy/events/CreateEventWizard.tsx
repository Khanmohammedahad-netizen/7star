import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { logAudit } from '../../utils/audit';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateEventWizard({ onClose, onCreated }: Props) {
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEvent = async () => {
    if (!user) {
      setError('You must be logged in to create events');
      return;
    }

    if (!name || !client || !date) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try with event_date first, fallback to date if that column doesn't exist
      let insertData: any = {
        name,
        client,
        region: user.region,
        status: 'Pending'
      };

      // Try event_date first (most common)
      insertData.event_date = date;

      const { data, error: insertError } = await supabase
        .from('events')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('Event creation error:', insertError);
        
        // If it's a column error, try with 'date' instead of 'event_date'
        if (insertError.message?.includes('column') && insertError.message?.includes('event_date')) {
          console.log('Trying with "date" column instead...');
          const { data: retryData, error: retryError } = await supabase
            .from('events')
            .insert({
              name,
              client,
              date: date, // Try 'date' column
              region: user.region,
              status: 'Pending'
            })
            .select()
            .single();

          if (retryError) {
            // Both failed, show error
            let errorMessage = retryError.message || 'Failed to create event. Please try again.';
            
            if (retryError.message?.includes('permission denied') || retryError.message?.includes('policy')) {
              errorMessage = 'Permission denied. Please check your database RLS policies. See SUPABASE_RLS_FIX.md for help.';
            } else if (retryError.message?.includes('column') || retryError.message?.includes('schema')) {
              errorMessage = `Database error: ${retryError.message}. Please check your table schema.`;
            }
            
            setError(errorMessage);
            setLoading(false);
            return;
          } else {
            // Retry succeeded with 'date' column
            if (retryData) {
              try {
                await logAudit(
                  'event_created',
                  `Event "${name}" created`,
                  user,
                  retryData.id,
                  user.region
                );
              } catch (auditError) {
                console.error('Audit log error:', auditError);
              }
            }
            setLoading(false);
            onCreated();
            onClose();
            return;
          }
        }
        
        // Original error handling
        let errorMessage = insertError.message || 'Failed to create event. Please try again.';
        
        if (insertError.message?.includes('permission denied') || insertError.message?.includes('policy')) {
          errorMessage = 'Permission denied. Please check your database RLS policies. See SUPABASE_RLS_FIX.md for help.';
        } else if (insertError.message?.includes('column') || insertError.message?.includes('schema')) {
          errorMessage = `Database error: ${insertError.message}. Please check your table schema.`;
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (data) {
        try {
          await logAudit(
            'event_created',
            `Event "${name}" created`,
            user,
            data.id,
            user.region
          );
        } catch (auditError) {
          // Don't fail if audit logging fails
          console.error('Audit log error:', auditError);
        }
      }

      setLoading(false);
      onCreated();
      onClose();
    } catch (err) {
      console.error('Unexpected error creating event:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Create New Event"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={createEvent} disabled={loading || !user}>
            {loading ? 'Creating...' : 'Create Event'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Event name"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={loading}
        />

        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Client"
          value={client}
          onChange={e => setClient(e.target.value)}
          disabled={loading}
        />

        <input
          type="date"
          className="w-full border rounded px-3 py-2"
          value={date}
          onChange={e => setDate(e.target.value)}
          disabled={loading}
        />

        <div className="text-sm text-gray-500">
          Region automatically set to <b>{user?.region}</b>
        </div>
      </div>
    </Modal>
  );
}
