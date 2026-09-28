import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const AdminSettings: React.FC = () => {
  const [saved, setSaved] = useState('');
  const [form, setForm] = useState({
    fullName: 'Elisha Sabbath Mwananjela',
    email: 'admin@teslacloud.ac.tz',
    phone: '+255 712 345 678',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    maintenance: false,
    allowRegistration: true,
    emailNotifications: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(''), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-gray-600">Manage your admin account and system preferences</p>
      </div>

      {saved && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg">
          ✓ {saved}
        </div>
      )}

      {/* Account */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
          <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
        </div>
        <div className="mt-6">
          <Button onClick={() => flash('Account updated')}>Save Changes</Button>
        </div>
      </Card>

      {/* Password */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Current Password" name="currentPassword" type="password" value={form.currentPassword} onChange={handleChange} />
          <Input label="New Password" name="newPassword" type="password" value={form.newPassword} onChange={handleChange} />
          <Input label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} />
        </div>
        <div className="mt-6">
          <Button variant="outline" onClick={() => flash('Password updated')}>Update Password</Button>
        </div>
      </Card>

      {/* System */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Preferences</h2>
        <div className="space-y-3">
          {[
            { key: 'maintenance', label: 'Maintenance Mode', desc: 'Temporarily disable public access' },
            { key: 'allowRegistration', label: 'Allow New Registrations', desc: 'Students can create accounts' },
            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send system alert emails' },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name={item.key}
                  checked={form[item.key as keyof typeof form] as boolean}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-black transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Button onClick={() => flash('System preferences saved')}>Save Preferences</Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminSettings;