import React, { useState } from 'react';
import EventManager from '../components/ui/EventManager';
import AvailabilityManager from '../components/availability/AvailabilityManager';
import './Events.css';

type TabType = 'events' | 'availability';

const Events: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('events');

  return (
    <div className="events-page">
      <div className="events-tabs">
        <button
          className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Events
        </button>
        <button
          className={`tab-button ${activeTab === 'availability' ? 'active' : ''}`}
          onClick={() => setActiveTab('availability')}
        >
          My Availability
        </button>
      </div>

      <div className="events-tab-content">
        {activeTab === 'events' && <EventManager />}
        {activeTab === 'availability' && <AvailabilityManager />}
      </div>
    </div>
  );
};

export default Events;
