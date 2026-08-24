import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import { toast } from 'react-toastify';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users || response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.put(`/admin/users/${id}`, { role: newRole });
      toast.success('User role updated');
      await fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted successfully');
      await fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) return <div className="mt-5"><Spinner /></div>;

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Manage Users</h2>
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light"><tr><th className="px-4">Name</th><th>Email</th><th>Current Role</th><th>Joined Date</th><th className="text-end px-4">Actions</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="fw-semibold px-4">{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select className={`form-select form-select-sm w-auto d-inline-block ${user.role === 'admin' ? 'bg-danger text-white border-danger' : user.role === 'organiser' ? 'bg-info text-dark border-info' : ''}`} value={user.role} onChange={(event) => handleRoleChange(user._id, event.target.value)}>
                      <option value="customer">Customer</option>
                      <option value="organiser">Organiser</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="text-muted small">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td className="text-end px-4"><button onClick={() => handleDelete(user._id)} className="btn btn-sm btn-outline-danger" title="Delete User"><i className="bi bi-trash"></i></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
