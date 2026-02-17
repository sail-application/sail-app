/**
 * Feature Builder Templates
 *
 * Reusable component templates following SAIL patterns
 */

export const pageTemplate = (featureName, featureTitle, description) => `'use server';

import { Suspense } from 'react';
import { createServerSupabase } from '@/lib/supabase/server';
import { ${toPascalCase(featureName)}Card } from '@/components/features/${featureName}/${featureName}-card';
import { ${toPascalCase(featureName)}Loading } from '@/components/features/${featureName}/${featureName}-loading';

/**
 * ${featureTitle} Page
 *
 * ${description}
 */
export default async function ${toPascalCase(featureName)}Page() {
  const supabase = await createServerSupabase();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Please log in to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          ${featureTitle}
        </h1>
        <p className="text-gray-400">
          ${description}
        </p>
      </div>

      {/* Main Content */}
      <Suspense fallback={<${toPascalCase(featureName)}Loading />}>
        <${toPascalCase(featureName)}Content userId={user.id} />
      </Suspense>
    </div>
  );
}

/**
 * ${featureTitle} Content Component
 *
 * Fetches and displays ${featureName} data
 */
async function ${toPascalCase(featureName)}Content({ userId }: { userId: string }) {
  const supabase = await createServerSupabase();

  // TODO: Fetch ${featureName} data
  // const { data, error } = await supabase
  //   .from('${featureName}')
  //   .select('*')
  //   .eq('user_id', userId);

  return (
    <div className="grid gap-6">
      <${toPascalCase(featureName)}Card userId={userId} />
    </div>
  );
}

export const metadata = {
  title: '${featureTitle} | SAIL',
  description: '${description}',
};
`;

export const apiRouteTemplate = (featureName, method = 'GET') => `import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/utils/rate-limit';

/**
 * ${featureName.toUpperCase()} API Route
 *
 * ${method === 'GET' ? 'Fetches' : 'Processes'} ${featureName} data
 */

${method === 'POST' ? `// Request validation schema
const ${toCamelCase(featureName)}Schema = z.object({
  // TODO: Define your schema
  // example: z.string().min(1)
});

` : ''}export async function ${method}(request: NextRequest) {
  try {
    // Rate limiting: 30 requests per minute per user
    const rateLimitResult = await rateLimit(request, { limit: 30, window: 60000 });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Get authenticated user
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

${method === 'POST' ? `    // Parse and validate request body
    const body = await request.json();
    const validationResult = ${toCamelCase(featureName)}Schema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;
` : ''}
    // TODO: Implement ${featureName} logic
    // Example: Query database, call external API, process data

    return NextResponse.json({
      success: true,
      // data: result
    });

  } catch (error) {
    console.error('${featureName.toUpperCase()} API Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
`;

export const componentTemplate = (featureName, componentType = 'card') => `'use client';

import { useState } from 'react';

/**
 * ${toPascalCase(featureName)} ${toPascalCase(componentType)}
 *
 * Displays ${featureName} information with glassmorphism design
 */
interface ${toPascalCase(featureName)}${toPascalCase(componentType)}Props {
  userId: string;
}

export function ${toPascalCase(featureName)}${toPascalCase(componentType)}({ userId }: ${toPascalCase(featureName)}${toPascalCase(componentType)}Props) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="glass-card p-6 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">
          ${toTitleCase(featureName)}
        </h2>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="text-gray-400">
            {/* TODO: Add ${featureName} content */}
            <p>Content goes here</p>
          </div>
        )}
      </div>
    </div>
  );
}
`;

export const loadingTemplate = (featureName) => `/**
 * Loading State for ${toTitleCase(featureName)}
 */
export function ${toPascalCase(featureName)}Loading() {
  return (
    <div className="grid gap-6">
      {/* Skeleton loading cards */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="glass-card p-6 rounded-xl animate-pulse"
        >
          <div className="h-6 bg-gray-700/50 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700/50 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
`;

export const typeTemplate = (featureName) => `/**
 * ${toTitleCase(featureName)} Types
 *
 * TypeScript interfaces for ${featureName} feature
 */

export interface ${toPascalCase(featureName)} {
  id: string;
  user_id: string;
  // TODO: Add your fields
  created_at: string;
  updated_at: string;
}

export interface ${toPascalCase(featureName)}CreateInput {
  // TODO: Add creation fields
}

export interface ${toPascalCase(featureName)}UpdateInput {
  // TODO: Add update fields
}

export interface ${toPascalCase(featureName)}Response {
  success: boolean;
  data?: ${toPascalCase(featureName)};
  error?: string;
}
`;

// Helper functions
export function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

export function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function toTitleCase(str) {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

const templates = {
  pageTemplate,
  apiRouteTemplate,
  componentTemplate,
  loadingTemplate,
  typeTemplate,
  toPascalCase,
  toCamelCase,
  toTitleCase,
  toKebabCase
};

export default templates;
