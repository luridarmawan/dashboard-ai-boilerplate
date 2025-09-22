import { useState } from "react";
import { Link } from "react-router";

import Label from "../form/Label";
import Input from "../form/input/InputField";
import { useAuth } from "../../context/AuthContext";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { requestPasswordReset, isLoading: authLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email) {
      setError("Please enter your email address");
      setIsLoading(false);
      return;
    }

    try {
      const result = await requestPasswordReset(email);
      
      if (result.success) {
        setSuccess(true);
      } else {
        // Even if there's an error, we show success to prevent email enumeration
        setSuccess(true);
      }
    } catch (err) {
      console.error("Password reset request error:", err);
      // Still show success to prevent email enumeration
      setSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col flex-1">
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Password Reset Requested
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                If the email address you provided matches a registered account, we will send instructions to reset your password.
              </p>
            </div>
            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Back to Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Lost Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email to reset password!
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 whitespace-pre-line">
                    {error}
                  </div>
                )}
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    type="email"
                    placeholder="youremail@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || authLoading}
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoading || authLoading}
                  >
                    {isLoading || authLoading ? "Sending..." : "Reset Password"}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                {import.meta.env.VITE_SIGNUP_ENABLE === 'true' ? (
                  <>
                    Already have an account? {""}
                    <Link
                      to="/signin"
                      className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      Sign In
                    </Link>
                  </>
                ) : (
                  "Contact your administrator for access"
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
