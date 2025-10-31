import React, { useState, useRef, useEffect } from "react";
import { IoMdArrowDropdown } from "react-icons/io";

const SortByFilter: React.FC = () => {
  const [sortBy, setSortBy] = useState("recent");
  const [isOpen, setIsOpen] = useState(false); 
  const dropdownRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  
  const handleSelect = (value: "recent" | "top") => {
    setSortBy(value);
    setIsOpen(false);
    // queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  return (
    <div className="max-w-2xl mx-auto mb-1 px-1 sm:px-0 flex items-center">
      <hr className="flex-grow border-gray-400" />

      
      <div ref={dropdownRef} className="relative flex items-center flex-shrink-0 ml-2">
        <label className="text-sm text-gray-600">
          Sort by:
        </label>
        
        
        <button
          title="Sort By Filter"
          onClick={() => setIsOpen(!isOpen)} 
          className="flex items-center text-sm font-semibold text-gray-700 bg-transparent p-1 rounded focus:outline-none"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          
          {sortBy === 'recent' ? 'Recent' : 'Top'}
          
          
          <IoMdArrowDropdown 
            size={20} 
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        
        {isOpen && (
          <div 
            className="absolute top-full right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10"
            role="menu"
          >
            
            <button
              onClick={() => handleSelect("recent")}
              className={`block w-full text-left px-4 py-2 text-sm ${
                sortBy === 'recent' ? 'font-bold text-black' : 'text-gray-700'
              } hover:bg-gray-100`}
              role="menuitem"
            >
              Recent
            </button>
            
            
            <button
              onClick={() => handleSelect("top")}
              className={`block w-full text-left px-4 py-2 text-sm ${
                sortBy === 'top' ? 'font-bold text-black' : 'text-gray-700'
              } hover:bg-gray-100`}
              role="menuitem"
            >
              Top
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SortByFilter;
