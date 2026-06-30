import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Page not found</h1>
          <p className="text-gray-500 mb-8">
            The page you're looking for doesn't exist or may have moved. Let's get you back on track.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button variant="outline" fullWidth>Back to Home</Button>
            </Link>
            <Link to="/coaches">
              <Button fullWidth>Find an Academy</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
