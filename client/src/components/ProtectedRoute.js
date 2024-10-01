import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from 'supertokens-auth-react/recipe/session';

const ProtectedRoute = ({ children }) => {
  const session = useSessionContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (session.loading === false) {
      if (!session.doesSessionExist) {
        navigate('/auth');
      }
    }
  }, [session, navigate]);

  if (session.loading) {
    return null; // or a loading spinner
  }

  return session.doesSessionExist ? children : null;
};

export default ProtectedRoute;