import { useEffect, useMemo, useState } from 'react';
import {
  createVehicle,
  deleteVehicle,
  getHealth,
  listVehicles,
  updateVehicle,
} from './api/vehicles';

const EMPTY_FORM = {
  vehicleNumber: '',
  ownerName: '',
  vehicleType: 'CAR',
  model: '',
  color: '',
  registrationDate: new Date().toISOString().slice(0, 10),
  contactNumber: '',
  parkingSlot: '',
};

const VEHICLE_TYPES = ['CAR', 'BIKE', 'TRUCK', 'BUS', 'VAN', 'OTHER'];

function normalizeForm(vehicle) {
  return {
    vehicleNumber: vehicle?.vehicleNumber || '',
    ownerName: vehicle?.ownerName || '',
    vehicleType: vehicle?.vehicleType || 'CAR',
    model: vehicle?.model || '',
    color: vehicle?.color || '',
    registrationDate: vehicle?.registrationDate ? String(vehicle.registrationDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
    contactNumber: vehicle?.contactNumber || '',
    parkingSlot: vehicle?.parkingSlot || '',
  };
}

function prettyDate(value) {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function VehicleForm({ form, setForm, onSubmit, submitting, editingId, onCancel }) {
  return (
    <section className="card form-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{editingId ? 'Edit vehicle' : 'Register vehicle'}</p>
          <h2>{editingId ? 'Update the parked vehicle record' : 'Add a new vehicle to the system'}</h2>
        </div>
        {editingId ? <span className="badge badge-warm">Editing</span> : <span className="badge">New record</span>}
      </div>

      <form className="vehicle-form" onSubmit={onSubmit}>
        <label>
          <span>Vehicle number</span>
          <input value={form.vehicleNumber} onChange={(event) => setForm({ ...form, vehicleNumber: event.target.value })} placeholder="MH12AB1234" required />
        </label>

        <label>
          <span>Owner name</span>
          <input value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} placeholder="Rahul Sharma" required />
        </label>

        <label>
          <span>Vehicle type</span>
          <select value={form.vehicleType} onChange={(event) => setForm({ ...form, vehicleType: event.target.value })}>
            {VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Model</span>
          <input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} placeholder="Hyundai i20" required />
        </label>

        <label>
          <span>Color</span>
          <input value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} placeholder="White" required />
        </label>

        <label>
          <span>Registration date</span>
          <input type="date" value={form.registrationDate} onChange={(event) => setForm({ ...form, registrationDate: event.target.value })} />
        </label>

        <label>
          <span>Contact number</span>
          <input value={form.contactNumber} onChange={(event) => setForm({ ...form, contactNumber: event.target.value })} placeholder="+91 9876543210" required />
        </label>

        <label>
          <span>Parking slot</span>
          <input value={form.parkingSlot} onChange={(event) => setForm({ ...form, parkingSlot: event.target.value })} placeholder="A-12" />
        </label>

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : editingId ? 'Update vehicle' : 'Create vehicle'}
          </button>
          {editingId ? (
            <button className="secondary-button" type="button" onClick={onCancel}>
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function VehicleTable({ vehicles, onEdit, onDelete, loading }) {
  return (
    <section className="card table-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Fleet list</p>
          <h2>Registered vehicles</h2>
        </div>
        <span className="badge">{vehicles.length} on page</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Number</th>
              <th>Owner</th>
              <th>Type</th>
              <th>Model</th>
              <th>Slot</th>
              <th>Registered</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="table-state">
                  Loading vehicles...
                </td>
              </tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan="7" className="table-state">
                  No vehicles match the current filters.
                </td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle._id}>
                  <td>
                    <strong>{vehicle.vehicleNumber}</strong>
                  </td>
                  <td>{vehicle.ownerName}</td>
                  <td>{vehicle.vehicleType}</td>
                  <td>{vehicle.model}</td>
                  <td>{vehicle.parkingSlot || '—'}</td>
                  <td>{prettyDate(vehicle.registrationDate)}</td>
                  <td className="row-actions">
                    <button type="button" onClick={() => onEdit(vehicle)}>
                      Edit
                    </button>
                    <button type="button" className="danger-link" onClick={() => onDelete(vehicle)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [health, setHealth] = useState('Checking backend...');
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });
  const [liveTime, setLiveTime] = useState(() => new Date());

  const stats = useMemo(() => {
    const typeCounts = vehicles.reduce((accumulator, vehicle) => {
      accumulator[vehicle.vehicleType] = (accumulator[vehicle.vehicleType] || 0) + 1;
      return accumulator;
    }, {});

    return [
      { label: 'Vehicles on page', value: vehicles.length },
      { label: 'Total records', value: meta.total },
      { label: 'Pages', value: meta.totalPages },
      { label: 'Top type', value: Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A' },
    ];
  }, [vehicles, meta]);

  useEffect(() => {
    let active = true;

    getHealth()
      .then((response) => {
        if (active) {
          setHealth(response.message);
        }
      })
      .catch((healthError) => {
        if (active) {
          setHealth(healthError.message);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    listVehicles({ page, limit: 10, search, vehicleType })
      .then((response) => {
        if (!active) {
          return;
        }

        setVehicles(response.data || []);
        setMeta(response.meta || { total: 0, totalPages: 1, limit: 10 });
      })
      .catch((fetchError) => {
        if (active) {
          setError(fetchError.message);
          setVehicles([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [page, search, vehicleType]);

  async function refreshAfterMutation(nextPage = page) {
    const response = await listVehicles({ page: nextPage, limit: 10, search, vehicleType });
    setVehicles(response.data || []);
    setMeta(response.meta || { total: 0, totalPages: 1, limit: 10 });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      ...form,
      parkingSlot: form.parkingSlot.trim() || null,
    };

    try {
      if (editingId) {
        await updateVehicle(editingId, payload);
      } else {
        await createVehicle(payload);
      }

      setForm(EMPTY_FORM);
      setEditingId('');
      setPage(1);
      await refreshAfterMutation(1);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(vehicle) {
    setEditingId(vehicle._id);
    setForm(normalizeForm(vehicle));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setEditingId('');
    setForm(EMPTY_FORM);
  }

  async function handleDelete(vehicle) {
    const confirmed = window.confirm(`Delete ${vehicle.vehicleNumber}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setError('');
    try {
      await deleteVehicle(vehicle._id);
      await refreshAfterMutation(page);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="motion-beam motion-beam-one" />
      <div className="motion-beam motion-beam-two" />

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Vehicle parking system</p>
          <h1>Manage vehicle registrations from one focused dashboard.</h1>
          <p className="hero-text">
            Built for the backend at localhost:5000, this frontend gives you create, edit, search, filter, and delete flows for parking records with a clean operational view.
          </p>
          <div className="hero-meta">
            <span className="status-pill">
              <span className="live-dot" />
              Backend: {health}
            </span>
            <span className="status-pill subtle">API: /api/vehicles</span>
            <span className="status-pill subtle clock-pill">Live: {liveTime.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="hero-grid">
          {stats.map((item) => (
            <article className="stat-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="toolbar card">
        <label>
          <span>Search</span>
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search number, owner, or model" />
        </label>

        <label>
          <span>Type filter</span>
          <select value={vehicleType} onChange={(event) => { setVehicleType(event.target.value); setPage(1); }}>
            <option value="">All types</option>
            {VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <div className="toolbar-actions">
          <button type="button" className="secondary-button" onClick={() => { setSearch(''); setVehicleType(''); setPage(1); }}>
            Reset filters
          </button>
        </div>
      </section>

      {error ? <div className="alert card">{error}</div> : null}

      <div className="layout-grid">
        <VehicleForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          submitting={submitting}
          editingId={editingId}
          onCancel={handleCancelEdit}
        />

        <div className="stack">
          <VehicleTable vehicles={vehicles} onEdit={handleEdit} onDelete={handleDelete} loading={loading} />

          <section className="pagination card">
            <button type="button" onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))} disabled={page <= 1 || loading}>
              Previous
            </button>
            <span>
              Page {page} of {meta.totalPages || 1}
            </span>
            <button type="button" onClick={() => setPage((currentPage) => Math.min(meta.totalPages || 1, currentPage + 1))} disabled={loading || page >= (meta.totalPages || 1)}>
              Next
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
