import React, { useState, useEffect } from 'react';
import { EventData } from '../pages/calendar/CalendarPage';
import { API_BASE_URL } from '../App';
import axios from 'axios';
import { DatePicker, TimePicker, Select, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

const { Option } = Select;

interface EventFormModalProps {
  eventData: EventData | null;
  groupId: string;
  onSave: (_: Omit<EventData, '_id'> & { _id?: string }) => void;
  onDelete?: (_: string) => void;
  onClose: () => void;
}

const EventFormModal: React.FC<EventFormModalProps> = ({
  eventData,
  groupId,
  onSave,
  onDelete,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [duration, setDuration] = useState<number>(60);
  const [people, setPeople] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [repeat, setRepeat] = useState('None');
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);

  // ✅ Ant Design message API
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (eventData) {
      setTitle(eventData.title);
      const start = dayjs(eventData.start);
      const end = dayjs(eventData.end);
      setStartDate(start.startOf('day'));
      setStartTime(start);
      setDuration(end.diff(start, 'minute'));
      setPeople(eventData.extendedProps.people);
      setDescription(eventData.extendedProps.description);
      setRepeat(eventData.extendedProps.repeat);
    } else {
      setTitle('');
      setStartDate(null);
      setStartTime(null);
      setDuration(60);
      setPeople([]);
      setDescription('');
      setRepeat('None');
    }
  }, [eventData]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/users/${groupId}`);
        const json = res.data;
        if (json.success && Array.isArray(json.users)) {
          setUsers(json.users);
        } else {
          messageApi.error(json.message || 'Failed to load users');
        }
      } catch (error: any) {
        const errMsg =
          error?.response?.data?.message || 'Error fetching users';
        messageApi.error(errMsg);
        console.error('Error fetching users:', error);
      }
    };

    if (groupId) {
      fetchUsers();
    }
  }, [groupId, messageApi]);

  const handleTogglePerson = (username: string) => {
    setPeople((prev) =>
      prev.includes(username)
        ? prev.filter((p) => p !== username)
        : [...prev, username],
    );
  };

  const handleSubmit = () => {
    if (!startDate || !startTime) {
      messageApi.error('Start date and time must be selected');
      return;
    }

    const combinedStart = startDate
      .hour(startTime.hour())
      .minute(startTime.minute());
    const end = combinedStart.add(duration, 'minute');

    const now = dayjs();

    if (!title) {
      messageApi.error('Please include a title');
      return;
    }
    if (combinedStart.isBefore(now)) {
      messageApi.error('Start time must be in the future');
      return;
    }

    if (title.length > 20) {
      messageApi.error('Title must be less than 20 characters');
      return;
    }

    if (description.length > 100) {
      messageApi.error('Description must be less than 100 characters');
      return;
    }

    const payload: Omit<EventData, '_id'> & { _id?: string } = {
      title,
      start: combinedStart.toISOString(),
      end: end.toISOString(),
      group_id: groupId,
      extendedProps: {
        people,
        description,
        repeat,
      },
    };

    if (eventData?._id) {
      payload._id = eventData._id;
    }

    onSave(payload);
  };

  return (
    <>
      {contextHolder}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            background: '#fff',
            padding: '1rem',
            borderRadius: 8,
            width: '90vw',
            maxWidth: 500,
          }}
        >
          <h2>{eventData ? 'Edit Event' : 'New Event'}</h2>

          <div style={{ marginBottom: '0.5rem' }}>
            <label>
              Event Title<span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <label>Start Date</label>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <label>Start Time</label>
            <TimePicker
              use12Hours
              format="hh:mm A"
              value={startTime}
              onChange={setStartTime}
              style={{ width: '100%' }}
              minuteStep={5}
            />
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <label>Duration</label>
            <Select
              value={duration}
              onChange={setDuration}
              style={{ width: '100%' }}
            >
              <Option value={15}>15 minutes</Option>
              <Option value={30}>30 minutes</Option>
              <Option value={45}>45 minutes</Option>
              <Option value={60}>1 hour</Option>
              <Option value={90}>1.5 hours</Option>
              <Option value={120}>2 hours</Option>
            </Select>
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <label>Select People</label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginTop: '0.25rem',
                border: '1px solid #ccc',
                borderRadius: 4,
                padding: '0.5rem',
                maxHeight: '150px',
                overflowY: 'auto',
              }}
            >
              {users.map((user) => (
                <label
                  key={user.id}
                  style={{ display: 'flex', gap: '0.25rem' }}
                >
                  <input
                    type="checkbox"
                    checked={people.includes(user.username)}
                    onChange={() => handleTogglePerson(user.username)}
                  />
                  {user.username}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            Description{' '}
            <span style={{ color: 'gray', fontSize: '0.9em' }}>(optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <label>Repeat</label>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="None">None</option>
              <option value="Weekly">Weekly</option>
              <option value="Biweekly">Biweekly</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {onDelete && eventData?._id && (
              <button
                style={{
                  background: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
                onClick={() => onDelete(eventData._id!)}
              >
                Delete
              </button>
            )}
            <div style={{ marginLeft: 'auto' }}>
              <button onClick={onClose} style={{ marginRight: '0.5rem' }}>
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  background: '#2ecc71',
                  color: '#fff',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventFormModal;
