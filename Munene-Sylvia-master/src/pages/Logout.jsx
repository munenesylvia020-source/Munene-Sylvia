import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/api';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await auth.logout();
      } catch (error) {
        console.error('Logout failed:', error);
      } finally {
        navigate('/login', { replace: true });
      }
    };

    doLogout();
  }, [navigate]);

  return (
    <div className="logout-screen">
      <p>Logging out...</p>
    </div>
  );
};

export default Logout;
