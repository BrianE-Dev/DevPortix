import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const MarketingLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="mt-20 border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>DEVPORTIX &copy; {new Date().getFullYear()} - Your Code, Your Story</p>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLayout;
