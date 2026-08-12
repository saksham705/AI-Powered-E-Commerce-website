import { SignUp } from '@clerk/clerk-react';

const Register = () => (
  <div className="auth-page">
    <SignUp routing="path" path="/register" signInUrl="/login" afterSignUpUrl="/" />
  </div>
);

export default Register;