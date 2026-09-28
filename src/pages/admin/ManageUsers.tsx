import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'tutor' | 'moderator';
  status: 'active' | 'inactive';
}

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([
    { id: '1', name: 'Elisha Sabbath Mwananjela', email: 'admin@teslacloud.ac.tz', role: 'admin', status: 'active' },
    { id: '2', name: 'Team Member 1', email: 'tutor1@teslacloud.ac.tz', role: 'tutor', status: 'active' },
    { id: '3', name: 'Team Member 2', email: 'mod1@teslacloud.ac.tz', role: 'moderator', status: 'active' },
    { id: '4', name: 'Team Member 3', email: 'tutor2@teslacloud.ac.tz', role: 'tutor', status: 'inactive' },
  ]);

  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'tutor' as ManagedUser['role'],
  });

  const addUser = () => {
    if (!newUser.name || !newUser.email) return;
    setUsers([
      ...users,
      { id: crypto.randomUUID(), ...newUser, status: 'active' },
    ]);
    setNewUser({ name: '', email: '', role: 'tutor' });
    setShowAdd(false);
  };

  const toggleStatus = (id: string) => {
    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
      )
    );
  };

  const removeUser = (id: string) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Manage Users</h1>
          <p className="text-gray-600">Add, edit, or remove admin/tutor accounts</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : '+ Add User'}
        </Button>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">New User</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Full Name"
              name="name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value as ManagedUser['role'] })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="admin">Admin</option>
                <option value="tutor">Tutor</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={addUser}>Add User</Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs uppercase tracking-wide font-semibold text-gray-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleStatus(u.id)}
                      className="text-xs font-medium text-blue-600 hover:underline mr-3"
                    >
                      {u.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => removeUser(u.id)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ManageUsers;