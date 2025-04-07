import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CalendarView from '../../components/CalendarView';
import EventFormModal from '../../components/EventFormModal';
import { useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../App';
import GroupHeaderBar from './../../components/GroupHeadBar';
import { message } from 'antd';

// Basic interface for the extended properties of an event
interface ExtendedProps {
  people: string[];
  description: string;
  repeat: string; // "None" | "Weekly" | "Biweekly"
  created_by?: string;
}

// Event interface matching your backend data structure
export interface EventData {
  _id?: string;
  title: string;
  start: string; // ISO string format
  end: string; // ISO string format
  group_id: string; // Your group ID
  extendedProps: ExtendedProps;
}

const Calendar: React.FC = () => {
  // Replace this with your actual group ID if needed
  const location = useLocation();
  const { userId, groupId } = location.state || {};
  const [events, setEvents] = useState<EventData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  // Fetch events from the backend
  const fetchEvents = async () => {
    try {
      // Optionally, pass query params for date ranges
      const res = await axios.get<EventData[]>(
        `${API_BASE_URL}/api/events/${groupId}`,
      );
      setEvents(res.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
  });

  // Handle saving (create or update) an event
  const handleSaveEvent = async (
    formData: Omit<EventData, '_id'> & { _id?: string },
  ) => {
    try {
      if (!formData._id) {
        const res = await axios.post(`${API_BASE_URL}/api/events`, {
          title: formData.title,
          start: formData.start,
          end: formData.end,
          people: formData.extendedProps.people,
          description: formData.extendedProps.description,
          repeat: formData.extendedProps.repeat,
          group_id: groupId,
          created_by: userId,
        });
        messageApi.success(res.data.message || 'Event created!');
      } else {
        const res = await axios.patch(
          `${API_BASE_URL}/api/events/${groupId}/${formData._id}`,
          {
            title: formData.title,
            start: formData.start,
            end: formData.end,
            people: formData.extendedProps.people,
            description: formData.extendedProps.description,
            repeat: formData.extendedProps.repeat,
          },
        );
        messageApi.success(res.data.message || 'Event updated!');
      }

      await fetchEvents();
      setShowForm(false);
      setEditingEvent(null);
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'Something went wrong.';
      messageApi.error(errMsg);
    }
  };

  // Handle deletion of an event
  const handleDeleteEvent = async (eventId: string) => {
    try {
      const res = await axios.delete(
        `${API_BASE_URL}/api/events/${groupId}/${eventId}`,
      );
      messageApi.success(res.data.message || 'Event deleted.');
      fetchEvents();
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'Failed to delete event.';
      messageApi.error(errMsg);
    }
  };

  // When an event is clicked on the calendar, open the form in edit mode
  const handleEventClick = (clickedEvent: EventData) => {
    setEditingEvent(clickedEvent);
    setShowForm(true);
  };

  // When clicking "New Event", open the form in creation mode
  const handleNewEvent = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  return (
    <>
      {contextHolder}
      <div style={{ width: '100vw', padding: 0 }}>
        <GroupHeaderBar />
      </div>

      <div
        style={{
          width: '100%',
          padding: '0.5rem',
          boxSizing: 'border-box',
          overflowY: 'auto', // your scrollable content
        }}
      >
        <CalendarView events={events} onEventClick={handleEventClick} />
      </div>

      <button
        onClick={handleNewEvent}
        style={{
          position: 'fixed',
          bottom: '3rem',
          right: '1rem',
          padding: '0.75rem 1.25rem',
          background: '#9b59b6',
          color: '#fff',
          border: 'none',
          borderRadius: '9999px',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
        }}
      >
        New Event
      </button>

      {showForm && (
        <EventFormModal
          eventData={editingEvent}
          groupId={groupId}
          onSave={handleSaveEvent}
          onDelete={editingEvent?._id ? handleDeleteEvent : undefined}
          onClose={() => {
            setShowForm(false);
            setEditingEvent(null);
          }}
        />
      )}
    </>
  );
};

export default Calendar;
