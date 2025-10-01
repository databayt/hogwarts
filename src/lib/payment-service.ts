/**
 * Payment Service
 * Handles Stripe integration for school subscriptions and payments
 * Supports subscriptions, one-time payments, and payment methods
 */

import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// === TYPE DEFINITIONS ===

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface Subscription {
  id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface Invoice {
  id: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  amount: number;
  currency: string;
  dueDate?: Date;
  paidAt?: Date;
  pdfUrl?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  metadata?: Record<string, any>;
}

export interface CheckoutSession {
  id: string;
  url: string;
  expiresAt: Date;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
}

export interface CustomerData {
  email: string;
  name: string;
  schoolId: string;
  metadata?: Record<string, string>;
}

// === CONFIGURATION ===

interface PaymentConfig {
  stripeSecretKey?: string;
  stripePublishableKey?: string;
  webhookSecret?: string;
  currency: string;
  taxRates?: string[];
}

const config: PaymentConfig = {
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  currency: process.env.STRIPE_CURRENCY || 'usd',
  taxRates: process.env.STRIPE_TAX_RATES?.split(',') || [],
};

// === MAIN SERVICE CLASS ===

class PaymentService {
  private stripe: any = null;
  private isConfigured: boolean = false;

  constructor(config: PaymentConfig) {
    if (config.stripeSecretKey) {
      // NOTE: Uncomment when Stripe is installed
      // const Stripe = require('stripe');
      // this.stripe = new Stripe(config.stripeSecretKey, {
      //   apiVersion: '2023-10-16',
      //   typescript: true,
      // });
      // this.isConfigured = true;
      
      logger.info('Stripe integration ready (pending library installation)');
    } else {
      logger.warn('Stripe not configured - payment features disabled');
    }
  }

  /**
   * Create or retrieve a Stripe customer
   */
  async createCustomer(data: CustomerData): Promise<{ customerId?: string; error?: string }> {
    if (!this.isConfigured) {
      return { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in environment.' };
    }

    try {
      // NOTE: Uncomment when Stripe is installed
      /*
      const existingCustomers = await this.stripe.customers.list({
        email: data.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        return { customerId: existingCustomers.data[0].id };
      }

      const customer = await this.stripe.customers.create({
        email: data.email,
        name: data.name,
        metadata: {
          schoolId: data.schoolId,
          ...data.metadata,
        },
      });

      return { customerId: customer.id };
      */

      return { error: 'Stripe customer creation not implemented. Install stripe package: pnpm add stripe' };
    } catch (error) {
      logger.error('Failed to create Stripe customer', error as Error);
      return { error: error instanceof Error ? error.message : 'Failed to create customer' };
    }
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSession | { error: string }> {
    if (!this.isConfigured) {
      return { error: 'Stripe is not configured' };
    }

    try {
      // NOTE: Uncomment when Stripe is installed
      /*
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        tax_id_collection: {
          enabled: true,
        },
      });

      return {
        id: session.id,
        url: session.url,
        expiresAt: new Date(session.expires_at * 1000),
      };
      */

      return { error: 'Stripe checkout not implemented. Install stripe package.' };
    } catch (error) {
      logger.error('Failed to create checkout session', error as Error);
      return { error: error instanceof Error ? error.message : 'Failed to create checkout' };
    }
  }

  /**
   * Create a payment intent for one-time payment
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId?: string
  ): Promise<PaymentResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Stripe is not configured',
      };
    }

    try {
      // NOTE: Uncomment when Stripe is installed
      /*
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency || config.currency,
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      };
      */

      return {
        success: false,
        error: 'Payment intent creation not implemented',
      };
    } catch (error) {
      logger.error('Failed to create payment intent', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment',
      };
    }
  }

  /**
   * Get customer's subscriptions
   */
  async getSubscriptions(customerId: string): Promise<Subscription[]> {
    if (!this.isConfigured) {
      return [];
    }

    try {
      // NOTE: Uncomment when Stripe is installed
      /*
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
      });

      return subscriptions.data.map((sub: any) => ({
        id: sub.id,
        status: sub.status,
        planId: sub.items.data[0].price.id,
        planName: sub.items.data[0].price.nickname || sub.items.data[0].price.product,
        amount: sub.items.data[0].price.unit_amount / 100,
        currency: sub.currency,
        interval: sub.items.data[0].price.recurring.interval,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      }));
      */

      return [];
    } catch (error) {
      logger.error('Failed to get subscriptions', error as Error);
      return [];
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return { success: false, error: 'Stripe is not configured' };
    }

    try {
      // NOTE: Uncomment when Stripe is installed
      /*
      if (immediately) {
        await this.stripe.subscriptions.del(subscriptionId);
      } else {
        await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }

      return { success: true };
      */

      return { success: false, error: 'Subscription cancellation not implemented' };
    } catch (error) {
      logger.error('Failed to cancel subscription', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel',
      };
    }
  }

  /**
   * Get customer's invoices
   */
  async getInvoices(customerId: string, limit: number = 10): Promise<Invoice[]> {
    if (!this.isConfigured) {
      return [];
    }

    try {
      // NOTE: Uncomment when Stripe is installed
      /*
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit,
      });

      return invoices.data.map((inv: any) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        amount: inv.amount_paid / 100,
        currency: inv.currency,
        dueDate: inv.due_date ? new Date(inv.due_date * 1000) : undefined,
        paidAt: inv.status_transitions?.paid_at 
          ? new Date(inv.status_transitions.paid_at * 1000) 
          : undefined,
        pdfUrl: inv.invoice_pdf,
      }));
      */

      return [];
    } catch (error) {
      logger.error('Failed to get invoices', error as Error);
      return [];
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(
    payload: string,
    signature: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured || !config.webhookSecret) {
      return { success: false, error: 'Webhook not configured' };
    }

    try {
      // NOTE: Uncomment when Stripe is installed
      /*
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.webhookSecret
      );

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaid(event.data.object);
          break;
        default:
          logger.info('Unhandled webhook event', { type: event.type });
      }

      return { success: true };
      */

      return { success: false, error: 'Webhook handling not implemented' };
    } catch (error) {
      logger.error('Webhook processing failed', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook failed',
      };
    }
  }

  // === PRIVATE WEBHOOK HANDLERS ===

  private async handlePaymentSuccess(paymentIntent: any): Promise<void> {
    logger.info('Payment succeeded', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
    });

    try {
      // Get school ID from payment metadata
      const schoolId = paymentIntent.metadata?.schoolId;
      if (!schoolId) {
        logger.error('No schoolId in payment metadata', { paymentIntent });
        return;
      }

      // Update payment record in database
      await db.payment.create({
        data: {
          schoolId,
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: 'SUCCESS',
          paymentDate: new Date(),
          metadata: paymentIntent.metadata,
        }
      });

      // Update school subscription status
      await db.school.update({
        where: { id: schoolId },
        data: {
          subscriptionStatus: 'ACTIVE',
          lastPaymentDate: new Date(),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }
      });

      // Send confirmation email
      const school = await db.school.findUnique({
        where: { id: schoolId },
        include: { owner: true }
      });

      if (school?.owner?.email) {
        await this.sendPaymentConfirmationEmail({
          to: school.owner.email,
          schoolName: school.name,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          invoiceUrl: paymentIntent.charges?.data[0]?.receipt_url
        });
      }

      logger.info('Payment success handled', { schoolId, paymentIntentId: paymentIntent.id });
    } catch (error) {
      logger.error('Error handling payment success', { error, paymentIntent });
      throw error;
    }
  }

  private async handlePaymentFailure(paymentIntent: any): Promise<void> {
    logger.warn('Payment failed', {
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message,
    });

    try {
      const schoolId = paymentIntent.metadata?.schoolId;
      if (!schoolId) return;

      // Record failed payment attempt
      await db.payment.create({
        data: {
          schoolId,
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: 'FAILED',
          paymentDate: new Date(),
          error: paymentIntent.last_payment_error?.message,
          metadata: paymentIntent.metadata,
        }
      });

      // Update school status if subscription is at risk
      const failedPayments = await db.payment.count({
        where: {
          schoolId,
          status: 'FAILED',
          paymentDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      });

      if (failedPayments >= 3) {
        await db.school.update({
          where: { id: schoolId },
          data: { subscriptionStatus: 'AT_RISK' }
        });
      }

      // Send failure notification
      const school = await db.school.findUnique({
        where: { id: schoolId },
        include: { owner: true }
      });

      if (school?.owner?.email) {
        await this.sendPaymentFailureEmail({
          to: school.owner.email,
          schoolName: school.name,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          error: paymentIntent.last_payment_error?.message,
          retryUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/retry?payment=${paymentIntent.id}`
        });
      }

      // Schedule retry attempt (if applicable)
      if (failedPayments < 3) {
        await this.schedulePaymentRetry(paymentIntent, failedPayments + 1);
      }

    } catch (error) {
      logger.error('Error handling payment failure', { error, paymentIntent });
    }
  }

  private async handleSubscriptionUpdate(subscription: any): Promise<void> {
    logger.info('Subscription updated', {
      subscriptionId: subscription.id,
      status: subscription.status,
    });

    try {
      const schoolId = subscription.metadata?.schoolId;
      if (!schoolId) return;

      // Map Stripe status to our status
      const statusMap: Record<string, string> = {
        'active': 'ACTIVE',
        'past_due': 'AT_RISK',
        'unpaid': 'SUSPENDED',
        'canceled': 'CANCELLED',
        'incomplete': 'PENDING',
        'incomplete_expired': 'EXPIRED',
        'trialing': 'TRIAL',
      };

      const newStatus = statusMap[subscription.status] || 'PENDING';

      // Update school subscription
      await db.school.update({
        where: { id: schoolId },
        data: {
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: newStatus,
          subscriptionTier: subscription.items.data[0]?.price?.metadata?.tier || 'starter',
          subscriptionPeriodStart: new Date(subscription.current_period_start * 1000),
          subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
        }
      });

      logger.info('Subscription updated in database', { schoolId, status: newStatus });
    } catch (error) {
      logger.error('Error handling subscription update', { error, subscription });
    }
  }

  private async handleSubscriptionCancellation(subscription: any): Promise<void> {
    logger.info('Subscription canceled', {
      subscriptionId: subscription.id,
    });

    try {
      const schoolId = subscription.metadata?.schoolId;
      if (!schoolId) return;

      // Update school status
      await db.school.update({
        where: { id: schoolId },
        data: {
          subscriptionStatus: 'CANCELLED',
          subscriptionEndDate: new Date(subscription.canceled_at * 1000),
        }
      });

      // Send cancellation email
      const school = await db.school.findUnique({
        where: { id: schoolId },
        include: { owner: true }
      });

      if (school?.owner?.email) {
        await this.sendSubscriptionCancellationEmail({
          to: school.owner.email,
          schoolName: school.name,
          endDate: new Date(subscription.current_period_end * 1000),
          reason: subscription.cancellation_details?.reason,
        });
      }

      logger.info('Subscription cancellation handled', { schoolId });
    } catch (error) {
      logger.error('Error handling subscription cancellation', { error, subscription });
    }
  }

  private async handleInvoicePaid(invoice: any): Promise<void> {
    logger.info('Invoice paid', {
      invoiceId: invoice.id,
      amount: invoice.amount_paid / 100,
    });

    try {
      const schoolId = invoice.metadata?.schoolId || invoice.subscription_details?.metadata?.schoolId;
      if (!schoolId) return;

      // Create invoice record
      await db.invoice.create({
        data: {
          schoolId,
          stripeInvoiceId: invoice.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          status: 'PAID',
          paidAt: new Date(invoice.status_transitions.paid_at * 1000),
          invoiceUrl: invoice.hosted_invoice_url,
          pdfUrl: invoice.invoice_pdf,
          metadata: invoice.metadata,
        }
      });

      // Update school payment info
      await db.school.update({
        where: { id: schoolId },
        data: {
          lastPaymentDate: new Date(),
          lastInvoiceAmount: invoice.amount_paid / 100,
        }
      });

      // Send invoice receipt
      const school = await db.school.findUnique({
        where: { id: schoolId },
        include: { owner: true }
      });

      if (school?.owner?.email) {
        await this.sendInvoiceReceiptEmail({
          to: school.owner.email,
          schoolName: school.name,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          invoiceUrl: invoice.hosted_invoice_url,
          pdfUrl: invoice.invoice_pdf,
        });
      }

      logger.info('Invoice payment recorded', { schoolId, invoiceId: invoice.id });
    } catch (error) {
      logger.error('Error handling invoice payment', { error, invoice });
    }
  }

  // === EMAIL NOTIFICATION METHODS ===

  private async sendPaymentConfirmationEmail(params: {
    to: string;
    schoolName: string;
    amount: number;
    currency: string;
    invoiceUrl?: string;
  }): Promise<void> {
    try {
      // Implementation would use your email service (SendGrid, SES, etc.)
      logger.info('Sending payment confirmation email', { to: params.to });
      // await emailService.send({...})
    } catch (error) {
      logger.error('Failed to send payment confirmation email', { error, params });
    }
  }

  private async sendPaymentFailureEmail(params: {
    to: string;
    schoolName: string;
    amount: number;
    currency: string;
    error: string;
    retryUrl: string;
  }): Promise<void> {
    try {
      logger.info('Sending payment failure email', { to: params.to });
      // await emailService.send({...})
    } catch (error) {
      logger.error('Failed to send payment failure email', { error, params });
    }
  }

  private async sendSubscriptionCancellationEmail(params: {
    to: string;
    schoolName: string;
    endDate: Date;
    reason?: string;
  }): Promise<void> {
    try {
      logger.info('Sending subscription cancellation email', { to: params.to });
      // await emailService.send({...})
    } catch (error) {
      logger.error('Failed to send cancellation email', { error, params });
    }
  }

  private async sendInvoiceReceiptEmail(params: {
    to: string;
    schoolName: string;
    amount: number;
    currency: string;
    invoiceUrl: string;
    pdfUrl: string;
  }): Promise<void> {
    try {
      logger.info('Sending invoice receipt email', { to: params.to });
      // await emailService.send({...})
    } catch (error) {
      logger.error('Failed to send invoice receipt email', { error, params });
    }
  }

  private async schedulePaymentRetry(paymentIntent: any, attemptNumber: number): Promise<void> {
    try {
      // Schedule retry with exponential backoff
      const delayHours = Math.pow(2, attemptNumber) * 24; // 2 days, 4 days, 8 days
      const retryDate = new Date(Date.now() + delayHours * 60 * 60 * 1000);

      logger.info('Scheduling payment retry', {
        paymentIntentId: paymentIntent.id,
        attemptNumber,
        retryDate
      });

      // In production, this would use a job queue like BullMQ or similar
      // await jobQueue.schedule('retryPayment', { paymentIntentId: paymentIntent.id }, retryDate);
    } catch (error) {
      logger.error('Failed to schedule payment retry', { error, paymentIntent });
    }
  }
}

// === SINGLETON INSTANCE ===

export const paymentService = new PaymentService(config);

// === PRICING PLANS ===

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    description: 'Perfect for small schools',
    amount: 99,
    currency: 'usd',
    interval: 'month',
    features: [
      'Up to 100 students',
      'Up to 10 teachers',
      'Basic features',
      'Email support',
    ],
    metadata: {
      maxStudents: 100,
      maxTeachers: 10,
    },
  },
  {
    id: 'professional',
    name: 'Professional Plan',
    description: 'For growing schools',
    amount: 299,
    currency: 'usd',
    interval: 'month',
    features: [
      'Up to 500 students',
      'Up to 50 teachers',
      'Advanced features',
      'Priority support',
      'Custom branding',
    ],
    metadata: {
      maxStudents: 500,
      maxTeachers: 50,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    description: 'For large institutions',
    amount: 999,
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited students',
      'Unlimited teachers',
      'All features',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
    ],
    metadata: {
      maxStudents: -1, // unlimited
      maxTeachers: -1,
    },
  },
];

// === UTILITY FUNCTIONS ===

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Get plan by ID
 */
export function getPlanById(planId: string): PricingPlan | undefined {
  return PRICING_PLANS.find(plan => plan.id === planId);
}