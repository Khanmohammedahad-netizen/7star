import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AddMaterialModalProps {
  eventId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMaterialModal({ eventId, onClose, onSuccess }: AddMaterialModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    material_name: '',
    quantity: '',
    unit: '',
    unit_cost: '',
    supplier: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('materials').insert([
        {
          event_id: eventId,
          material_name: formData.material_name,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          unit_cost: parseFloat(formData.unit_cost),
          supplier: formData.supplier || null,
          notes: formData.notes || null,
        },
      ]);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error adding material:', error);
      alert('Failed to add material. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Add Material</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Material Name *
            </label>
            <input
              type="text"
              required
              value={formData.material_name}
              onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              placeholder="e.g., Steel Beams, Concrete, Paint"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Unit *
              </label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
                placeholder="e.g., kg, m², pcs"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Unit Cost ($) *
            </label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={formData.unit_cost}
              onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
            />
          </div>

          {formData.quantity && formData.unit_cost && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="text-sm text-slate-600 mb-1">Total Cost</div>
              <div className="text-2xl font-bold text-slate-900">
                ${(parseFloat(formData.quantity) * parseFloat(formData.unit_cost)).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Supplier
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
