import React, { useState } from 'react';
import AvailabilityManager from '../components/availability/AvailabilityManager';
import BookingsManager from '../components/availability/BookingsManager';
import './AvailabilityPage.css';

type TabType = 'my-availability' | 'bookings';

const AvailabilityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('my-availability');

  return (
    <div className="availability-page">
      <div className="availability-tabs">
        <button
          className={`availability-tab ${activeTab === 'my-availability' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-availability')}
        >
          My Availability
        </button>
        <button
          className={`availability-tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Bookings
        </button>
      </div>

      {activeTab === 'my-availability' && <AvailabilityManager />}
      {activeTab === 'bookings' && <BookingsManager />}
    </div>
  );
};

export default AvailabilityPage;
