import LoginForm from "@/components/LoginForm";
import Illustration from "@/assets/illustrations.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden">
      {/* Background curved wave (keeps the blue wave behind the right card) */}
      <div className="absolute inset-0 pointer-events-none">
  <svg
    viewBox="0 0 1440 800"
    className="absolute inset-0 w-full h-full"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D6EBFF" />   {/* very light sky blue */}
        <stop offset="50%" stopColor="#99CCFF" /> {/* light blue */}
        <stop offset="100%" stopColor="#376088ff" /> {/* medium blue */}
      </linearGradient>
    </defs>

    {/* Slanty sea-like wave with 2 curves */}
    <path

  d="
    M4000,-2000
    C1000,100 900,250 1000,180
    C1000,220 1000,250 650,1000
    L1440,800 L1440,0 Z"
  fill="url(#bg-gradient)"
/>


  </svg>
</div>


      <div className="min-h-screen grid lg:grid-cols-2 relative z-10">
        {/* Left Side - Hero Section (desktop only) */}
        <div className="hidden lg:block relative px-20 py-20">
          {/* Title + Tagline */}
          <div className="max-w-md">
            <h1 className="text-6xl font-extrabold text-blue-600 leading-tight mb-4">
              Intern
              <br />
              Management
              <br />
              Portal
            </h1>
            <p className="text-lg text-gray-800 max-w-sm font-normal italic">
              Streamline attendance, tasks, and reporting in one place.
            </p>
          </div>

          {/* Illustration anchored bottom-left */}
          <img
  src={Illustration}
  alt="Intern Management Illustration"
  className="absolute bottom-0 left-10 ml-6 w-[500px] max-w-[50%] object-contain select-none pointer-events-none"
/>

        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* KEEP LoginForm unchanged — it already renders the white card */}
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
