import { useParams } from 'react-router-dom';

export function ClientDetailPage() {
  const { id } = useParams();

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Client Detail</h1>
      <p className="text-slate-600 mt-1">Client ID: {id}</p>
    </div>
  );
}
