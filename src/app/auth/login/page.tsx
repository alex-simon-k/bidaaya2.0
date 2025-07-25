"use client";

import React, { useRef, useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Rocket, Building2, Users, MapPin } from "lucide-react";

// Custom Button Component with better mobile sizing
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
  const baseStyles = "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-xl text-base font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[56px] px-6";
  
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
      start: { x: 0.6, y: 0.55, delay: 0 }, // UAE (using ratios)
      end: { x: 0.45, y: 0.4, delay: 2 }, // Saudi Arabia
      color: "#059669", // Emerald
    },
    {
      start: { x: 0.45, y: 0.4, delay: 2 }, // Saudi Arabia
      end: { x: 0.3, y: 0.25, delay: 4 }, // Egypt
      color: "#7c3aed", // Purple
    },
    {
      start: { x: 0.7, y: 0.6, delay: 1 }, // Qatar
      end: { x: 0.55, y: 0.35, delay: 3 }, // Jordan
      color: "#059669",
    },
    {
      start: { x: 0.2, y: 0.45, delay: 0.5 }, // Morocco
      end: { x: 0.65, y: 0.5, delay: 2.5 }, // Kuwait
      color: "#7c3aed",
    },
  ];

  // Generate dots for MENA region map
  const generateDots = (width: number, height: number) => {
    const dots = [];
    const gap = Math.max(12, width / 30); // Responsive gap
    const dotRadius = Math.max(1, width / 200);

    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        // Shape dots to form MENA region (using relative positions)
        const relX = x / width;
        const relY = y / height;
        
        const isInMenaRegion =
          // Gulf region
          ((relX < 0.8 && relX > 0.4) && (relY < 0.7 && relY > 0.3)) ||
          // North Africa
          ((relX < 0.4 && relX > 0.1) && (relY < 0.5 && relY > 0.2)) ||
          // Levant
          ((relX < 0.6 && relX > 0.35) && (relY < 0.4 && relY > 0.15));

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

    const updateDimensions = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
      const width = Math.min(container.clientWidth, 320);
      const height = Math.min(width * 0.6, 180);
      
      canvas.width = width;
      canvas.height = height;
      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
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
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${dot.opacity})`;
        ctx.fill();
      });
    }

    function drawRoutes() {
      if (!ctx) return;
      const currentTime = (Date.now() - startTime) / 1000;
      
      routes.forEach(route => {
        if (!ctx) return;
        const elapsed = currentTime - route.start.delay;
        if (elapsed <= 0) return;
        
        const duration = 3;
        const progress = Math.min(elapsed / duration, 1);
        
        // Convert relative positions to actual positions
        const startX = route.start.x * dimensions.width;
        const startY = route.start.y * dimensions.height;
        const endX = route.end.x * dimensions.width;
        const endY = route.end.y * dimensions.height;
        
        const x = startX + (endX - startX) * progress;
        const y = startY + (endY - startY) * progress;
        
        // Draw route line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = route.color;
        ctx.lineWidth = Math.max(1, dimensions.width / 160);
        ctx.stroke();
        
        // Draw points
        const pointRadius = Math.max(2, dimensions.width / 100);
        ctx.beginPath();
        ctx.arc(startX, startY, pointRadius, 0, Math.PI * 2);
        ctx.fillStyle = route.color;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, pointRadius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "#10b981";
        ctx.fill();
        
        // Glow effect
        ctx.beginPath();
        ctx.arc(x, y, pointRadius * 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(16, 185, 129, 0.3)";
        ctx.fill();
        
        if (progress === 1) {
          ctx.beginPath();
          ctx.arc(endX, endY, pointRadius, 0, Math.PI * 2);
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
    <div className="w-full max-w-xs mx-auto mb-4">
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-lg opacity-60"
        style={{ maxHeight: '180px' }}
      />
    </div>
  );
};

function LoginPageContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isStudentHovered, setIsStudentHovered] = useState(false);
  const [isCompanyHovered, setIsCompanyHovered] = useState(false);

  const handleGoogleSignIn = async (role: 'STUDENT' | 'ENTERPRISE') => {
    setIsLoading(true);
    try {
      await signIn('google', {
        callbackUrl: '/auth/role-selection',
        role: role,
      });
    } catch (error) {
      console.error('Sign in failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-200/30 to-indigo-200/30 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col min-h-screen"
      >
        {/* Header with reduced top padding */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-4">
          <div className="w-full max-w-md mx-auto">
            {/* Logo and Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mb-8"
            >
              {/* Animated Map */}
              <div className="mb-4">
                <BidaayaMap />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                Welcome to Bidaaya
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Choose your path to get started
              </p>
            </motion.div>

            {/* Students Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-6"
            >
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <Users className="text-white h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">For Students</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Find internships and career opportunities
                    </p>
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
                    className="w-full relative overflow-hidden"
                    onClick={() => handleGoogleSignIn('STUDENT')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fillOpacity=".8"
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
                        <span className="text-center">Continue with Google as Student</span>
                        {isStudentHovered && (
                          <motion.span
                            initial={{ left: "-100%" }}
                            animate={{ left: "100%" }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                            className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            style={{ filter: "blur(8px)" }}
                          />
                        )}
                      </>
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
                <span className="px-4 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 text-gray-500 font-medium">or</span>
              </div>
            </div>
            
            {/* Companies Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100 shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Building2 className="text-white h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">For Companies</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Post opportunities and find talent
                    </p>
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
                    className="w-full relative overflow-hidden"
                    onClick={() => handleGoogleSignIn('ENTERPRISE')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fillOpacity=".8"
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
                        <span className="text-center">Continue with Google as Company</span>
                        {isCompanyHovered && (
                          <motion.span
                            initial={{ left: "-100%" }}
                            animate={{ left: "100%" }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                            className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            style={{ filter: "blur(8px)" }}
                          />
                        )}
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Footer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-center"
            >
              <p className="text-xs text-gray-500 leading-relaxed px-4">
                By continuing, you agree to our{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium underline">
                  Privacy Policy
                </a>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
} 