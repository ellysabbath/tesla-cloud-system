import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-gray-900 text-white flex items-center justify-center text-2xl font-bold mb-5">
          404
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Page not found
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          The page you are looking for doesn’t exist or you don’t have
          permission to view it.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="secondary" size="small" onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Link to="/">
            <Button size="small" fullWidth>
              Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;