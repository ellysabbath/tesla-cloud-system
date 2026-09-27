import React from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const MyProfile: React.FC = () => {
  const user = {
    fullName: 'Student Name',
    username: 'TESLA-2026-4581',
    email: 'student@teslacloud.ac.tz',
    mobile: '+255 712 345 678',
    region: 'Dar es Salaam',
    city: 'Dar es Salaam',
    dob: '01 January 2000',
    education: 'Secondary Education',
  };

  const fields = [
    { label: 'Full Name', value: user.fullName },
    { label: 'Username', value: user.username },
    { label: 'Email', value: user.email },
    { label: 'Mobile Number', value: user.mobile },
    { label: 'Region', value: user.region },
    { label: 'Current City', value: user.city },
    { label: 'Date of Birth', value: user.dob },
    { label: 'Educational Background', value: user.education },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
        <p className="text-gray-600">Manage your personal information</p>
      </div>

      {/* Header card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-black text-white flex items-center justify-center text-3xl font-bold">
            {user.fullName.charAt(0)}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900">{user.fullName}</h2>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500 mt-1">Username: {user.username}</p>
          </div>
          <Button variant="outline">Edit Profile</Button>
        </div>
      </Card>

      {/* Info card */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.label} className="border-b border-gray-100 pb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {field.label}
              </p>
              <p className="text-sm text-gray-900">{field.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default MyProfile;