import { Link } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';

export default function Login() {
  return (
    <PageTransition>
      <Helmet><title>Sign In — Book2Door</title></Helmet>
      <div className="max-w-md mx-auto px-4 py-10 sm:py-12">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Sign In</h1>
          <p className="text-sm text-neutral-500">
            Optional. You can browse, checkout, and track orders without an account.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link to="/cart" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto">Continue to Cart</Button>
          </Link>
          <Link to="/books" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">Browse Books</Button>
          </Link>
        </div>

        <div className="flex justify-center">
          <SignIn routing="path" path="/login" signUpUrl="/signup" />
        </div>
      </div>
    </PageTransition>
  );
}
