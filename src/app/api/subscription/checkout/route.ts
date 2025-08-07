import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/auth-config"
import { headers } from 'next/headers'

// Stripe configuration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

// Stripe Price IDs - Now using environment variables!
const STRIPE_PRICES = {
  // Student Plans - Monthly
  student_premium_monthly: process.env.STRIPE_STUDENT_PREMIUM_MONTHLY || 'price_1Rf2hTRoORqpPhxpGi4zduqM',
  student_pro_monthly: process.env.STRIPE_STUDENT_PRO_MONTHLY || 'price_1Rf2jHRoORqpPhxpzUMN5sNM',
  
  // Student Plans - Yearly
  student_premium_yearly: process.env.STRIPE_STUDENT_PREMIUM_YEARLY || 'price_1Rf2hTRoORqpPhxpIeLvOIYB',
  student_pro_yearly: process.env.STRIPE_STUDENT_PRO_YEARLY || 'price_1Rf2jrRoORqpPhxpMOVmksOY',
  
  // Company Plans - Monthly  
  company_basic_monthly: process.env.STRIPE_COMPANY_BASIC_MONTHLY || 'price_1RoSM6RoORqpPhxproAI4FEc',
  company_hr_booster_monthly: process.env.STRIPE_COMPANY_PREMIUM_MONTHLY || 'price_1RoSMwRoORqpPhxpmUpAZUza',
  company_hr_agent_monthly: process.env.STRIPE_COMPANY_PRO_MONTHLY || 'price_1RoSRBRoORqpPhxpXXaZSwJ8',
  
  // Company Plans - Yearly
  company_basic_yearly: process.env.STRIPE_COMPANY_BASIC_YEARLY || 'price_1RoSM6RoORqpPhxpqIfJ2rqY',
  company_hr_booster_yearly: process.env.STRIPE_COMPANY_PREMIUM_YEARLY || 'price_1RoSPLRoORqpPhxpyJZJM9iK',
  company_hr_agent_yearly: process.env.STRIPE_COMPANY_PRO_YEARLY || 'price_1RoSRXRoORqpPhxpPpjy7RJQ',
} as const

