"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"

interface Feature {
  name: string
  description: string
  included: boolean
}

interface PricingTier {
  name: string
  price: {
    monthly: number
    yearly: number
  }
  description: string
  features: Feature[]
  highlight?: boolean
  badge?: string
  icon: React.ReactNode
  planId: string
}

interface PricingSectionProps {
  tiers: PricingTier[]
  className?: string
  onSelectPlan: (planId: string, price: number) => void
  hideHeader?: boolean
}

function PricingSection({ tiers, className, onSelectPlan, hideHeader = false }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false)

  const buttonStyles = {
    default: cn(
      "h-12 bg-white dark:bg-zinc-900",
      "hover:bg-zinc-50 dark:hover:bg-zinc-800",
      "text-zinc-900 dark:text-zinc-100",
      "border border-zinc-200 dark:border-zinc-800",
      "hover:border-zinc-300 dark:hover:border-zinc-700",
      "shadow-sm hover:shadow-md",
      "text-sm font-medium",
    ),
    highlight: cn(
      "h-12 bg-zinc-900 dark:bg-zinc-100",
      "hover:bg-zinc-800 dark:hover:bg-zinc-300",
      "text-white dark:text-zinc-900",
      "shadow-[0_1px_15px_rgba(0,0,0,0.1)]",
      "hover:shadow-[0_1px_20px_rgba(0,0,0,0.15)]",
      "font-semibold text-base",
    ),
  }

  const badgeStyles = cn(
    "px-4 py-1.5 text-sm font-medium",
    "bg-zinc-900 dark:bg-zinc-100",
    "text-white dark:text-zinc-900",
    "border-none shadow-lg",
  )

  const renderPricingCard = (tier: PricingTier, isYearly: boolean, onSelectPlan: (planId: string, price: number) => void, badgeStyles: string) => (
    <div
      className={cn(
        "relative group backdrop-blur-sm",
        "rounded-3xl transition-all duration-300",
        "flex flex-col",
        tier.highlight
          ? "bg-white dark:bg-zinc-800/90"
          : "bg-white dark:bg-zinc-800/50",
        "border",
        tier.highlight
          ? "border-zinc-400/50 dark:border-zinc-400/20 shadow-xl"
          : "border-zinc-200 dark:border-zinc-700 shadow-md",
        "hover:translate-y-0 hover:shadow-lg",
      )}
    >
      {tier.badge && tier.highlight && (
        <div className="absolute -top-4 left-6">
          <Badge className={badgeStyles}>{tier.badge}</Badge>
        </div>
      )}

      <div className="p-6 md:p-8 flex-1">
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              "p-3 rounded-xl",
              tier.highlight
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
            )}
          >
            {tier.icon}
          </div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {tier.name}
          </h3>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
              ${isYearly ? tier.price.yearly : tier.price.monthly}
            </span>
            <span className="text-sm text-zinc-900 dark:text-zinc-100">
              /{isYearly ? "year" : "month"}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-900 dark:text-zinc-100">
            {tier.description}
          </p>
        </div>

        <div className="space-y-4">
          {tier.features.map((feature) => (
            <div key={feature.name} className="flex gap-4">
              <div
                className={cn(
                  "mt-1 p-0.5 rounded-full transition-colors duration-200",
                  feature.included
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-400 dark:text-zinc-600",
                )}
              >
                <CheckIcon className="w-4 h-4" />
              </div>
              <div>
                <div className={cn(
                  "text-sm font-medium",
                  feature.included 
                    ? "text-zinc-900 dark:text-zinc-100" 
                    : "text-zinc-900 dark:text-zinc-100"
                )}>
                  {feature.name}
                </div>
                <div className={cn(
                  "text-sm",
                  feature.included 
                    ? "text-zinc-700 dark:text-zinc-200" 
                    : "text-zinc-600 dark:text-zinc-300"
                )}>
                  {feature.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-8 pt-0 mt-auto">
        <Button
          onClick={() => onSelectPlan(tier.planId, isYearly ? tier.price.yearly : tier.price.monthly)}
          className={cn(
            "w-full relative transition-all duration-300",
            tier.highlight
              ? buttonStyles.highlight
              : buttonStyles.default,
          )}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {tier.price.monthly === 0 ? (
              <>
                Get Started Free
                <ArrowRightIcon className="w-4 h-4" />
              </>
            ) : tier.highlight ? (
              <>
                Upgrade Now
                <ArrowRightIcon className="w-4 h-4" />
              </>
            ) : (
              <>
                Choose Plan
                <ArrowRightIcon className="w-4 h-4" />
              </>
            )}
          </span>
        </Button>
      </div>
    </div>
  )

  return (
    <section
      className={cn(
        "relative bg-background text-foreground",
        "py-12 px-4 md:py-24 lg:py-32",
        "overflow-hidden",
        className,
      )}
    >
      <div className="w-full max-w-5xl mx-auto">
        {!hideHeader && (
          <div className="flex flex-col items-center gap-4 mb-12">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Choose Your Student Plan
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 text-center max-w-2xl">
              Unlock premium features and accelerate your career journey with the right plan for you
            </p>
          </div>
        )}
        
        <div className="flex justify-center mb-4 md:mb-6">
          <div className="inline-flex items-center p-1.5 bg-white dark:bg-zinc-800/50 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm">
            {["Monthly", "Yearly"].map((period) => (
              <button
                key={period}
                onClick={() => setIsYearly(period === "Yearly")}
                className={cn(
                  "px-6 md:px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                  (period === "Yearly") === isYearly
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100",
                )}
              >
                {period}
                {period === "Yearly" && (
                  <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                    Save 20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: Horizontal scroll, Desktop: Grid */}
        <div className="md:hidden">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className="flex-none w-80 snap-center"
              >
                {renderPricingCard(tier, isYearly, onSelectPlan, badgeStyles)}
              </div>
            ))}
          </div>
        </div>
        
        <div className="hidden md:grid grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div key={tier.name}>
              {renderPricingCard(tier, isYearly, onSelectPlan, badgeStyles)}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { PricingSection } 