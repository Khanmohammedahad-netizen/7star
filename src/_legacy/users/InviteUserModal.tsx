import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { supabase } from '../../services/supabase';

export default function InviteUserModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState<'UAE' | 'SAUDI'>('UAE');
  const [loading, setLoading] = useState(false);

  const invite = async () => {
    setLoading(true);

    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { region }
    });

    if (!error) onClose();
    setLoading(false);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Invite User"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={invite} disabled={loading}>
            Send Invite
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <input
          className="w-full border px-3 py-2 rounded"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <select
          className="w-full border px-3 py-2 rounded"
          value={region}
          onChange={e => setRegion(e.target.value as 'UAE' | 'SAUDI')}
        >
          <option value="UAE">UAE</option>
          <option value="SAUDI">Saudi Arabia</option>
        </select>
      </div>
    </Modal>
  );
}
