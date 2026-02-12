'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="card-elegant p-8 rounded-2xl">
            {submitted ? (
              <>
                {/* Success State */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <h1 className="font-playfair text-2xl font-bold text-foreground mb-2">Check Your Email</h1>
                  <p className="text-muted-foreground mb-6">
                    We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    The link will expire in 24 hours. If you don't see the email, check your spam folder.
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSubmitted(false)}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors mb-4"
                  >
                    Back to Login
                  </motion.button>

                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email?{' '}
                    <button
                      onClick={() => setSubmitted(false)}
                      className="text-primary font-semibold hover:underline"
                    >
                      Try again
                    </button>
                  </p>
                </motion.div>
              </>
            ) : (
              <>
                {/* Initial Form State */}
                <div className="mb-8">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-primary hover:underline mb-4"
                  >
                    <ArrowLeft size={18} />
                    Back to login
                  </Link>
                  <h1 className="font-playfair text-3xl font-bold text-foreground mb-2">Reset Password</h1>
                  <p className="text-muted-foreground">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Input */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                      <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder-muted-foreground"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Make sure this is the email address associated with your StayNature account.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </motion.button>

                  {/* Alternative Actions */}
                  <div className="pt-4 border-t border-border">
                    <p className="text-center text-sm text-muted-foreground mb-4">
                      Remember your password?
                    </p>
                    <Link
                      href="/auth/login"
                      className="block text-center py-3 border border-border rounded-lg font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      Sign In
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Help Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 bg-secondary rounded-lg text-center"
          >
            <p className="text-sm text-muted-foreground">
              Need help?{' '}
              <Link href="mailto:support@staynature.com" className="text-primary hover:underline font-semibold">
                Contact our support team
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
