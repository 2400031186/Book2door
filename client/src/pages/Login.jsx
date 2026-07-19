import { SignIn } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import PageTransition from '../components/PageTransition';

export default function Login() {
  return (
    <PageTransition>
      <Helmet><title>Sign In — Book2Door</title></Helmet>
      <div className="flex justify-center py-12 px-4">
        <SignIn routing="path" path="/login" signUpUrl="/signup" />
      </div>
    </PageTransition>
  );
}
