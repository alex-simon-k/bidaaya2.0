'use client'

import { useState, useRef, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, School, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InstitutionLandingProps {
  slug: string
  institutionName: string
  institutionShortName: string
  institutionType: 'university' | 'school' | 'mixed'
  logoUrl?: string
  onEnter: () => void
}

interface GraphPreview {
  id: string
  image: string
  title: string
}

export function InstitutionLanding({
  slug,
  institutionName,
  institutionShortName,
  institutionType,
  logoUrl,
  onEnter
}: InstitutionLandingProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  // Placeholder graph previews - user will replace with actual images
  // These should be paths to actual graph preview images you create
  const graphPreviews: GraphPreview[] = [
    {
      id: '1',
      image: '/images/graph-previews/student-analytics.png', // Replace with actual graph image path
      title: 'Student Analytics'
    },
    {
      id: '2',
      image: '/images/graph-previews/application-trends.png', // Replace with actual graph image path
      title: 'Application Trends'
    },
    {
      id: '3',
      image: '/images/graph-previews/skills-distribution.png', // Replace with actual graph image path
      title: 'Skills Distribution'
    }
  ]

  const handleGraphClick = (graph: GraphPreview, index: number) => {
    const cardEl = cardRefs.current[index]
    if (cardEl) {
      setSelectedIndex(index)
      // After animation, navigate to dashboard
      setTimeout(() => {
        onEnter()
      }, 300)
    }
  }

  const handleEnterClick = () => {
    onEnter()
  }

  return (
    <div className="min-h-screen bg-bidaaya-dark flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Main Institution Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={cn(
            "relative flex flex-col items-center justify-center",
            "p-12 rounded-2xl cursor-pointer",
            "glass-panel border border-slate-800",
            "transition-all duration-500 ease-out",
            "hover:shadow-2xl hover:shadow-bidaaya-accent/10",
            "hover:border-bidaaya-accent/30",
            "group"
          )}
          style={{
            minWidth: "320px",
            minHeight: "400px",
            perspective: "1000px",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Subtle background glow on hover */}
          <div
            className="absolute inset-0 rounded-2xl transition-opacity duration-500"
            style={{
              background: "radial-gradient(circle at 50% 70%, hsl(var(--bidaaya-accent)) 0%, transparent 70%)",
              opacity: isHovered ? 0.08 : 0,
            }}
          />

          {/* Institution Logo/Icon Container */}
          <div className="relative flex items-center justify-center mb-6" style={{ height: "180px", width: "240px" }}>
            {/* Back layer - like folder back */}
            <div
              className="absolute w-40 h-32 bg-slate-800 rounded-lg shadow-md border border-slate-700"
              style={{
                transformOrigin: "bottom center",
                transform: isHovered ? "rotateX(-15deg)" : "rotateX(0deg)",
                transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                zIndex: 10,
              }}
            />

            {/* Tab - like folder tab */}
            <div
              className="absolute w-16 h-5 bg-slate-700 rounded-t-md border border-slate-600"
              style={{
                top: "calc(50% - 64px - 16px)",
                left: "calc(50% - 80px + 20px)",
                transformOrigin: "bottom center",
                transform: isHovered ? "rotateX(-25deg) translateY(-2px)" : "rotateX(0deg)",
                transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                zIndex: 10,
              }}
            />

            {/* Graph Preview Cards - appear on hover */}
            <div
              className="absolute"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 20,
              }}
            >
              {graphPreviews.map((graph, index) => (
                <GraphPreviewCard
                  key={graph.id}
                  ref={(el) => {
                    cardRefs.current[index] = el
                  }}
                  image={graph.image}
                  title={graph.title}
                  delay={index * 80}
                  isVisible={isHovered}
                  index={index}
                  onClick={() => handleGraphClick(graph, index)}
                />
              ))}
            </div>

            {/* Front layer - contains logo/name */}
            <div
              className="absolute w-40 h-32 bg-slate-900 rounded-lg shadow-lg border border-slate-700 flex flex-col items-center justify-center p-4"
              style={{
                top: "calc(50% - 64px + 4px)",
                transformOrigin: "bottom center",
                transform: isHovered ? "rotateX(25deg) translateY(8px)" : "rotateX(0deg)",
                transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                zIndex: 30,
              }}
            >
              {/* Logo or Icon */}
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={institutionName}
                  className="w-16 h-16 object-contain mb-2"
                />
              ) : (
                <div className="mb-2">
                  {institutionType === 'university' ? (
                    <GraduationCap className="w-16 h-16 text-bidaaya-accent" />
                  ) : (
                    <School className="w-16 h-16 text-bidaaya-accent" />
                  )}
                </div>
              )}
              
              {/* Institution Name */}
              <h2 className="text-sm font-bold text-white text-center leading-tight">
                {institutionShortName}
              </h2>
            </div>

            {/* Shine effect */}
            <div
              className="absolute w-40 h-32 rounded-lg overflow-hidden pointer-events-none"
              style={{
                top: "calc(50% - 64px + 4px)",
                background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
                transformOrigin: "bottom center",
                transform: isHovered ? "rotateX(25deg) translateY(8px)" : "rotateX(0deg)",
                transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                zIndex: 31,
              }}
            />
          </div>

          {/* Institution Title */}
          <h3
            className="text-2xl font-bold text-white mt-6 transition-all duration-300 text-center"
            style={{
              transform: isHovered ? "translateY(4px)" : "translateY(0)",
            }}
          >
            {institutionName}
          </h3>

          {/* Institution Type Badge */}
          <span
            className="px-4 py-1.5 mt-2 bg-bidaaya-accent/20 text-bidaaya-accent text-sm rounded-full font-medium transition-all duration-300"
            style={{
              opacity: isHovered ? 0.8 : 1,
            }}
          >
            {institutionType === 'university' ? 'University' : institutionType === 'school' ? 'School' : 'Institution'}
          </span>

          {/* Hover hint */}
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-slate-400 transition-all duration-300"
            style={{
              opacity: isHovered ? 0 : 0.7,
              transform: isHovered ? "translateY(10px)" : "translateY(0)",
            }}
          >
            <span>Hover to preview</span>
          </div>

          {/* Enter Button - appears on hover */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : 10,
            }}
            transition={{ duration: 0.3 }}
            onClick={handleEnterClick}
            className={cn(
              "absolute bottom-6 left-1/2 -translate-x-1/2",
              "flex items-center gap-2 px-6 py-3",
              "bg-bidaaya-accent text-bidaaya-dark",
              "rounded-lg font-medium",
              "hover:bg-bidaaya-accent/90",
              "transition-all duration-200",
              "shadow-lg shadow-bidaaya-accent/20"
            )}
            style={{
              pointerEvents: isHovered ? 'auto' : 'none',
            }}
          >
            <span>Enter Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

