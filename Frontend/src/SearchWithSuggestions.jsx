import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

const SearchWithSuggestions = ({ onSearch, isDisabled, api }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Handle clicks outside of the search container
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length > 0) {
        try {
          const response = await api.get('/api/search_suggestions', {
            params: { prompt: searchQuery }
          });
          
          if (response.data.success && Array.isArray(response.data.response)) {
            setSuggestions(response.data.response);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(fetchSuggestions, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, api]);

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    onSearch({ target: { value: suggestion } });
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          onSearch(e);
        }}
        onFocus={() => setShowSuggestions(suggestions.length > 0)}
        placeholder="Search for songs, artists, or albums..."
        className="w-full p-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:border-blue-500"
        disabled={isDisabled}
      />
      <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center">
                <Search size={16} className="text-gray-400 mr-2" />
                <span>{suggestion}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchWithSuggestions;