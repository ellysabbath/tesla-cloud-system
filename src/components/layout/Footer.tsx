import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  variant?: 'landing' | 'dashboard';
}

const Footer: React.FC<FooterProps> = ({ variant = 'landing' }) => {
  const currentYear = new Date().getFullYear();

  if (variant === 'dashboard') {
    return (
      <footer className="bg-white border-t border-gray-200 py-4 mt-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-600">
            © {currentYear} Tesla Cloud Institute. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold mb-4">TESLA CLOUD</h3>
            <p className="text-gray-400 text-sm">
              Become a beneficiary of technology at an affordable cost.
              Practical-based computer training for everyone.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about-us" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-white transition-colors">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/contacts" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h4 className="font-semibold mb-4">Programs</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/courses" className="hover:text-white transition-colors">
                  Computer Basics
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-white transition-colors">
                  Programming
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-white transition-colors">
                  Web Development
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-white transition-colors">
                  Database Management
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Tanzania</li>
              <li>info@teslacloud.ac.tz</li>
              <li>+255 742 578 691</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>© {currentYear} Tesla Cloud Institute. All rights reserved.</p>
          <p className="mt-2">
            Founded by Elisha Sabbath Mwananjela
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;