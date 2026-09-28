import React from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { currentAdmin } from '../../data/adminData';

const AdminMyProfile: React.FC = () => {
  const fields = [
    { label: 'Full Name', value: currentAdmin.fullName },
    { label: 'Username', value: currentAdmin.username },
    { label: 'Email', value: currentAdmin.email },
    { label: 'Phone', value: currentAdmin.phone },
    { label: 'Role', value: currentAdmin.role },
    { label: 'Last Login', value: new Date(currentAdmin.lastLogin).toLocaleString() },
    { label: 'Member Since', value: new Date(currentAdmin.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
        <p className="text-gray-600">Your admin account details</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-900 text-white flex items-center justify-center text-3xl font-bold">
            {currentAdmin.fullName.charAt(0)}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900">{currentAdmin.fullName}</h2>
            <p className="text-gray-600">{currentAdmin.email}</p>
            <span className="inline-block mt-2 text-xs uppercase tracking-wider font-semibold bg-black text-white px-3 py-1 rounded-full">
              {currentAdmin.role}
            </span>
          </div>
          <Button variant="outline">Edit Profile</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.label} className="border-b border-gray-100 pb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{f.label}</p>
              <p className="text-sm text-gray-900">{f.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminMyProfile;