import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const prisma = new PrismaClient()

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const sig = headersList.get('stripe-signature')

    if (!sig || !endpointSecret) {
      console.error('❌ Missing Stripe signature or webhook secret')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('🔄 Processing Stripe webhook event:', event.type)

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
      
      default:
        console.log(`🔔 Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: any) {
  try {
    console.log('✅ Checkout completed for session:', session.id)
    console.log('📊 Session metadata:', session.metadata)
    console.log('📊 Session client_reference_id:', session.client_reference_id)

    const userId = session.client_reference_id || session.metadata?.userId
    const planId = session.metadata?.planId

    if (!userId) {
      console.error('❌ No user ID found in checkout session')
      return
    }

    console.log(`🔄 Processing checkout for user ${userId}, planId: ${planId}`)

    // Get the subscription details
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription)
      const priceId = subscription.items.data[0]?.price.id

      console.log(`💰 Subscription price ID: ${priceId}`)

      // PRIORITY 1: Use planId from metadata (most reliable)
      let subscriptionPlan = null
      
      if (planId) {
        // Map planId to subscription plan format
        const planIdMapping = {
          // Student plans
          'student_premium_monthly': 'STUDENT_PREMIUM',
          'student_premium_yearly': 'STUDENT_PREMIUM', 
          'student_pro_monthly': 'STUDENT_PRO',
          'student_pro_yearly': 'STUDENT_PRO',
          
          // Company plans  
          'company_basic_monthly': 'COMPANY_BASIC',
          'company_basic_yearly': 'COMPANY_BASIC',
          'company_hr_booster_monthly': 'COMPANY_PRO', 
          'company_hr_booster_yearly': 'COMPANY_PRO',
          'company_hr_agent_monthly': 'COMPANY_PREMIUM',
          'company_hr_agent_yearly': 'COMPANY_PREMIUM',
        }
        
        subscriptionPlan = planIdMapping[planId as keyof typeof planIdMapping]
        console.log(`🎯 Mapped planId ${planId} to subscription plan: ${subscriptionPlan}`)
      }

      // FALLBACK: Try to map using price ID (for legacy prices)
      if (!subscriptionPlan && priceId) {
        const legacyPriceMapping = {
          // Student plans (original price IDs)
          'price_1RoSRXRoQRapPhxpPpjy7RJQ': 'STUDENT_PREMIUM', // Student Premium Monthly
          'price_1RoSPLnoQRapPhxpyJZJM9K': 'STUDENT_PREMIUM', // Student Premium Yearly
          'price_1RoSBRoQRapPhxpXXaZSwJ6': 'STUDENT_PRO', // Student Pro Monthly
          'price_1RoSMwRoQRapPhxpmUpAZUza': 'STUDENT_PRO', // Student Pro Yearly
          
          // Company plans (original price IDs)
          'price_1RoSM6RoQRapPhxpqlfJZrqY': 'COMPANY_BASIC', // Company Basic Monthly
          'price_1Rf2jRoQRapPhxpzUMN6sNM': 'COMPANY_BASIC', // Company Basic Yearly
          'price_1RoSM6RoQRapPhxproAl4FEc': 'COMPANY_PRO', // HR Booster Monthly
          'price_1Rf2nTRoQRapPhxpIsLvOlYB': 'COMPANY_PRO', // HR Booster Yearly
          'price_1Rf2jRoQRapPhxpMOWnksOY': 'COMPANY_PREMIUM', // HR Agent Monthly
          'price_1Rf2nTRoQRapPhxpGl4zzduqM': 'COMPANY_PREMIUM', // HR Agent Yearly
        }
        
        subscriptionPlan = legacyPriceMapping[priceId as keyof typeof legacyPriceMapping]
        console.log(`🔄 Fallback: Mapped priceId ${priceId} to subscription plan: ${subscriptionPlan}`)
      }

      if (!subscriptionPlan) {
        console.error(`❌ Could not determine subscription plan for planId: ${planId}, priceId: ${priceId}`)
        return
      }

      // Update user subscription in database - BOTH FIELDS
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionPlan: subscriptionPlan as any, // The plan tier (STUDENT_PREMIUM, COMPANY_BASIC, etc.)
          subscriptionStatus: 'ACTIVE' as any, // Status should be ACTIVE for paid subscriptions
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
        }
      })

      console.log(`🎉 SUCCESS: Updated BOTH subscription fields for user ${userId}`)
      console.log(`📊 User subscription details:`, {
        id: updatedUser.id,
        email: updatedUser.email,
        subscriptionPlan: updatedUser.subscriptionPlan, // Plan tier
        subscriptionStatus: updatedUser.subscriptionStatus, // Status (should be ACTIVE)
        stripeSubscriptionId: updatedUser.stripeSubscriptionId
      })

    } else {
      console.log('⚠️ No subscription found in checkout session - this might be a one-time payment')
    }

  } catch (error) {
    console.error('❌ Error handling checkout completed:', error)
  }
}

async function handleSubscriptionCreated(subscription: any) {
  try {
    console.log('✅ Subscription created:', subscription.id)

    const userId = subscription.metadata?.userId
    if (!userId) {
      console.error('❌ No user ID found in subscription metadata')
      return
    }

    const priceId = subscription.items.data[0]?.price.id
    
         // Map price ID to plan - Using Environment Variables
     const planMapping = {
       // Student plans
       [process.env.STRIPE_STUDENT_PREMIUM_MONTHLY!]: 'STUDENT_PREMIUM',
       [process.env.STRIPE_STUDENT_PREMIUM_YEARLY!]: 'STUDENT_PREMIUM',
       [process.env.STRIPE_STUDENT_PRO_MONTHLY!]: 'STUDENT_PRO',
       [process.env.STRIPE_STUDENT_PRO_YEARLY!]: 'STUDENT_PRO',
       
       // Company plans
       [process.env.STRIPE_COMPANY_BASIC_MONTHLY!]: 'COMPANY_BASIC',
       [process.env.STRIPE_COMPANY_BASIC_YEARLY!]: 'COMPANY_BASIC',
       [process.env.STRIPE_COMPANY_PREMIUM_MONTHLY!]: 'COMPANY_PRO',
       [process.env.STRIPE_COMPANY_PREMIUM_YEARLY!]: 'COMPANY_PRO',
       [process.env.STRIPE_COMPANY_PRO_MONTHLY!]: 'COMPANY_PREMIUM',
       [process.env.STRIPE_COMPANY_PRO_YEARLY!]: 'COMPANY_PREMIUM',
     }

    const subscriptionPlan = planMapping[priceId as keyof typeof planMapping]

    if (subscriptionPlan) {
             await prisma.user.update({
         where: { id: userId },
         data: {
           subscriptionPlan: subscriptionPlan as any,
           subscriptionStatus: 'ACTIVE' as any,
           stripeSubscriptionId: subscription.id,
         }
       })

      console.log(`✅ Activated subscription for user ${userId}: ${subscriptionPlan}`)
    }

  } catch (error) {
    console.error('❌ Error handling subscription created:', error)
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    console.log('🔄 Subscription updated:', subscription.id)

    // Find user by Stripe subscription ID
    const user = await prisma.user.findFirst({
      where: { stripeSubscriptionId: subscription.id }
    })

    if (!user) {
      console.error('❌ No user found for subscription:', subscription.id)
      return
    }

    // Map subscription status
    const status = subscription.status === 'active' ? 'ACTIVE' : 
                   subscription.status === 'canceled' ? 'CANCELLED' :
                   subscription.status === 'past_due' ? 'PAST_DUE' : 'UNPAID'

    // Map the new price ID to subscription plan (for plan changes)
    let newSubscriptionPlan = null
    if (subscription.items?.data?.[0]?.price?.id) {
      const priceId = subscription.items.data[0].price.id
      
      const planMapping = {
        // Student plans
        'price_1RoSRXRoQRapPhxpPpjy7RJQ': 'STUDENT_PREMIUM', // Student Premium Monthly
        'price_1RoSPLnoQRapPhxpyJZJM9K': 'STUDENT_PREMIUM', // Student Premium Yearly
        'price_1RoSBRoQRapPhxpXXaZSwJ6': 'STUDENT_PRO', // Student Pro Monthly
        'price_1RoSMwRoQRapPhxpmUpAZUza': 'STUDENT_PRO', // Student Pro Yearly
        
        // Company plans
        'price_1RoSM6RoQRapPhxpqlfJZrqY': 'COMPANY_BASIC', // Company Basic Monthly
        'price_1Rf2jRoQRapPhxpzUMN6sNM': 'COMPANY_BASIC', // Company Basic Yearly
        'price_1RoSM6RoQRapPhxproAl4FEc': 'COMPANY_PRO', // HR Booster Monthly
        'price_1Rf2nTRoQRapPhxpIsLvOlYB': 'COMPANY_PRO', // HR Booster Yearly
        'price_1Rf2jRoQRapPhxpMOWnksOY': 'COMPANY_PREMIUM', // HR Agent Monthly
        'price_1Rf2nTRoQRapPhxpGl4zzduqM': 'COMPANY_PREMIUM', // HR Agent Yearly
      }
      
      newSubscriptionPlan = planMapping[priceId as keyof typeof planMapping]
      console.log(`🔄 Mapped subscription price ${priceId} to plan: ${newSubscriptionPlan}`)
    }

    // Update user with both status and plan (if plan changed)
    const updateData: any = {
      subscriptionStatus: status,
    }

    // Only update plan if we found a valid mapping
    if (newSubscriptionPlan) {
      updateData.subscriptionPlan = newSubscriptionPlan
      console.log(`📈 Updating user ${user.id} plan from ${user.subscriptionPlan} to ${newSubscriptionPlan}`)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    })

    console.log(`✅ Updated subscription for user ${user.id}: status=${status}, plan=${newSubscriptionPlan || 'unchanged'}`)

  } catch (error) {
    console.error('❌ Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    console.log('❌ Subscription deleted:', subscription.id)

    // Find user by Stripe subscription ID
    const user = await prisma.user.findFirst({
      where: { stripeSubscriptionId: subscription.id }
    })

    if (!user) {
      console.error('❌ No user found for subscription:', subscription.id)
      return
    }

    // Downgrade to free plan
    const freePlan = user.role === 'STUDENT' ? 'FREE' : 'FREE'

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionPlan: freePlan,
        subscriptionStatus: 'CANCELLED',
        stripeSubscriptionId: null,
      }
    })

    console.log(`✅ Downgraded user ${user.id} to free plan`)

  } catch (error) {
    console.error('❌ Error handling subscription deleted:', error)
  }
}

async function handlePaymentSucceeded(invoice: any) {
  try {
    console.log('✅ Payment succeeded for invoice:', invoice.id)

    if (invoice.subscription) {
      // Find user by subscription ID
      const user = await prisma.user.findFirst({
        where: { stripeSubscriptionId: invoice.subscription }
      })

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: 'ACTIVE',
          }
        })

        console.log(`✅ Reactivated subscription for user ${user.id}`)
      }
    }

  } catch (error) {
    console.error('❌ Error handling payment succeeded:', error)
  }
}

async function handlePaymentFailed(invoice: any) {
  try {
    console.log('❌ Payment failed for invoice:', invoice.id)

    if (invoice.subscription) {
      // Find user by subscription ID
      const user = await prisma.user.findFirst({
        where: { stripeSubscriptionId: invoice.subscription }
      })

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: 'PAST_DUE',
          }
        })

        console.log(`⚠️ Marked subscription as past due for user ${user.id}`)
      }
    }

  } catch (error) {
    console.error('❌ Error handling payment failed:', error)
  }
} 