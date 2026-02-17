import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
// stripe import lives here when Stripe checkout is implemented

const checkoutSchema = z.object({
  plan_tier: z.enum(['individual', 'pro', 'team'])
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    checkoutSchema.parse(body); // validates plan_tier; TODO: use in stripe.checkout.sessions.create

    // TODO: Implement Stripe checkout session creation
    // const session = await stripe.checkout.sessions.create({...});

    return NextResponse.json({
      url: 'https://checkout.stripe.com/...' // TODO: Return actual checkout URL
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
