import { SignIn, SignUp } from "@clerk/clerk-react";
import { useState } from "react";

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
        {isSignIn ? 
          <SignIn afterSignInUrl="/" /> : 
          <SignUp afterSignUpUrl="/" />
        }

        <button
          onClick={() => setIsSignIn(!isSignIn)}
          className="mt-4 text-blue-600 underline"
        >
          {isSignIn ? "Need an account? Sign Up" : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  );
}
