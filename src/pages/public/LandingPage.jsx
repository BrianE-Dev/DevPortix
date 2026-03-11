import Hero from '../../components/Hero';

const LandingPage = () => {
  return (
    <div>
      <Hero />
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6">
            <div className="text-3xl mb-4">🚀</div>
            <h3 className="font-bold text-lg mb-2">Build Fast</h3>
            <p className="text-gray-600">Create your portfolio in minutes</p>
          </div>
          <div className="text-center p-6">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="font-bold text-lg mb-2">Role-Based</h3>
            <p className="text-gray-600">Tailored experience for each user</p>
          </div>
          <div className="text-center p-6">
            <div className="text-3xl mb-4">💼</div>
            <h3 className="font-bold text-lg mb-2">Professional</h3>
            <p className="text-gray-600">Showcase to employers and peers</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;