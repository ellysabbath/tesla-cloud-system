import React, { useState } from 'react';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const Contacts: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [sent, setSent] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSent(false), 4000);
  };

  const contactInfo = [
    {
      label: 'Location',
      value: 'Tanzania',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Email',
      value: 'info@teslacloud.ac.tz',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Phone',
      value: '+255 XXX XXX XXX',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
    {
      label: 'Working Hours',
      value: 'Mon – Sat: 8:00 AM – 6:00 PM',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              Contact Us
            </p>
            <h1 className="text-3xl lg:text-5xl font-bold mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-gray-300 max-w-3xl">
              Have a question about our courses, enrollment, or anything else?
              We'd love to hear from you.
            </p>
          </div>
        </section>

        {/* Contact cards */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info) => (
                <Card key={info.label} className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-black text-white flex items-center justify-center mb-4">
                    {info.icon}
                  </div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                    {info.label}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {info.value}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Form + map */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <div>
              <h2 className="text-2xl font-bold mb-2">Send us a message</h2>
              <p className="text-gray-600 mb-6">
                Fill the form below and our team will get back to you within 24
                hours.
              </p>

              {sent && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                  ✓ Your message has been sent successfully!
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-2">
                <Input
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
                <Input
                  label="Subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="What is this about?"
                  required
                />
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    required
                    placeholder="Write your message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <Button type="submit" fullWidth>
                  Send Message
                </Button>
              </form>
            </div>

            {/* Info panel */}
            <div>
              <Card className="p-8 h-full bg-black text-white">
                <h3 className="text-xl font-bold mb-4">Visit Our Campus</h3>
                <p className="text-gray-300 mb-6">
                  Come see our facilities and meet the team. You can sit in on
                  a practical session to experience the Tesla Cloud learning
                  environment first-hand.
                </p>
                <div className="space-y-3 text-sm">
                  <p className="text-gray-300">
                    <strong className="text-white">Address:</strong> Dar es Salaam, Tanzania
                  </p>
                  <p className="text-gray-300">
                    <strong className="text-white">Enrollment:</strong> Open for 2026
                  </p>
                  <p className="text-gray-300">
                    <strong className="text-white">Email:</strong> admissions@teslacloud.ac.tz
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-800">
                  <p className="text-sm text-gray-400">
                    Follow us on social media for updates, news, and student
                    success stories.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contacts;