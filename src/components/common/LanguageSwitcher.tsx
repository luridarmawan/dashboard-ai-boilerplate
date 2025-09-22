import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../../context/I18nContext';
import availableLanguages from '../../translations/available-language.json';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = availableLanguages;

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageSelect = (langCode: string) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-300 transition-colors duration-200"
      >
        <img
          src={currentLanguage.flag}
          alt={currentLanguage.name}
          className="w-4 h-4 object-cover rounded-sm"
        />
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-full">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-100 transition-colors duration-200 ${language === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                } ${lang.code === languages[0].code ? 'rounded-t-md' : ''} ${lang.code === languages[languages.length - 1].code ? 'rounded-b-md' : ''
                }`}
            >
              <img
                src={lang.flag}
                alt={lang.name}
                className="w-4 h-4 object-cover rounded-sm"
              />
              <span className="language-name text-xs font-medium pr-3 whitespace-nowrap">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;