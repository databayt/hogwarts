/**
 * Payment Service
 * Handles Stripe integration for school subscriptions and payments
 * Supports subscriptions, one-time payments, and payment methods
 */

import { logger } from '@/lib/logger';

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
    // TODO: Update database, send confirmation email, etc.
  }

  private async handlePaymentFailure(paymentIntent: any): Promise<void> {
    logger.warn('Payment failed', {
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message,
    });
    // TODO: Notify customer, retry payment, etc.
  }

  private async handleSubscriptionUpdate(subscription: any): Promise<void> {
    logger.info('Subscription updated', {
      subscriptionId: subscription.id,
      status: subscription.status,
    });
    // TODO: Update school subscription status in database
  }

  private async handleSubscriptionCancellation(subscription: any): Promise<void> {
    logger.info('Subscription canceled', {
      subscriptionId: subscription.id,
    });
    // TODO: Update school status, send cancellation email
  }

  private async handleInvoicePaid(invoice: any): Promise<void> {
    logger.info('Invoice paid', {
      invoiceId: invoice.id,
      amount: invoice.amount_paid / 100,
    });
    // TODO: Update payment records
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