import React, { useState, useEffect } from 'react';
import api from '../api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const ExpensesHub = () => {
  const [data, setData] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    assetId: '',
    title: '',
    category: 'repair',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    vendor: '',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, assetRes] = await Promise.all([
        api.get('/expenses/summary'),
        api.get('/assets')
      ]);
      setData(expRes.data);
      setAssets(assetRes.data);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', expenseForm);
      setShowAddModal(false);
      setExpenseForm({
        assetId: '',
        title: '',
        category: 'repair',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        vendor: '',
        notes: ''
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record expense');
    }
  };

  // Category Doughnut Chart Data
  const categoryLabels = Object.keys(data?.categoryBreakdown || {});
  const categoryValues = Object.values(data?.categoryBreakdown || {});

  const doughnutData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryValues,
        backgroundColor: [
          '#00f2fe',
          '#8b5cf6',
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ec4899',
          '#64748b'
        ],
        borderWidth: 0
      }
    ]
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Expense & TCO Analytics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Total Cost of Ownership (TCO), repair economics, and Buy vs Repair recommendation engine
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          + Record Custom Expense
        </button>
      </div>

      {/* KPI Overview Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Asset Value
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            ₹{data?.overview?.totalAssetValue?.toLocaleString() || '0'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '4px' }}>
            Original purchase valuation
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Cost of Ownership (TCO)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#00f2fe', marginTop: '4px' }}>
            ₹{data?.overview?.totalTCO?.toLocaleString() || '0'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Purchase + Lifetime Repairs + AMC
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Maintenance & Repairs
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            ₹{((data?.overview?.totalServiceAndRepairCost || 0) + (data?.overview?.totalCustomExpenses || 0)).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Cumulative service charges
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Contracts & Insurances
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#8b5cf6', marginTop: '4px' }}>
            ₹{((data?.overview?.totalInsuranceCost || 0) + (data?.overview?.totalAMCCost || 0)).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Active policy protection
          </div>
        </div>
      </div>

      {/* Analytics Charts & Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Category Breakdown Doughnut */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Category Spending Distribution</h3>
          {categoryValues.length > 0 ? (
            <div style={{ maxHeight: '260px', display: 'flex', justifyContent: 'center' }}>
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
                }}
              />
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No spending data recorded.</p>
          )}
        </div>

        {/* Buy vs Repair Advisor Banner */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.6rem' }}>🧠</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>AI Buy vs. Repair Decision Engine</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '16px' }}>
            Our financial algorithm continuously benchmarks lifetime repair costs against current replacement prices. When maintenance exceeds <strong>45% of asset value</strong>, replacement is recommended.
          </p>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '14px',
            fontSize: '0.84rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>High Risk Assets (40%+ TCO):</span>
              <strong style={{ color: '#ef4444' }}>
                {data?.assetTCOList?.filter(a => parseFloat(a.maintenanceRatio) >= 40).length || 0}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Healthy Assets (&lt;20% TCO):</span>
              <strong style={{ color: '#10b981' }}>
                {data?.assetTCOList?.filter(a => parseFloat(a.maintenanceRatio) < 20).length || 0}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Asset TCO Table & Recommendations */}
      <div className="glass-panel">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Asset Cost of Ownership & Economic Guidance</h3>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Calculating TCO metrics...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Category</th>
                  <th>Purchase Price</th>
                  <th>Maintenance Spent</th>
                  <th>Total TCO</th>
                  <th>Repair Ratio</th>
                  <th>Economic Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {data?.assetTCOList?.map(item => {
                  const ratio = parseFloat(item.maintenanceRatio);
                  const isHigh = ratio >= 40;
                  const isMedium = ratio >= 20;

                  return (
                    <tr key={item.assetId}>
                      <td>
                        <strong>{item.brand} {item.assetName}</strong>
                      </td>
                      <td>{item.category}</td>
                      <td>₹{item.purchasePrice.toLocaleString()}</td>
                      <td style={{ color: isHigh ? '#ef4444' : isMedium ? '#f59e0b' : '#10b981' }}>
                        ₹{item.maintenanceCost.toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 700, color: '#00f2fe' }}>
                        ₹{item.totalTCO.toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${isHigh ? 'badge-expired' : isMedium ? 'badge-expiring' : 'badge-active'}`}>
                          {item.maintenanceRatio}%
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.84rem', color: isHigh ? '#f87171' : isMedium ? '#fbbf24' : '#34d399' }}>
                          {item.recommendation}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {item.recommendationReason}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Custom Expense Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Log Asset Expense / Upkeep Cost</h3>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Select Asset *</label>
                <select
                  required
                  value={expenseForm.assetId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, assetId: e.target.value })}
                  className="form-select"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => (
                    <option key={a._id} value={a._id}>{a.brand} {a.assetName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spare motor replacement / AMC Renewal"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="repair">Repair</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="warranty_extension">Warranty Extension</option>
                    <option value="insurance">Insurance Premium</option>
                    <option value="accessory">Accessory</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2500"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Vendor / Service Center</label>
                <input
                  type="text"
                  placeholder="e.g. Urban Company / LG Service"
                  value={expenseForm.vendor}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesHub;
