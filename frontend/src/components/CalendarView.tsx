import React from 'react';
import FullCalendar from '@fullcalendar/react';
import { EventClickArg } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventData } from '../pages/calendar/CalendarPage';

// Map your custom event data to FullCalendar's EventInput format
const mapToCalendarEvents = (events: EventData[]) =>
  events.map((ev) => ({
    id: ev._id,
    title: ev.title,
    start: ev.start,
    end: ev.end,
    extendedProps: ev.extendedProps,
  }));

interface CalendarViewProps {
  events: EventData[];
  onEventClick?: (_: EventData) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onEventClick,
}) => {
  const handleEventClick = (arg: EventClickArg) => {
    const fullCalEvent = arg.event;
    const customEvent: EventData = {
      _id: fullCalEvent.id,
      title: fullCalEvent.title,
      start: fullCalEvent.start?.toISOString() || '',
      end: fullCalEvent.end?.toISOString() || '',
      group_id: '', // Not needed here, but can be set if stored in extendedProps
      extendedProps: {
        ...(fullCalEvent.extendedProps as any),
      },
    };
    onEventClick?.(customEvent);
  };

  // Optional: handle date selection to pre-fill form (if desired)
  const handleDateSelect = () => {
    // For example, you might open the form with pre-filled start/end dates here.
  };

  return (
    <div style={{ width: '92vw', boxSizing: 'border-box' }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridDay"
        selectable={true}
        selectMirror={true}
        events={mapToCalendarEvents(events)}
        eventClick={handleEventClick}
        select={handleDateSelect}
        headerToolbar={{
          left: 'prev,next',
          center: 'title',
          right: 'timeGridDay,timeGridWeek',
        }}
        titleFormat={{ month: 'numeric', day: 'numeric' }}
        allDaySlot={false}
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        contentHeight="auto"
        dayHeaderFormat={{ weekday: 'short' }}
        expandRows={true}
        dayMaxEvents={true}
      />
    </div>
  );
};

export default CalendarView;
