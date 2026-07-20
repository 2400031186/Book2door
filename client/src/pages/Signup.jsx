import { Link } from 'react-router-dom';
import { SignUp } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';

export default function Signup() {
  return (
    <PageTransition>
      <Helmet><title>Sign Up — Book2Door</title></Helmet>
      <div className="max-w-md mx-auto px-4 py-10 sm:py-12">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Create Account</h1>
          <p className="text-sm text-neutral-500">
            Optional. Guest checkout is available — no sign up required to order.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link to="/cart" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto">Checkout as Guest</Button>
          </Link>
          <Link to="/upload" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">Upload PDF</Button>
          </Link>
        </div>

        <div className="flex justify-center">
          <SignUp routing="path" path="/signup" signInUrl="/login" />
        </div>
      </div>
    </PageTransition>
  );
}
