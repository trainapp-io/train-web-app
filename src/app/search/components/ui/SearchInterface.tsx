import React, { useState, useEffect } from 'react';
import { searchService } from '../../services/searchService';
import { 
  CertificationResponse, 
  SearchProfilesResponse,
} from '@trainapp-io/train-core';
import { FaSearch, FaUser, FaUsers, FaCertificate, FaTimes, FaChevronRight } from 'react-icons/fa';
import './SearchInterface.css';

interface SearchInterfaceProps {
  onProfileSelect?: (profileId: string) => void;
  onGroupSelect?: (groupId: string) => void;
  onCertificationSelect?: (certificationId: string) => void;
}

type SearchType = 'profiles' | 'certifications' | 'all';

const SearchInterface: React.FC<SearchInterfaceProps> = ({
  onProfileSelect,
  onGroupSelect,
  onCertificationSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [profileResults, setProfileResults] = useState<SearchProfilesResponse | null>(null);
  const [certificationResults, setCertificationResults] = useState<CertificationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const resultsPerPage = 10;

  useEffect(() => {
    if (!searchQuery.trim()) {
      setProfileResults(null);
      setCertificationResults([]);
      return;
    }

    const performSearch = async () => {
      try {
        setLoading(true);
        setError(null);

        if (searchType === 'profiles' || searchType === 'all') {
          const profileResponse = await searchService.searchProfilesAndGroups(
            searchQuery,
            currentPage,
            resultsPerPage
          );
          
          const searchData = profileResponse.data[0]; 
          
          setProfileResults(prevResults => 
            currentPage === 1 
              ? searchData 
              : prevResults ? {
                  userProfiles: [...prevResults.userProfiles, ...searchData.userProfiles],
                  groups: [...prevResults.groups, ...searchData.groups]
                } : searchData
          );
          
          setHasMore(profileResponse.pagination.hasNextPage);
        }

        if (searchType === 'certifications' || searchType === 'all') {
          const certResponse = await searchService.searchCertifications(
            searchQuery,
            currentPage,
            resultsPerPage
          );
          
          setCertificationResults(prevResults => 
            currentPage === 1 
              ? certResponse.data 
              : [...prevResults, ...certResponse.data]
          );
          
          if (searchType === 'certifications') {
            setHasMore(certResponse.pagination.hasNextPage);
          }
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to perform search. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Debounce search to avoid too many API calls
    const debounceTimeout = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, searchType, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); 
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setProfileResults(null);
    setCertificationResults([]);
    setCurrentPage(1);
  };

  const handleSearchTypeChange = (type: SearchType) => {
    setSearchType(type);
    setCurrentPage(1); 
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  // Determine if we should show profiles section
  const showProfiles = searchType === 'profiles' || searchType === 'all';
  
  // Determine if we should show certifications section
  const showCertifications = searchType === 'certifications' || searchType === 'all';

  // Handle result selection
  const handleResultSelect = (result: any, type: 'profile' | 'group' | 'certification') => {
    if (type === 'profile' && onProfileSelect) {
      onProfileSelect(result.userId || result.id);
    } else if (type === 'group' && onGroupSelect) {
      onGroupSelect(result.id);
    } else if (type === 'certification' && onCertificationSelect) {
      onCertificationSelect(result.id);
    }
  };

  return (
    <div className="search-interface">
      <div className="search-header">
        <div className="search-input-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search for profiles, groups, or certifications..."
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search-button" onClick={handleClearSearch}>
              <FaTimes />
            </button>
          )}
        </div>
        
        <div className="search-type-filters">
          <button 
            className={`search-type-button ${searchType === 'all' ? 'active' : ''}`}
            onClick={() => handleSearchTypeChange('all')}
          >
            All
          </button>
          <button 
            className={`search-type-button ${searchType === 'profiles' ? 'active' : ''}`}
            onClick={() => handleSearchTypeChange('profiles')}
          >
            Profiles & Groups
          </button>
          <button 
            className={`search-type-button ${searchType === 'certifications' ? 'active' : ''}`}
            onClick={() => handleSearchTypeChange('certifications')}
          >
            Certifications
          </button>
        </div>
      </div>

      {error && <div className="search-error">{error}</div>}

      <div className="search-results">
        {loading && currentPage === 1 ? (
          <div className="search-loading">Searching...</div>
        ) : (
          <>
            {searchQuery && !loading && (!profileResults || (profileResults.userProfiles.length === 0 && profileResults.groups.length === 0)) && certificationResults.length === 0 && (
              <div className="no-results">
                No results found for "{searchQuery}". Try a different search term.
              </div>
            )}

            {showProfiles && profileResults && (profileResults.userProfiles.length > 0 || profileResults.groups.length > 0) && (
              <div className="results-section">
                <h3 className="results-section-title">Profiles & Groups</h3>
                <div className="results-list">
                  {/* User Profiles */}
                  {profileResults.userProfiles.map(profile => (
                    <div 
                      key={profile.userId} 
                      className="result-item"
                      onClick={() => handleResultSelect(profile, 'profile')}
                    >
                      <div className="result-icon">
                        <FaUser />
                      </div>
                      <div className="result-content">
                        <h4 className="result-title">{profile.name}</h4>
                        {profile.bio && (
                          <p className="result-description">{profile.bio}</p>
                        )}
                        {profile.location && (
                          <p className="result-location">{profile.location}</p>
                        )}
                      </div>
                      <div className="result-action">
                        <FaChevronRight />
                      </div>
                    </div>
                  ))}
                  
                  {/* Groups */}
                  {profileResults.groups.map(group => (
                    <div 
                      key={group.id} 
                      className="result-item"
                      onClick={() => handleResultSelect(group, 'group')}
                    >
                      <div className="result-icon">
                        <FaUsers />
                      </div>
                      <div className="result-content">
                        <h4 className="result-title">
                          {group.name}
                          <span className="result-type">Group</span>
                        </h4>
                        {group.description && (
                          <p className="result-description">{group.description}</p>
                        )}
                        {group.location && (
                          <p className="result-location">{group.location}</p>
                        )}
                        {group.tags && group.tags.length > 0 && (
                          <div className="result-tags">
                            {group.tags.map((tag: string, index: number) => (
                              <span key={index} className="result-tag">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="result-action">
                        <FaChevronRight />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showCertifications && certificationResults.length > 0 && (
              <div className="results-section">
                <h3 className="results-section-title">Certifications</h3>
                <div className="results-list">
                  {certificationResults.map(result => (
                    <div 
                      key={result.id} 
                      className="result-item"
                      onClick={() => handleResultSelect(result, 'certification')}
                    >
                      <div className="result-icon">
                        <FaCertificate />
                      </div>
                      <div className="result-content">
                        <h4 className="result-title">{result.name}</h4>
                        {result.issuer && (
                          <p className="result-issuer">Issued by {result.issuer}</p>
                        )}
                        {result.certType && (
                          <p className="result-type">{result.certType}</p>
                        )}
                        {result.specializations && result.specializations.length > 0 && (
                          <div className="result-tags">
                            {result.specializations.map((spec: string, index: number) => (
                              <span key={index} className="result-tag">{spec}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="result-action">
                        <FaChevronRight />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(loading && currentPage > 1) && (
              <div className="loading-more">Loading more results...</div>
            )}

            {hasMore && !loading && (
              <button className="load-more-button" onClick={handleLoadMore}>
                Load More Results
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchInterface;
