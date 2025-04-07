import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [message, setMessage] = useState("Processing invitation...");

  useEffect(() => {
    const accept = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/accept-invite?token=${token}`);
        setMessage(res.data.message);
      } catch (err: any) {
        setMessage(err?.response?.data?.message || "Invite failed. Try again.");
      }
    };

    if (token) {
      accept();
    } else {
      setMessage("Missing invite token.");
    }
  }, [token]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center', fontSize: '18px' }}>
      <h2>{message}</h2>
    </div>
  );
};

export default AcceptInvite;
