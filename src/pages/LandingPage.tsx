import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { newsItems, testimonials, teamMembers } from '../data/mockData';

const LandingPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const learnItems = [
    'Computer Basics',
    'Introduction to Computer Programming',
    'e-Commerce',
    'Database Management System (MySQL)',
    'System Designing',
    'Web Development (UI/UX)',
    'High Level Programming Languages in JAVA',
    'High Level Programming Language in PYTHON',
    'High Level Programming Language in PHP',
    'Web Development (Full Stack with JAVA)',
    'Web Development (Full Stack with PHP)',
    'Web Development (Full Stack with PYTHON)',
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section
          className="relative bg-black text-white py-20 lg:py-32"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(/images/hero-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-3xl lg:text-5xl font-bold mb-6 leading-tight">
                BECOME A BENEFICIARY OF TECHNOLOGY AT AN AFFORDABLE COST
              </h1>
              
              <div className="mb-8">
                <h2 className="text-xl lg:text-2xl font-semibold mb-4">
                  HERE YOU WILL LEARN:
                </h2>
                <ol className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-300">
                  {learnItems.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">{index + 1}:</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <Link to="/signup">
                <Button variant="secondary" size="large">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-center mb-12">
              What People Say About Tesla Cloud
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center mr-4">
                      <span className="text-lg font-bold">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic">"{testimonial.message}"</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* News Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-center mb-12">
              Latest News & Updates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {newsItems.map((news) => (
                <Card key={news.id} className="overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{news.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {formatDate(news.createdAt)}
                    </p>
                    <p className="text-gray-700 mb-4">{news.body}</p>
                    <Link to="/signup">
                      <Button variant="outline" size="small">
                        Join Now
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-center mb-12">
              Tesla Cloud Institute Team
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {teamMembers.map((member) => (
                <div key={member.id} className="text-center">
                  <div className="w-32 h-32 mx-auto rounded-full bg-gray-300 flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold text-gray-600">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link to="/signup">
                <Button size="large">Get Started</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;