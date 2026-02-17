/**
 * Migration Templates for SAIL
 *
 * Reusable SQL patterns for common table structures and RLS policies.
 */

// RLS Policy Templates
export const rlsPolicies = {
  // Users can read/write their own data, admins can read all
  userOwned: (tableName, userIdColumn = 'user_id') => `
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
  );`,

  // Everyone can read, only owners can write
  publicRead: (tableName, userIdColumn = 'user_id') => `
-- Enable RLS
ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "${tableName}_select_all"
  ON ${tableName}
  FOR SELECT
  TO authenticated
  USING (true);

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
  USING (${userIdColumn} = auth.uid());

-- Users can delete their own data
CREATE POLICY "${tableName}_delete_own"
  ON ${tableName}
  FOR DELETE
  TO authenticated
  USING (${userIdColumn} = auth.uid());`,

  // Only admins can access
  adminOnly: (tableName) => `
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
  );`,

  // No authentication required
  publicAccess: (tableName) => `
-- Enable RLS
ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "${tableName}_select_all"
  ON ${tableName}
  FOR SELECT
  TO anon, authenticated
  USING (true);`
};

// Common column sets
export const columnSets = {
  timestamps: `
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,

  softDelete: `
  deleted_at TIMESTAMPTZ`,

  userOwnership: `
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`,

  metadata: `
  metadata JSONB DEFAULT '{}'::jsonb`
};

// Index templates
export const indexes = {
  foreignKey: (tableName, columnName) =>
    `CREATE INDEX idx_${tableName}_${columnName} ON ${tableName}(${columnName});`,

  userIdAndTimestamp: (tableName) => `
CREATE INDEX idx_${tableName}_user_created ON ${tableName}(user_id, created_at DESC);`,

  compositeUnique: (tableName, columns) =>
    `CREATE UNIQUE INDEX idx_${tableName}_${columns.join('_')} ON ${tableName}(${columns.join(', ')});`,

  jsonbGin: (tableName, columnName) =>
    `CREATE INDEX idx_${tableName}_${columnName} ON ${tableName} USING gin(${columnName});`
};

// Trigger for updated_at timestamp
export const updatedAtTrigger = (tableName) => `
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_${tableName}_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER ${tableName}_updated_at
  BEFORE UPDATE ON ${tableName}
  FOR EACH ROW
  EXECUTE FUNCTION update_${tableName}_updated_at();`;

// Full table template
export const tableTemplate = {
  userOwnedWithTimestamps: (tableName, additionalColumns) => `
-- Create ${tableName} table
CREATE TABLE ${tableName} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ${additionalColumns}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_${tableName}_user_id ON ${tableName}(user_id);
CREATE INDEX idx_${tableName}_created_at ON ${tableName}(created_at DESC);

-- RLS Policies
${rlsPolicies.userOwned(tableName, 'user_id')}

-- Updated at trigger
${updatedAtTrigger(tableName)}

-- Comments
COMMENT ON TABLE ${tableName} IS 'User-owned ${tableName} data';`
};

const migrationTemplates = {
  rlsPolicies,
  columnSets,
  indexes,
  updatedAtTrigger,
  tableTemplate
};

export default migrationTemplates;
