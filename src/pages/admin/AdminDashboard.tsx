import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { adminStats, recentActivity } from '../../data/adminData';

const AdminDashboard: React.FC = () => {
  const pendingTasks = [
    { label: 'Exams awaiting marking', count: 3, link: '/admin/exams' },
    { label: 'Accounts to verify', count: 2, link: '/accounts' },
    { label: 'Certificates to issue', count: 1, link: '/admin/certificates' },
    { label: 'Payments to confirm', count: 2, link: '/admin/payments' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of Tesla Cloud Institute activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{s.value}</p>
            <p
              className={`text-xs font-medium ${
                s.trend === 'up'
                  ? 'text-green-600'
                  : s.trend === 'down'
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              {s.change}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <ul className="space-y-4">
              {recentActivity.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white
                      ${a.type === 'student' && 'bg-blue-500'}
                      ${a.type === 'exam' && 'bg-orange-500'}
                      ${a.type === 'payment' && 'bg-green-500'}
                      ${a.type === 'testimonial' && 'bg-purple-500'}
                      ${a.type === 'course' && 'bg-gray-700'}
                    `}
                  >
                    {a.type.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{a.text}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Pending tasks + quick actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Tasks</h2>
            <ul className="space-y-3">
              {pendingTasks.map((t) => (
                <li key={t.label}>
                  <Link
                    to={t.link}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-black hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-gray-700">{t.label}</span>
                    <span className="text-sm font-bold text-gray-900">{t.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to="/admin/courses"
                className="block w-full text-center px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800"
              >
                Create New Course
              </Link>
              <Link
                to="/admin/exams"
                className="block w-full text-center px-4 py-2 rounded-lg border border-black text-black text-sm font-medium hover:bg-gray-100"
              >
                Upload Exam
              </Link>
              <Link
                to="/accounts"
                className="block w-full text-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                View All Accounts
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;