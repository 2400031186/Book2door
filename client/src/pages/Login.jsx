import { Link, useLocation } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import PageTransition from '../components/PageTransition';

export default function Login() {
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  return (
    <PageTransition>
      <Helmet><title>Sign In — Book2Door</title></Helmet>
      <div className="max-w-md mx-auto px-4 py-10 sm:py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Sign In</h1>
          <p className="text-sm text-neutral-500">
            Sign in is required to checkout and place orders.
          </p>
          {redirectTo === '/checkout' && (
            <p className="text-xs text-neutral-400 mt-2">
              After signing in, you&apos;ll return to checkout.
            </p>
          )}
        </div>

        <div className="flex justify-center">
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/signup"
            fallbackRedirectUrl={redirectTo}
          />
        </div>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/signup" state={{ from: redirectTo }} className="font-medium underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </div>
    </PageTransition>
  );
}
