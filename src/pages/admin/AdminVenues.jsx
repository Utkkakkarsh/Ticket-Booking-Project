import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import { toast } from 'react-toastify';

const AdminVenues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);

  const initialForm = { name: '', location: '', latitude: '', longitude: '', rows: '', columns: '', categories: [{ name: '', rows: '', priceMultiplier: '' }] };
  const [formData, setFormData] = useState(initialForm);

  const openCreate = () => {
    setEditingVenue(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const openEdit = (venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      location: venue.location,
      latitude: venue.coordinates?.latitude ?? '',
      longitude: venue.coordinates?.longitude ?? '',
      rows: String(venue.rows),
      columns: String(venue.columns),
      categories: (venue.categories || []).map((category) => ({
        name: category.name,
        rows: (category.rows || []).join(','),
        priceMultiplier: String(category.priceMultiplier)
      }))
    });
    setShowModal(true);
  };

  const fetchVenues = async () => {
    try {
      const res = await api.get('/venues');
      setVenues(res.data.venues || res.data || []);
    } catch (err) {
      toast.error('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this venue? This may break events attached to it.')) {
      try {
        await api.delete(`/venues/${id}`);
        toast.success('Venue deleted');
        fetchVenues();
      } catch (err) {
        toast.error('Failed to delete venue');
      }
    }
  };

  const handleAddCategory = () => {
    setFormData({
      ...formData,
      categories: [...formData.categories, { name: '', rows: '', priceMultiplier: '' }]
    });
  };

  const handleCategoryChange = (index, field, value) => {
    const newCats = [...formData.categories];
    newCats[index][field] = value;
    setFormData({ ...formData, categories: newCats });
  };

  const handleRemoveCategory = (index) => {
    const newCats = formData.categories.filter((_, i) => i !== index);
    setFormData({ ...formData, categories: newCats });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        coordinates: formData.latitude !== '' && formData.longitude !== '' ? { latitude: parseFloat(formData.latitude), longitude: parseFloat(formData.longitude) } : undefined,
        categories: formData.categories.map(c => ({
          name: c.name,
          rows: c.rows.split(',').map(r => parseInt(r.trim(), 10)),
          priceMultiplier: parseFloat(c.priceMultiplier)
        }))
      };
      delete payload.latitude;
      delete payload.longitude;
      
      if (editingVenue) {
        await api.put(`/venues/${editingVenue._id}`, payload);
        toast.success('Venue updated successfully');
      } else {
        await api.post('/venues', payload);
        toast.success('Venue created successfully');
      }
      setShowModal(false);
      setFormData(initialForm);
      setEditingVenue(null);
      fetchVenues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create venue');
    }
  };

  if (loading) return <div className="mt-5"><Spinner /></div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Manage Venues</h2>
        <button className="btn btn-primary fw-bold rounded-pill shadow-sm" onClick={openCreate}>
          <i className="bi bi-plus-lg me-2"></i> Add Venue
        </button>
      </div>

      <div className="row g-4">
        {venues.map(venue => (
          <div key={venue._id} className="col-md-6 col-lg-4">
            <div className="card shadow-sm border-0 h-100 rounded-4">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between">
                  <h5 className="fw-bold">{venue.name}</h5>
                  <div className="d-flex gap-1"><button onClick={() => openEdit(venue)} className="btn btn-sm btn-outline-primary border-0" title="Edit venue"><i className="bi bi-pencil"></i></button><button onClick={() => handleDelete(venue._id)} className="btn btn-sm btn-outline-danger border-0" title="Delete venue"><i className="bi bi-trash"></i></button></div>
                </div>
                <p className="text-muted small mb-3"><i className="bi bi-geo-alt me-1"></i>{venue.location}</p>
                <div className="d-flex gap-3 mb-3">
                  <div className="bg-light px-3 py-1 rounded small"><span className="fw-bold">{venue.rows}</span> Rows</div>
                  <div className="bg-light px-3 py-1 rounded small"><span className="fw-bold">{venue.columns}</span> Cols</div>
                </div>
                <h6 className="fw-semibold small text-muted">Categories</h6>
                <ul className="list-group list-group-flush small">
                  {venue.categories?.map(c => (
                    <li key={c._id} className="list-group-item px-0 py-1 bg-transparent d-flex justify-content-between">
                      <span>{c.name} (Rows: {c.rows.join(',')})</span>
                      <span className="fw-bold text-success">x{c.priceMultiplier}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header border-0 bg-light rounded-top-4">
                <h5 className="modal-title fw-bold">{editingVenue ? 'Edit Venue' : 'Add New Venue'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Venue Name</label>
                      <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Location</label>
                      <input type="text" className="form-control" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Latitude (optional)</label>
                      <input type="number" step="any" min="-90" max="90" className="form-control" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} placeholder="e.g. 19.0760" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Longitude (optional)</label>
                      <input type="number" step="any" min="-180" max="180" className="form-control" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} placeholder="e.g. 72.8777" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Total Rows</label>
                      <input type="number" className="form-control" value={formData.rows} onChange={e => setFormData({...formData, rows: e.target.value})} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Seats per Row (Columns)</label>
                      <input type="number" className="form-control" value={formData.columns} onChange={e => setFormData({...formData, columns: e.target.value})} required />
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3 border-bottom pb-2">Seat Categories</h6>
                  {formData.categories.map((cat, index) => (
                    <div key={index} className="row g-2 mb-3 align-items-end">
                      <div className="col-md-3">
                        <label className="form-label small">Name (e.g. VIP)</label>
                        <input type="text" className="form-control form-control-sm" value={cat.name} onChange={e => handleCategoryChange(index, 'name', e.target.value)} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small">Rows (comma-separated: 1,2,3)</label>
                        <input type="text" className="form-control form-control-sm" value={cat.rows} onChange={e => handleCategoryChange(index, 'rows', e.target.value)} required />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small">Price Multiplier (e.g. 1.5)</label>
                        <input type="number" step="0.1" className="form-control form-control-sm" value={cat.priceMultiplier} onChange={e => handleCategoryChange(index, 'priceMultiplier', e.target.value)} required />
                      </div>
                      <div className="col-md-2">
                        {formData.categories.length > 1 && (
                          <button type="button" className="btn btn-outline-danger btn-sm w-100" onClick={() => handleRemoveCategory(index)}>Remove</button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddCategory}>+ Add Category</button>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4">{editingVenue ? 'Update Venue' : 'Save Venue'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVenues;
