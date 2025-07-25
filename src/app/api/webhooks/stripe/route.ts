import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { PrismaClient } from '@prisma/client'

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const prisma = new PrismaClient()

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  console.log('🔔 ===================== STRIPE WEBHOOK START =====================');
  
  try {
    const body = await request.text()
    const headersList = headers()
    const sig = headersList.get('stripe-signature')

    console.log('🔔 Webhook received:', {
      hasSignature: !!sig,
      hasSecret: !!endpointSecret,
      bodyLength: body.length
    });

    if (!sig || !endpointSecret) {
      console.error('❌ Missing Stripe signature or webhook secret')
      console.error('❌ Signature present:', !!sig)
      console.error('❌ Webhook secret present:', !!endpointSecret)
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
      console.log('✅ Webhook signature verified successfully')
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('🔄 Processing Stripe webhook event:', event.type)
    console.log('🔄 Event data preview:', {
      id: event.data.object.id,
      type: event.type,
      livemode: event.livemode
    });

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('💳 Handling checkout.session.completed')
        await handleCheckoutCompleted(event.data.object)
        break
      
      case 'customer.subscription.created':
        console.log('📋 Handling customer.subscription.created')
        await handleSubscriptionCreated(event.data.object)
        break
      
      case 'customer.subscription.updated':
        console.log('🔄 Handling customer.subscription.updated')
        await handleSubscriptionUpdated(event.data.object)
        break
      
      case 'customer.subscription.deleted':
        console.log('🗑️ Handling customer.subscription.deleted')
        await handleSubscriptionDeleted(event.data.object)
        break
      
      case 'invoice.payment_succeeded':
        console.log('✅ Handling invoice.payment_succeeded')
        await handlePaymentSucceeded(event.data.object)
        break
      
      case 'invoice.payment_failed':
        console.log('❌ Handling invoice.payment_failed')
        await handlePaymentFailed(event.data.object)
        break
      
      default:
        console.log(`🔔 Unhandled event type: ${event.type}`)
    }

    console.log('🔔 ===================== STRIPE WEBHOOK SUCCESS =====================');
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.log('🔔 ===================== STRIPE WEBHOOK ERROR =====================');
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: any) {
  console.log('💳 ===================== CHECKOUT COMPLETED START =====================');
  
  try {
    console.log('✅ Checkout completed for session:', session.id)
    console.log('📊 Session metadata:', session.metadata)
    console.log('📊 Session client_reference_id:', session.client_reference_id)
    console.log('📊 Session customer:', session.customer)
    console.log('📊 Session subscription:', session.subscription)
    console.log('📊 Session mode:', session.mode)
    console.log('📊 Session payment_status:', session.payment_status)

    const userId = session.client_reference_id || session.metadata?.userId
    const planId = session.metadata?.planId

    console.log('🔍 Extracted data:', { userId, planId })

    if (!userId) {
      console.error('❌ No user ID found in checkout session')
      console.error('❌ Available identifiers:', {
        client_reference_id: session.client_reference_id,
        metadata_userId: session.metadata?.userId,
        metadata: session.metadata
      })
      return
    }

    console.log(`🔄 Processing checkout for user ${userId}, planId: ${planId}`)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, subscriptionPlan: true, subscriptionStatus: true }
    });

    if (!existingUser) {
      console.error(`❌ User ${userId} not found in database`)
      return
    }

    console.log('👤 Found user:', existingUser)

    // Get the subscription details
    if (session.subscription) {
      console.log('📋 Retrieving subscription details from Stripe...')
      const subscription = await stripe.subscriptions.retrieve(session.subscription, {
        expand: ['items.data.price']
      })
      console.log('📋 Retrieved subscription:', {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end
      })

      const priceId = subscription.items.data[0]?.price.id
      console.log(`💰 Subscription price ID: ${priceId}`)

      // PRIORITY 1: Use planId from metadata (most reliable)
      let subscriptionPlan = null
      
      if (planId) {
        console.log(`🎯 Mapping planId: ${planId}`)
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
        console.log(`🔄 Fallback: Mapping priceId: ${priceId}`)
        const legacyPriceMapping = {
          // Student plans (current price IDs from .env)
          'price_1Rf2hTRoORqpPhxpGi4zduqM': 'STUDENT_PREMIUM', // Student Premium Monthly
          'price_1Rf2hTRoORqpPhxpIeLvOIYB': 'STUDENT_PREMIUM', // Student Premium Yearly
          'price_1Rf2jHRoORqpPhxpzUMN5sNM': 'STUDENT_PRO', // Student Pro Monthly
          'price_1Rf2jrRoORqpPhxpMOVmksOY': 'STUDENT_PRO', // Student Pro Yearly
          
          // Company plans (current price IDs from .env)
          'price_1RoSM6RoORqpPhxproAI4FEc': 'COMPANY_BASIC', // Company Basic Monthly
          'price_1RoSM6RoORqpPhxpqIfJ2rqY': 'COMPANY_BASIC', // Company Basic Yearly
          'price_1RoSMwRoORqpPhxpmUpAZUza': 'COMPANY_PRO', // Company Premium Monthly
          'price_1RoSPLRoORqpPhxpyJZJM9iK': 'COMPANY_PRO', // Company Premium Yearly
          'price_1RoSRBRoORqpPhxpXXaZSwJ8': 'COMPANY_PREMIUM', // Company Pro Monthly
          'price_1RoSRXRoORqpPhxpPpjy7RJQ': 'COMPANY_PREMIUM', // Company Pro Yearly
        }
        
        subscriptionPlan = legacyPriceMapping[priceId as keyof typeof legacyPriceMapping]
        console.log(`🔄 Fallback: Mapped priceId ${priceId} to subscription plan: ${subscriptionPlan}`)
      }

      if (!subscriptionPlan) {
        console.error(`❌ Could not determine subscription plan for planId: ${planId}, priceId: ${priceId}`)
        console.error(`❌ Available mappings:`)
        console.error(`❌ PlanId provided: ${planId}`)
        console.error(`❌ PriceId from Stripe: ${priceId}`)
        return
      }

      console.log(`🎯 Final subscription plan determined: ${subscriptionPlan}`)

      // Update user subscription in database - BOTH FIELDS
      console.log(`💾 Updating user ${userId} in database...`)
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionPlan: subscriptionPlan as any, // The plan tier (STUDENT_PREMIUM, COMPANY_BASIC, etc.)
          subscriptionStatus: 'ACTIVE' as any, // Status should be ACTIVE for paid subscriptions
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
        }
      })

      console.log('✅ Successfully updated user subscription:', {
        userId: updatedUser.id,
        email: updatedUser.email,
        newPlan: updatedUser.subscriptionPlan,
        newStatus: updatedUser.subscriptionStatus,
        stripeCustomerId: updatedUser.stripeCustomerId,
        stripeSubscriptionId: updatedUser.stripeSubscriptionId
      })

      console.log('💳 ===================== CHECKOUT COMPLETED SUCCESS =====================');
    } else {
      console.log('⚠️ No subscription found in checkout session - might be a one-time payment')
    }

  } catch (error) {
    console.error('❌ Error in handleCheckoutCompleted:', error)
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.log('💳 ===================== CHECKOUT COMPLETED ERROR =====================');
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