interface GraphPreviewCardProps {
  image: string
  title: string
  delay: number
  isVisible: boolean
  index: number
  onClick: () => void
}

const GraphPreviewCard = forwardRef<HTMLDivElement, GraphPreviewCardProps>(
  ({ image, title, delay, isVisible, index, onClick }, ref) => {
    const rotations = [-12, 0, 12]
    const translations = [-70, 0, 70]

    return (
      <div
        ref={ref}
        className={cn(
          "absolute w-24 h-32 rounded-lg overflow-hidden shadow-xl",
          "bg-slate-800 border border-slate-700",
          "cursor-pointer hover:ring-2 hover:ring-bidaaya-accent/50",
          "hover:scale-105 transition-transform duration-200"
        )}
        style={{
          transform: isVisible
            ? `translateY(-100px) translateX(${translations[index]}px) rotate(${rotations[index]}deg) scale(1)`
            : "translateY(0px) translateX(0px) rotate(0deg) scale(0.5)",
          opacity: isVisible ? 1 : 0,
          transition: `all 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
          zIndex: 10 - index,
          left: "-48px",
          top: "-64px",
        }}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
      >
        {/* Image or gradient fallback */}
        {image && !image.includes('placeholder') ? (
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-bidaaya-accent/20 via-purple-500/20 to-pink-500/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
        <p className="absolute bottom-2 left-2 right-2 text-[10px] font-medium text-white truncate">
          {title}
        </p>
      </div>
    )
  }
)

GraphPreviewCard.displayName = "GraphPreviewCard"
