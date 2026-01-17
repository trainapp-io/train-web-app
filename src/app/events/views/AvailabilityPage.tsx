import React, { useState } from 'react';
import AvailabilityManager from '../components/availability/AvailabilityManager';
import BookingsManager from '../components/availability/BookingsManager';
import './AvailabilityPage.css';

type TabType = 'my-availability' | 'bookings';

const AvailabilityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('my-availability');

  return (
    <div className="availability-page">
      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'my-availability' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-availability')}
          >
            My Availability
          </button>
          <button
            className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'my-availability' && <AvailabilityManager />}
          {activeTab === 'bookings' && <BookingsManager />}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityPage;
