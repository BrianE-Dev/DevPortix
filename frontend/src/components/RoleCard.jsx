const RoleCard = ({ role, title, description, color, onSelect, isLoading }) => {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
    green: 'border-green-200 bg-green-50 hover:bg-green-100',
    purple: 'border-purple-200 bg-purple-50 hover:bg-purple-100'
  };

  const buttonClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700'
  };

  return (
    <div className={`border-2 ${colorClasses[color]} rounded-xl p-8 transition-all duration-300 hover:shadow-lg`}>
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 ${
          color === 'blue' ? 'bg-blue-100' :
          color === 'green' ? 'bg-green-100' : 'bg-purple-100'
        }`}>
          <span className={`text-2xl font-bold ${
            color === 'blue' ? 'text-blue-600' :
            color === 'green' ? 'text-green-600' : 'text-purple-600'
          }`}>
            {title.charAt(0)}
          </span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 mb-8">{description}</p>
        <button
          type="button"
          onClick={() => onSelect(role)}
          disabled={isLoading}
          className={`inline-block px-8 py-3 ${buttonClasses[color]} text-white font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {isLoading ? 'Saving...' : 'Enter Dashboard'}
        </button>
      </div>
    </div>
  );
};

export default RoleCard;
