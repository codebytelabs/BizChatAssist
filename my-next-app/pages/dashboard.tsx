import { useEffect, useState } from 'react';
import Head from 'next/head';
import axios from 'axios';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  created_at: string;
  customer_phone?: string;
  customer_email?: string;
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        // Replace with your real API endpoint or Supabase call
        const res = await axios.get('/api/transactions');
        setTransactions(res.data.transactions);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  // Analytics
  const filteredTxns = transactions.filter(txn =>
    (statusFilter === 'all' || txn.status === statusFilter) &&
    (search === '' || (txn.customer_phone?.includes(search) || txn.customer_email?.includes(search)))
  );
  const totalAmount = filteredTxns.reduce((sum, txn) => sum + txn.amount, 0);
  const totalCount = filteredTxns.length;
  const successCount = filteredTxns.filter(txn => txn.status === 'success').length;
  const failedCount = filteredTxns.filter(txn => txn.status === 'failed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>BizChatAssist Dashboard</title>
      </Head>
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">Business Dashboard</h1>
        {/* Analytics summary */}
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded shadow p-4 text-center">
            <div className="text-sm text-gray-500">Total Transactions</div>
            <div className="text-xl font-bold">{totalCount}</div>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <div className="text-sm text-gray-500">Total Amount</div>
            <div className="text-xl font-bold">{(totalAmount / 100).toFixed(2)}</div>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <div className="text-sm text-gray-500">Success</div>
            <div className="text-xl font-bold text-green-600">{successCount}</div>
          </div>
          <div className="bg-white rounded shadow p-4 text-center">
            <div className="text-sm text-gray-500">Failed</div>
            <div className="text-xl font-bold text-red-600">{failedCount}</div>
          </div>
        </div>
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <select
            className="border rounded px-2 py-1 text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="Search phone/email"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Currency</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTxns.map((txn) => (
                  <tr key={txn.id}>
                    <td className="px-4 py-2 text-xs">{txn.id}</td>
                    <td className="px-4 py-2 text-xs">{(txn.amount / 100).toFixed(2)}</td>
                    <td className="px-4 py-2 text-xs">{txn.currency.toUpperCase()}</td>
                    <td className="px-4 py-2 text-xs font-semibold text-blue-700">{txn.status}</td>
                    <td className="px-4 py-2 text-xs">{txn.provider}</td>
                    <td className="px-4 py-2 text-xs">{new Date(txn.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2 text-xs">{txn.customer_phone || txn.customer_email || '-'}</td>
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
