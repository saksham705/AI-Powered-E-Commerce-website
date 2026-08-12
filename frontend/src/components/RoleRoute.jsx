import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { useCurrentUser } from '../context/UserContext.jsx';

const RoleRoute = ({ roles = [], children }) => {
  const { profile, loading } = useCurrentUser();

  return (
    <>
      <SignedIn>
        {loading ? (
          <p className="status-text">Checking access...</p>
        ) : profile && roles.includes(profile.role) ? (
          children
        ) : (
          <p className="status-text error">You don't have access to this page.</p>
        )}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

export default RoleRoute;