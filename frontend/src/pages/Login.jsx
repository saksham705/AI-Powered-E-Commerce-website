import { SignIn } from '@clerk/clerk-react';

const Login = () => (
  <div className="auth-page">
    <SignIn routing="path" path="/login" signUpUrl="/register" afterSignInUrl="/" />
  </div>
);

export default Login;