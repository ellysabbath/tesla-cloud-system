import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const Leadership: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const leaders = [
    {
      name: 'Elisha Sabbath Mwananjela',
      role: 'Founder & Lead Instructor',
      bio: 'A software developer who founded Tesla Cloud Institute in 2026 with a mission to bring practical computer skills to the Tanzanian youth.',
    },
    {
      name: 'Team Member 1',
      role: 'Instructor — Programming',
      bio: 'Specializes in teaching high-level programming languages like Java, Python, and PHP with a practical-first approach.',
    },
    {
      name: 'Team Member 2',
      role: 'Practical Coordinator',
      bio: 'Coordinates all practical sessions and ensures every student gets hands-on experience with real projects.',
    },
    {
      name: 'Team Member 3',
      role: 'Student Support',
      bio: 'Provides guidance and support to students throughout their learning journey at Tesla Cloud.',
    },
  ];

  const values = [
    {
      title: 'Practical First',
      desc: 'Every concept is taught with a real project in mind. No endless theory.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      title: 'Affordability',
      desc: 'Quality technology education should be accessible to everyone, not just the few.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Lifelong Learning',
      desc: 'Students are encouraged to keep building skills long after the course ends.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      title: 'Excellence',
      desc: 'Certification is awarded only after demonstrating real mastery.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="bg-black text-white py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-sm uppercase tracking-widest text-gray-400 mb-3">
              Leadership
            </p>
            <h1 className="text-3xl lg:text-5xl font-bold mb-4">
              Meet the Team
            </h1>
            <p className="text-lg text-gray-300 max-w-3xl">
              The people behind Tesla Cloud Institute — dedicated to helping
              every student succeed.
            </p>
          </div>
        </section>

        {/* Leaders */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {leaders.map((leader) => (
                <Card key={leader.name} className="p-6 text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-black text-white flex items-center justify-center text-2xl font-bold mb-4">
                    {leader.name.charAt(0)}
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {leader.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">{leader.role}</p>
                  <p className="text-sm text-gray-600">{leader.bio}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-center mb-12">
              Our Values
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => (
                <Card key={value.title} className="p-6">
                  <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mb-4">
                    {value.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-gray-600">{value.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Join CTA */}
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              Want to join our team?
            </h2>
            <p className="text-gray-600 mb-8">
              We're always looking for passionate tutors and coordinators who
              love teaching practical technology skills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contacts">
                <Button variant="outline" size="large">
                  Contact Us
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="large">Become a Student</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Leadership;