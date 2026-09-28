import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminTopBar from './AdminTopBar';
import AdminSidebar from './AdminSidebar';

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div
        className={`
          transition-[margin] duration-300 ease-in-out
          ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}
        `}
      >
        <AdminTopBar onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        <main className="pt-16 min-h-screen">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;