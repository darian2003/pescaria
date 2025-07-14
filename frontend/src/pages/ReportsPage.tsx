import { useEffect, useState } from 'react';

interface StaffStat {
  staff_id: number;
  username: string;
  count: number;
}

interface Report {
  id?: number;
  report_date: string;
  total_rented_hotel: number;
  total_rented_beach: number;
  total_earnings: number;
  generated_at?: string;
  staff_stats: StaffStat[];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long',
    timeZone: 'Europe/Bucharest',
  });
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [deleteId, setDeleteId] = useState<number|null>(null);

  const fetchReports = () => {
    fetch('http://localhost:3001/umbrellas/reports', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // Sort descending by generated_at
        setReports(data.sort((a: Report, b: Report) => new Date(b.generated_at || b.report_date).getTime() - new Date(a.generated_at || a.report_date).getTime()));
      });
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id: number) => {
    await fetch(`http://localhost:3001/umbrellas/reports/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    setDeleteId(null);
    fetchReports();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Rapoarte Zilnice</h1>
      {reports.length === 0 ? (
        <div>Nu există rapoarte.</div>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => (
            <div key={report.id} className="border rounded p-4 bg-white shadow relative">
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-bold"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
                onClick={() => setDeleteId(report.id || 0)}
                title="Șterge raportul"
              >
                Șterge
              </button>
              <div className="font-semibold">Data raport: {formatDate(report.generated_at || report.report_date)}</div>
              <div>Total închirieri plajă: {report.total_rented_beach}</div>
              <div>Total închirieri hotel: {report.total_rented_hotel}</div>
              <div>Total încasări: {report.total_earnings} lei</div>
              <div className="mt-2">
                <div className="font-semibold">Statistici staff:</div>
                <ul className="list-disc ml-6">
                  {report.staff_stats.map((s) => (
                    <li key={s.staff_id}>{s.username}: {s.count} paturi date</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded shadow-md w-96 text-center">
            <h2 className="text-xl font-bold mb-4 text-red-600">Confirmare ștergere</h2>
            <p className="mb-4">Sigur doriți să ștergeți acest raport?</p>
            <div className="flex gap-4 justify-center">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setDeleteId(null)}
              >
                Renunță
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={() => handleDelete(deleteId)}
              >
                Șterge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 