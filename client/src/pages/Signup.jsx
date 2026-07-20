import { Link, useLocation } from 'react-router-dom';
import { SignUp } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import PageTransition from '../components/PageTransition';

export default function Signup() {
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  return (
    <PageTransition>
      <Helmet><title>Sign Up — Book2Door</title></Helmet>
      <div className="max-w-md mx-auto px-4 py-10 sm:py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Create Account</h1>
          <p className="text-sm text-neutral-500">
            Create an account to checkout and place orders on Book2Door.
          </p>
          {redirectTo === '/checkout' && (
            <p className="text-xs text-neutral-400 mt-2">
              After signing up, you&apos;ll return to checkout.
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <SignUp
            routing="path"
            path="/signup"
            signInUrl="/login"
            fallbackRedirectUrl={redirectTo}
          />
        </div>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" state={{ from: redirectTo }} className="font-medium underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </PageTransition>
  );
}
