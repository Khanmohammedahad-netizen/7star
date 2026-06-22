import { useState, useEffect } from 'react';
import { Package, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Material, Event } from '../types/database';

type MaterialWithEvent = Material & { event?: Event };

export function MaterialsManagement() {
  const [materials, setMaterials] = useState<MaterialWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('materials')
      .select(`
        *,
        event:events(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching materials:', error);
    } else {
      setMaterials(data || []);
    }
    setLoading(false);
  };

  const filteredMaterials = materials.filter(
    (material) =>
      material.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.event?.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCost = filteredMaterials.reduce((sum, m) => sum + Number(m.total_cost), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading materials...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">All Materials</h2>
            <p className="text-slate-600 mt-1">Track materials across all events</p>
          </div>
          <div className="bg-blue-50 px-6 py-3 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Total Material Cost</div>
            <div className="text-2xl font-bold text-blue-900">
              ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search materials, suppliers, or events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none"
          />
        </div>

        {filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-slate-500">
              {searchTerm ? 'No materials found matching your search' : 'No materials recorded yet'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Material</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Event</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Quantity</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Unit Cost</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Total Cost</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Supplier</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Date Added</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((material) => (
                  <tr key={material.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{material.material_name}</div>
                      {material.notes && <div className="text-sm text-slate-500">{material.notes}</div>}
                    </td>
                    <td className="py-3 px-4">
                      {material.event && (
                        <div>
                          <div className="font-medium text-slate-900">{material.event.title}</div>
                          <div className="text-sm text-slate-500">{material.event.region.toUpperCase()}</div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {material.quantity} {material.unit}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      ${Number(material.unit_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      ${Number(material.total_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{material.supplier || '-'}</td>
                    <td className="py-3 px-4 text-slate-600 text-sm">
                      {new Date(material.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
