import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function GoogleSignUpFail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reason = params.get("reason");

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign up failed</h1>
        <p className="text-gray-600 mb-6">
          {reason === "domain"
            ? "Sign up failed. Only enter your university cloud IDs."
            : "Something went wrong during sign up."}
        </p>
        <Button className="w-full" onClick={() => navigate("/")}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
