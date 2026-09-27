import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const AboutUs: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const reasons = [
    {
      title: 'Affordable Cost',
      desc: 'We provide computer skills at a cost that every Tanzanian youth can afford.',
    },
    {
      title: 'Practical Based Skills',
      desc: 'Every lesson is hands-on. You build real projects, not just theory.',
    },
    {
      title: 'Lifelong Learning',
      desc: 'Spend as much time as you need developing practical skills for your own benefit.',
    },
    {
      title: 'Frequent Assessment',
      desc: 'Theories are tested then implemented in practical sessions under TCIMS.',
    },
    {
      title: 'Certification Per Course',
      desc: 'Receive a certificate for every course you complete based on quality.',
    },
    {
      title: 'Tutor Collaboration',
      desc: 'Tutors make corrections with students and repeat theory for practical mastery.',
    },
    {
      title: 'Freedom of Choice',
      desc: 'Choose what you want to learn according to Tesla Cloud Institute policy.',
    },
  ];

  const stats = [
    { value: '12+', label: 'Courses Offered' },
    { value: '2026', label: 'Year Founded' },
    { value: '100%', label: 'Practical Focus' },
    { value: '∞', label: 'Learning Time' },
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
              About Us
            </p>
            <h1 className="text-3xl lg:text-5xl font-bold mb-4">
              Tesla Cloud Institute
            </h1>
            <p className="text-lg text-gray-300 max-w-3xl">
              A non-government institution providing Computer skills, Digital
              knowledge, Information Systems skills and Software development
              training to the Tanzanian community.
            </p>
          </div>
        </section>

        {/* Mission & Story */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-4">
                Our Story
              </h2>
              <p className="text-gray-700 mb-4">
                Tesla Cloud Institute was developed and initiated in 2026 by{' '}
                <strong>Elisha Sabbath Mwananjela</strong>, a software developer
                with a vision to equip the youth with practical technology
                skills.
              </p>
              <p className="text-gray-700 mb-4">
                Most graduates and youth groups do not have computer skills
                that allow them to generate income. TCI comes to the society to
                train the majority on <strong>Practical Based Computer
                Trainings</strong>, so that they can gain money when they use
                technology properly.
              </p>
              <p className="text-gray-700">
                Under the Tesla Cloud Institute Management System (TCIMS), the
                learning experience combines theory, frequent assessment, and
                real-world practicals — all at an affordable cost.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="p-6 text-center">
                  <p className="text-3xl lg:text-4xl font-bold text-black mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Reasons */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl lg:text-3xl font-bold mb-3">
                Why Tesla Cloud Institute?
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                The reasons that make TCI the right place to build your
                technology career.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reasons.map((reason, idx) => (
                <Card key={reason.title} className="p-6">
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold mb-4">
                    {idx + 1}
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {reason.title}
                  </h3>
                  <p className="text-sm text-gray-600">{reason.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              Ready to start your journey?
            </h2>
            <p className="text-gray-600 mb-8">
              Join Tesla Cloud Institute today and become a beneficiary of
              technology at an affordable cost.
            </p>
            <Link to="/signup">
              <Button size="large">Get Started</Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;