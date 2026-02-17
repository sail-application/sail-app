#!/usr/bin/env node

/**
 * Supabase Migration Generator
 *
 * Interactive CLI tool for generating migrations with proper RLS policies,
 * indexes, and TypeScript types.
 *
 * Usage: node scripts/migration-agent/generator.js
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
dirname(__filename); // ESM equivalent of __dirname; remove if not needed

// Templates (inline for simplicity)
const templates = {
  userOwned: (tableName, columns, userIdColumn = 'user_id') => ({
    sql: `-- Create ${tableName} table
CREATE TABLE ${tableName} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
${columns.map(col => `  ${col.name} ${col.type}${col.nullable ? '' : ' NOT NULL'}${col.default ? ` DEFAULT ${col.default}` : ''}${col.references ? ` REFERENCES ${col.references}` : ''},`).join('\n')}
  ${userIdColumn} UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_${tableName}_${userIdColumn} ON ${tableName}(${userIdColumn});
CREATE INDEX idx_${tableName}_created_at ON ${tableName}(created_at DESC);
${columns.filter(c => c.index).map(c => `CREATE INDEX idx_${tableName}_${c.name} ON ${tableName}(${c.name});`).join('\n')}

-- Enable RLS
ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "${tableName}_select_own"
  ON ${tableName}
  FOR SELECT
  TO authenticated
  USING (${userIdColumn} = auth.uid());

-- Users can insert their own data
CREATE POLICY "${tableName}_insert_own"
  ON ${tableName}
  FOR INSERT
  TO authenticated
  WITH CHECK (${userIdColumn} = auth.uid());

-- Users can update their own data
CREATE POLICY "${tableName}_update_own"
  ON ${tableName}
  FOR UPDATE
  TO authenticated
  USING (${userIdColumn} = auth.uid())
  WITH CHECK (${userIdColumn} = auth.uid());

-- Users can delete their own data
CREATE POLICY "${tableName}_delete_own"
  ON ${tableName}
  FOR DELETE
  TO authenticated
  USING (${userIdColumn} = auth.uid());

-- Admins can read all data
CREATE POLICY "${tableName}_select_admin"
  ON ${tableName}
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_${tableName}_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ${tableName}_updated_at
  BEFORE UPDATE ON ${tableName}
  FOR EACH ROW
  EXECUTE FUNCTION update_${tableName}_updated_at();

-- Comments
COMMENT ON TABLE ${tableName} IS 'User-owned ${tableName} data with RLS';`,

    typescript: `export interface ${toPascalCase(tableName)} {
  id: string;
${columns.map(col => `  ${col.name}: ${sqlToTsType(col.type)}${col.nullable ? ' | null' : ''};`).join('\n')}
  ${userIdColumn}: string;
  created_at: string;
  updated_at: string;
}`
  }),

  adminOnly: (tableName, columns) => ({
    sql: `-- Create ${tableName} table (admin-only)
CREATE TABLE ${tableName} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
${columns.map(col => `  ${col.name} ${col.type}${col.nullable ? '' : ' NOT NULL'}${col.default ? ` DEFAULT ${col.default}` : ''}${col.references ? ` REFERENCES ${col.references}` : ''},`).join('\n')}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
${columns.filter(c => c.index).map(c => `CREATE INDEX idx_${tableName}_${c.name} ON ${tableName}(${c.name});`).join('\n')}

-- Enable RLS
ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;

-- Only admins can access
CREATE POLICY "${tableName}_admin_all"
  ON ${tableName}
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_${tableName}_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ${tableName}_updated_at
  BEFORE UPDATE ON ${tableName}
  FOR EACH ROW
  EXECUTE FUNCTION update_${tableName}_updated_at();

-- Comments
COMMENT ON TABLE ${tableName} IS 'Admin-only ${tableName} data';`,

    typescript: `export interface ${toPascalCase(tableName)} {
  id: string;
${columns.map(col => `  ${col.name}: ${sqlToTsType(col.type)}${col.nullable ? ' | null' : ''};`).join('\n')}
  created_at: string;
  updated_at: string;
}`
  })
};

// Helper functions
function toPascalCase(str) {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

function sqlToTsType(sqlType) {
  const typeMap = {
    'UUID': 'string',
    'TEXT': 'string',
    'VARCHAR': 'string',
    'INTEGER': 'number',
    'BIGINT': 'number',
    'NUMERIC': 'number',
    'BOOLEAN': 'boolean',
    'TIMESTAMPTZ': 'string',
    'TIMESTAMP': 'string',
    'DATE': 'string',
    'JSONB': 'Record<string, any>',
    'JSON': 'Record<string, any>'
  };

  const baseType = sqlType.split('(')[0].toUpperCase();
  return typeMap[baseType] || 'any';
}

function getTimestamp() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

// CLI prompt helper
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Main generator
async function generateMigration() {
  console.log('\n🤖 Supabase Migration Agent\n');

  const migrationName = await prompt('Migration name (e.g., "billing-tables"): ');
  const tableName = await prompt('Table name (e.g., "subscriptions"): ');
  const rlsType = await prompt('RLS type (user-owned / admin-only): ');

  console.log('\nDefine columns (empty name to finish):');
  const columns = [];

  while (true) {
    const colName = await prompt('  Column name: ');
    if (!colName) break;

    const colType = await prompt('  Column type (e.g., TEXT, INTEGER, JSONB): ');
    const nullable = (await prompt('  Nullable? (y/n): ')).toLowerCase() === 'y';
    const defaultVal = await prompt('  Default value (leave empty for none): ');
    const references = await prompt('  References (e.g., "auth.users(id)", leave empty for none): ');
    const index = (await prompt('  Create index? (y/n): ')).toLowerCase() === 'y';

    columns.push({
      name: colName,
      type: colType,
      nullable,
      default: defaultVal || null,
      references: references || null,
      index
    });
  }

  // Generate SQL and TypeScript
  const template = templates[rlsType === 'admin-only' ? 'adminOnly' : 'userOwned'];
  const generated = template(tableName, columns);

  // Create migration file
  const timestamp = getTimestamp();
  const migrationFile = `${timestamp}_${migrationName.replace(/\s+/g, '_')}.sql`;
  const migrationPath = join(process.cwd(), 'supabase', 'migrations', migrationFile);

  if (!existsSync(dirname(migrationPath))) {
    mkdirSync(dirname(migrationPath), { recursive: true });
  }

  writeFileSync(migrationPath, generated.sql);
  console.log(`\n✅ Created: supabase/migrations/${migrationFile}`);

  // Update TypeScript types (append to file)
  const typesPath = join(process.cwd(), 'types', 'database.ts');
  if (existsSync(typesPath)) {
    const existingTypes = readFileSync(typesPath, 'utf-8');
    const updatedTypes = existingTypes + '\n\n' + generated.typescript;
    writeFileSync(typesPath, updatedTypes);
    console.log(`✅ Updated: types/database.ts`);
  } else {
    console.log(`⚠️  types/database.ts not found - skipping TypeScript types`);
  }

  console.log('\n📋 Next steps:');
  console.log(`  1. Review: supabase/migrations/${migrationFile}`);
  console.log('  2. Push: npx supabase db push');
  console.log('  3. Verify: Check Supabase dashboard\n');
}

// Run
generateMigration().catch(console.error);
