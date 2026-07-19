import { SignUp } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import PageTransition from '../components/PageTransition';

export default function Signup() {
  return (
    <PageTransition>
      <Helmet><title>Sign Up — Book2Door</title></Helmet>
      <div className="flex justify-center py-12 px-4">
        <SignUp routing="path" path="/signup" signInUrl="/login" />
      </div>
    </PageTransition>
  );
}
