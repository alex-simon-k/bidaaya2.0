"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Rocket, Building2, Users, MapPin } from "lucide-react";

// Helper function to merge class names
const cn = (...classes: string[]) => {
  return classes.filter(Boolean).join(" ");
};

// Custom Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "outline" | "student" | "company";
  className?: string;
}

const Button = ({ 
  children, 
  variant = "default", 
  className = "", 
  ...props 
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variantStyles = {
    default: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 focus-visible:ring-blue-500",
    outline: "border border-gray-200 bg-white hover:bg-gray-50 text-gray-700",
    student: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 focus-visible:ring-emerald-500 shadow-lg shadow-emerald-200",
    company: "bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 focus-visible:ring-purple-500 shadow-lg shadow-purple-200"
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

type RoutePoint = {
  x: number;
  y: number;
  delay: number;
};

const BidaayaMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // MENA region focused routes
  const routes: { start: RoutePoint; end: RoutePoint; color: string }[] = [
    {
      start: { x: 150, y: 100, delay: 0 }, // UAE
      end: { x: 120, y: 80, delay: 2 }, // Saudi Arabia
      color: "#059669", // Emerald
    },
    {
      start: { x: 120, y: 80, delay: 2 }, // Saudi Arabia
      end: { x: 100, y: 60, delay: 4 }, // Egypt
      color: "#7c3aed", // Purple
    },
    {
      start: { x: 180, y: 120, delay: 1 }, // Qatar
      end: { x: 200, y: 140, delay: 3 }, // Jordan
      color: "#059669",
    },
    {
      start: { x: 90, y: 90, delay: 0.5 }, // Morocco
      end: { x: 160, y: 110, delay: 2.5 }, // Kuwait
      color: "#7c3aed",
    },
  ];

  // Generate dots for MENA region map
  const generateDots = (width: number, height: number) => {
    const dots = [];
    const gap = 15;
    const dotRadius = 1.5;

    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        // Shape dots to form MENA region
        const isInMenaRegion =
          // Gulf region
          ((x < width * 0.7 && x > width * 0.4) && (y < height * 0.6 && y > height * 0.3)) ||
          // North Africa
          ((x < width * 0.4 && x > width * 0.1) && (y < height * 0.5 && y > height * 0.2)) ||
          // Levant
          ((x < width * 0.5 && x > width * 0.35) && (y < height * 0.4 && y > height * 0.15));

        if (isInMenaRegion && Math.random() > 0.4) {
          dots.push({
            x,
            y,
            radius: dotRadius,
            opacity: Math.random() * 0.6 + 0.3,
          });
        }
      }
    }
    return dots;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;
    });

    resizeObserver.observe(canvas.parentElement as Element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dots = generateDots(dimensions.width, dimensions.height);
    let animationFrameId: number;
    let startTime = Date.now();

    function drawDots() {
      if (!ctx) return;
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${dot.opacity})`;
        ctx.fill();
      });
    }

    function drawRoutes() {
      const currentTime = (Date.now() - startTime) / 1000;
      
      routes.forEach(route => {
        const elapsed = currentTime - route.start.delay;
        if (elapsed <= 0) return;
        
        const duration = 3;
        const progress = Math.min(elapsed / duration, 1);
        
        const x = route.start.x + (route.end.x - route.start.x) * progress;
        const y = route.start.y + (route.end.y - route.start.y) * progress;
        
        // Draw route line
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(route.start.x, route.start.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = route.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw points
        ctx.beginPath();
        ctx.arc(route.start.x, route.start.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = route.color;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#10b981";
        ctx.fill();
        
        // Glow effect
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(16, 185, 129, 0.3)";
        ctx.fill();
        
        if (progress === 1) {
          ctx.beginPath();
          ctx.arc(route.end.x, route.end.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = route.color;
          ctx.fill();
        }
      });
    }
    
    function animate() {
      drawDots();
      drawRoutes();
      
      const currentTime = (Date.now() - startTime) / 1000;
      if (currentTime > 12) {
        startTime = Date.now();
      }
      
      animationFrameId = requestAnimationFrame(animate);
    }
    
    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

const BidaayaSignIn = () => {
  const router = useRouter();
  const [isStudentHovered, setIsStudentHovered] = useState(false);
  const [isCompanyHovered, setIsCompanyHovered] = useState(false);

  const handleGoogleSignIn = async (role: 'STUDENT' | 'COMPANY') => {
    try {
      const roleParam = role === 'COMPANY' ? 'ENTERPRISE' : 'STUDENT';
      
      await signIn('google', {
        callbackUrl: `/auth/role-selection?intended=${roleParam}`
      });
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-5xl overflow-hidden rounded-3xl flex bg-white shadow-2xl"
      >
        {/* Left side - Bidaaya Branding */}
        <div className="hidden lg:block w-2/5 h-[700px] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-blue-100 to-purple-100">
            <BidaayaMap />
            
            {/* Logo and branding overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
              <motion.div 
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="mb-8"
              >
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-xl shadow-emerald-200">
                  <Rocket className="text-white h-8 w-8" />
                </div>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="text-4xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600"
              >
                Bidaaya
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.6 }}
                className="text-lg text-center text-gray-600 max-w-sm leading-relaxed"
              >
                Connecting talent with opportunities across the MENA region
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                className="mt-8 flex items-center gap-4 text-sm text-gray-500"
              >
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>MENA Region</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Growing Community</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Right side - Sign In Options */}
        <div className="w-full lg:w-3/5 p-8 lg:p-12 flex flex-col justify-center bg-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl lg:text-4xl font-bold mb-3 text-gray-800">
                Welcome to Bidaaya
              </h2>
              <p className="text-gray-600 text-lg">
                Choose your path to get started
              </p>
            </div>
            
            {/* Students Section */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Users className="text-white h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">For Students</h3>
                    <p className="text-sm text-gray-600">Find internships and career opportunities</p>
                  </div>
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={() => setIsStudentHovered(true)}
                  onHoverEnd={() => setIsStudentHovered(false)}
                >
                  <Button
                    variant="student"
                    className="w-full py-4 text-base relative overflow-hidden"
                    onClick={() => handleGoogleSignIn('STUDENT')}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fillOpacity=".7"
                      />
                      <path
                        fill="white"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="white"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="white"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google as Student
                    {isStudentHovered && (
                      <motion.span
                        initial={{ left: "-100%" }}
                        animate={{ left: "100%" }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        style={{ filter: "blur(8px)" }}
                      />
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">or</span>
              </div>
            </div>
            
            {/* Companies Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                    <Building2 className="text-white h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">For Companies</h3>
                    <p className="text-sm text-gray-600">Post opportunities and find talent</p>
                  </div>
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={() => setIsCompanyHovered(true)}
                  onHoverEnd={() => setIsCompanyHovered(false)}
                >
                  <Button
                    variant="company"
                    className="w-full py-4 text-base relative overflow-hidden"
                    onClick={() => handleGoogleSignIn('COMPANY')}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fillOpacity=".7"
                      />
                      <path
                        fill="white"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="white"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="white"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google as Company
                    {isCompanyHovered && (
                      <motion.span
                        initial={{ left: "-100%" }}
                        animate={{ left: "100%" }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        style={{ filter: "blur(8px)" }}
                      />
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="text-center mt-8"
            >
              <p className="text-sm text-gray-500">
                By continuing, you agree to our{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Privacy Policy
                </a>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default BidaayaSignIn; 