// Updated pricing to match documented prices: $5/$15 for students
const PLAN_METADATA = {
  student_premium_monthly: { amount: 500, currency: 'usd', interval: 'month', name: 'Student Premium' }, // $5
  student_pro_monthly: { amount: 1500, currency: 'usd', interval: 'month', name: 'Student Pro' }, // $15
  student_premium_yearly: { amount: 4800, currency: 'usd', interval: 'year', name: 'Student Premium' }, // $48 (20% off)
  student_pro_yearly: { amount: 14400, currency: 'usd', interval: 'year', name: 'Student Pro' }, // $144 (20% off)
  company_basic_monthly: { amount: 2000, currency: 'gbp', interval: 'month', name: 'Company Basic' }, // £20
  company_hr_booster_monthly: { amount: 7500, currency: 'gbp', interval: 'month', name: 'HR Booster' }, // £75
  company_hr_agent_monthly: { amount: 17500, currency: 'gbp', interval: 'month', name: 'HR Agent' }, // £175
  company_basic_yearly: { amount: 19999, currency: 'gbp', interval: 'year', name: 'Company Basic' }, // £199.99
  company_hr_booster_yearly: { amount: 74700, currency: 'gbp', interval: 'year', name: 'HR Booster' }, // £747
  company_hr_agent_yearly: { amount: 174500, currency: 'gbp', interval: 'year', name: 'HR Agent' }, // £1745
} as const

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, successUrl, cancelUrl, testMode } = body

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // FOR TESTING: Allow direct database updates without Stripe
    // DISABLED: Using real Stripe checkout now
    /*
    if (testMode === true || process.env.NODE_ENV === 'development') {
      console.log(`🧪 TEST MODE: Directly updating user subscription to ${planId}`)
      
      // Map planId to subscription plan
      const planIdMapping = {
        // Student plans
        'student_premium_monthly': 'STUDENT_PREMIUM',
        'student_pro_monthly': 'STUDENT_PRO', 
        'company_basic_monthly': 'COMPANY_BASIC',
        'company_premium_monthly': 'COMPANY_PREMIUM',
        'company_pro_monthly': 'COMPANY_PRO',
      }

      const subscriptionPlan = planIdMapping[planId as keyof typeof planIdMapping]
      
      if (!subscriptionPlan) {
        return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
      }

      try {
        const updatedUser = await prisma.user.update({
          where: { id: session.user?.id },
          data: { 
            subscriptionPlan: subscriptionPlan as any,
            subscriptionStatus: 'ACTIVE'
          }
        })

        console.log(`✅ Test mode: Updated user subscription to ${subscriptionPlan}`)
        
        return NextResponse.json({
          testMode: true,
          success: true,
          subscriptionPlan,
          subscriptionStatus: 'ACTIVE',
          message: `Successfully upgraded to ${subscriptionPlan}`,
          refreshSession: true, // Signal frontend to refresh session
          redirectUrl: successUrl || `/dashboard?success=true&plan=${planId}`,
        })
      } finally {
        await prisma.$disconnect()
      }
    }
    */

    // REAL STRIPE MODE: Create checkout session

    // Validate Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY is not configured')
      return NextResponse.json({
        error: 'Payment system is currently being configured. Please try again later.',
        code: 'STRIPE_CONFIG_ERROR'
      }, { status: 503 })
    }

    // Get the origin for redirect URLs
    const headersList = headers()
    const host = headersList.get('host')
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const origin = `${protocol}://${host}`

    let priceId = STRIPE_PRICES[planId as keyof typeof STRIPE_PRICES]
    let checkoutSession

    try {
      // First, try with the predefined price ID
      if (priceId) {
        console.log(`🔄 Attempting checkout with price ID: ${priceId}`)
        
        checkoutSession = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          success_url: successUrl || `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl || `${origin}/dashboard?canceled=true`,
          customer_email: session.user?.email,
          client_reference_id: session.user?.id,
          metadata: {
            userId: session.user?.id,
            planId: planId,
            userRole: session.user?.role || 'STUDENT',
          },
          subscription_data: {
            metadata: {
              userId: session.user?.id,
              planId: planId,
            },
          },
          allow_promotion_codes: true, // Enable 100% discount coupons
          billing_address_collection: 'auto',
          tax_id_collection: {
            enabled: true,
          },
        })
      }
    } catch (priceError: any) {
      console.log(`⚠️ Price ${priceId} doesn't exist, creating on-the-fly price for plan: ${planId}`)
      
      // If the price doesn't exist, create it dynamically
      const planMetadata = PLAN_METADATA[planId as keyof typeof PLAN_METADATA]
      
      if (!planMetadata) {
        return NextResponse.json({
          error: `Plan ${planId} is not supported. Available plans: ${Object.keys(PLAN_METADATA).join(', ')}`,
          code: 'PLAN_NOT_SUPPORTED'
        }, { status: 400 })
      }

      try {
        // Create or get product
        let product
        try {
          const products = await stripe.products.list({ limit: 100 })
          product = products.data.find((p: any) => p.name === planMetadata.name)
          
          if (!product) {
            console.log(`📦 Creating product: ${planMetadata.name}`)
            product = await stripe.products.create({
              name: planMetadata.name,
              description: `${planMetadata.name} subscription plan`,
              metadata: { planId }
            })
          }
        } catch (productError) {
          console.log('🔄 Creating new product due to error:', productError)
          product = await stripe.products.create({
            name: planMetadata.name,
            description: `${planMetadata.name} subscription plan`,
            metadata: { planId }
          })
        }

        // Create price
        console.log(`💰 Creating price for ${planMetadata.name}: $${planMetadata.amount/100}/${planMetadata.interval}`)
        const price = await stripe.prices.create({
          unit_amount: planMetadata.amount,
          currency: planMetadata.currency,
          recurring: { interval: planMetadata.interval },
          product: product.id,
          metadata: { planId }
        })

        // Now create checkout session with the new price
        checkoutSession = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [
            {
              price: price.id,
              quantity: 1,
            },
          ],
          success_url: successUrl || `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl || `${origin}/dashboard?canceled=true`,
          customer_email: session.user?.email,
          client_reference_id: session.user?.id,
          metadata: {
            userId: session.user?.id,
            planId: planId,
            userRole: session.user?.role || 'STUDENT',
            dynamicPriceId: price.id
          },
          subscription_data: {
            metadata: {
              userId: session.user?.id,
              planId: planId,
            },
          },
          allow_promotion_codes: true,
          billing_address_collection: 'auto',
        })

        console.log(`✅ Created dynamic price ${price.id} and checkout session for ${planMetadata.name}`)

      } catch (dynamicError: any) {
        console.error('❌ Failed to create dynamic price:', dynamicError)
        return NextResponse.json({
          error: 'Unable to create payment session. Please ensure your Stripe account is properly configured.',
          code: 'DYNAMIC_PRICE_ERROR',
          details: dynamicError.message
        }, { status: 500 })
      }
    }

    if (!checkoutSession) {
      return NextResponse.json({
        error: 'Failed to create checkout session',
        code: 'SESSION_CREATION_ERROR'
      }, { status: 500 })
    }

    console.log(`✅ Created Stripe checkout session for user ${session.user?.id}, plan ${planId}:`, checkoutSession.id)

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id
    })

  } catch (error: any) {
    console.error('❌ Error creating checkout session:', error)
    
    if (error?.type === 'StripeInvalidRequestError') {
      return NextResponse.json({
        error: 'Invalid payment request. Please check your plan selection.',
        code: 'STRIPE_INVALID_REQUEST',
        details: error.message
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Unable to create checkout session. Please try again.',
      code: 'CHECKOUT_ERROR',
      details: error.message
    }, { status: 500 })
  }
} 