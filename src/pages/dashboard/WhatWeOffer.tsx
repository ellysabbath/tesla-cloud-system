import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { courses } from '../../data/mockData'; 

const WhatWeOffer: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(courses.map((c) => c.category)))];

  const filtered =
    selectedCategory === 'All'
      ? courses
      : courses.filter((c) => c.category === selectedCategory);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="bg-black text-white py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-sm uppercase tracking-widest text-gray-400 mb-3">
              What We Offer
            </p>
            <h1 className="text-3xl lg:text-5xl font-bold mb-4">
              Courses & Programs
            </h1>
            <p className="text-lg text-gray-300 max-w-3xl">
              Practical-based computer training across programming, web
              development, databases, and digital business.
            </p>
          </div>
        </section>

        {/* Category filter */}
        <section className="py-8 bg-white border-b border-gray-200 sticky top-16 z-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`
                    px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
                    ${selectedCategory === cat
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Course grid */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-sm text-gray-500 mb-6">
              Showing <strong>{filtered.length}</strong>{' '}
              {filtered.length === 1 ? 'course' : 'courses'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((course) => (
                <Card key={course.id} className="overflow-hidden flex flex-col">
                  <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm font-medium">
                      {course.category}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
                      {course.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                      <p>
                        <strong className="text-gray-700">Duration:</strong>{' '}
                        {course.duration}
                      </p>
                      <p>
                        <strong className="text-gray-700">Practicals:</strong>{' '}
                        {course.practicals}
                      </p>
                      <p className="col-span-2">
                        <strong className="text-gray-700">Instructor:</strong>{' '}
                        {course.instructor}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="font-bold text-gray-900">
                        {formatPrice(course.price)}
                      </span>
                      <Link to="/signup">
                        <Button size="small">Enroll</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-center mb-12">
              How Learning Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: '01', title: 'Enroll', desc: 'Choose a course and sign up.' },
                { step: '02', title: 'Learn Theory', desc: 'Study lessons uploaded by tutors.' },
                { step: '03', title: 'Practice', desc: 'Build real projects hands-on.' },
                { step: '04', title: 'Get Certified', desc: 'Pass exams and earn a certificate.' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-black text-white flex items-center justify-center font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-black text-white">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              Ready to enroll?
            </h2>
            <p className="text-gray-300 mb-8">
              Choose your course and start your practical journey today.
            </p>
            <Link to="/signup">
              <Button variant="secondary" size="large">
                Get Started
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default WhatWeOffer;