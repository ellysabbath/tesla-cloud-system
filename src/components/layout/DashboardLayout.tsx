import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardTopBar from '../DashboardTopBar';
import Sidebar from './Sidebar';

const DashboardLayout: React.FC = () => {
  // Sidebar starts OPEN on desktop, CLOSED on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar on the left */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Content shifts right when sidebar open on desktop */}
      <div
        className={`
          transition-[margin] duration-300 ease-in-out
          ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}
        `}
      >
        <DashboardTopBar
          onMenuClick={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          userName="Student"
          userEmail="student@teslacloud.ac.tz"
        />

        {/* Page content goes here via <Outlet /> */}
        <main className="pt-16 min-h-screen">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;