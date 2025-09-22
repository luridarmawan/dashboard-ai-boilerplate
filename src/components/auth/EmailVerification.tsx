import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
// import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;

export default function EmailVerification() {
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  // const { login } = useAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get("token");
        
        if (!token) {
          setMessage("Invalid verification link");
          setIsSuccess(false);
          setIsLoading(false);
          return;
        }

        // Call the backend verification endpoint
        const response = await fetch(`${API_BASE_URL}/auth/verify-email?token=${token}`);
        const data = await response.json();
        
        if (data.success) {
          setMessage(data.message);
          setIsSuccess(true);
        } else {
          setMessage(data.message);
          setIsSuccess(false);
        }
      } catch (error) {
        console.error("Verification error:", error);
        setMessage("An error occurred during verification. Please try again.");
        setIsSuccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [location.search]);

  const handleLoginRedirect = () => {
    navigate("/signin");
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Email Verification
            </h1>
          </div>
          <div>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
              </div>
            ) : (
              <div className={`p-4 rounded-lg ${isSuccess ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <p className={`text-center ${isSuccess ? "text-green-700" : "text-red-700"}`}>
                  {message}
                </p>
                {isSuccess && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={handleLoginRedirect}
                      className="px-4 py-2 text-white bg-brand-500 rounded hover:bg-brand-600"
                    >
                      Go to Login
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}