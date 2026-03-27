-- ============================================
-- TYRO Strategy — Supabase Initial Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. USERS (MSAL sync — Azure AD users whitelist)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  azure_oid TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  department TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'Kullanıcı' CHECK (role IN ('Admin', 'Proje Lideri', 'Kullanıcı')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TAG DEFINITIONS
CREATE TABLE IF NOT EXISTS tag_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PROJELER (Projects)
CREATE TABLE IF NOT EXISTS projeler (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  source TEXT NOT NULL CHECK (source IN ('Türkiye', 'Kurumsal', 'International')),
  status TEXT NOT NULL DEFAULT 'Not Started' CHECK (status IN ('On Track', 'Achieved', 'Behind', 'At Risk', 'Not Started', 'Cancelled', 'On Hold')),
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  owner TEXT NOT NULL,
  department TEXT DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  review_date DATE,
  parent_proje_id TEXT REFERENCES projeler(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. PROJE PARTICIPANTS (many-to-many: projeler <-> users)
CREATE TABLE IF NOT EXISTS proje_participants (
  proje_id TEXT NOT NULL REFERENCES projeler(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  PRIMARY KEY (proje_id, user_email)
);

-- 5. PROJE TAGS (many-to-many: projeler <-> tag_definitions)
CREATE TABLE IF NOT EXISTS proje_tags (
  proje_id TEXT NOT NULL REFERENCES projeler(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tag_definitions(id) ON DELETE CASCADE,
  PRIMARY KEY (proje_id, tag_id)
);

-- 6. AKSIYONLAR (Actions)
CREATE TABLE IF NOT EXISTS aksiyonlar (
  id TEXT PRIMARY KEY,
  proje_id TEXT NOT NULL REFERENCES projeler(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner TEXT NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'Not Started' CHECK (status IN ('On Track', 'Achieved', 'Behind', 'At Risk', 'Not Started', 'Cancelled', 'On Hold')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. APP SETTINGS (key-value store)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. REPORT TEMPLATES
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. ROLE PERMISSIONS
CREATE TABLE IF NOT EXISTS role_permissions (
  role TEXT PRIMARY KEY,
  permissions JSONB NOT NULL DEFAULT '{}'
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_projeler_status ON projeler(status);
CREATE INDEX IF NOT EXISTS idx_projeler_source ON projeler(source);
CREATE INDEX IF NOT EXISTS idx_projeler_owner ON projeler(owner);
CREATE INDEX IF NOT EXISTS idx_projeler_department ON projeler(department);
CREATE INDEX IF NOT EXISTS idx_aksiyonlar_proje ON aksiyonlar(proje_id);
CREATE INDEX IF NOT EXISTS idx_aksiyonlar_status ON aksiyonlar(status);
CREATE INDEX IF NOT EXISTS idx_aksiyonlar_owner ON aksiyonlar(owner);
CREATE INDEX IF NOT EXISTS idx_proje_participants_email ON proje_participants(user_email);
CREATE INDEX IF NOT EXISTS idx_report_templates_owner ON report_templates(owner_email);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projeler_updated_at
  BEFORE UPDATE ON projeler
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_aksiyonlar_updated_at
  BEFORE UPDATE ON aksiyonlar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Users: herkes okuyabilir, sadece admin düzenleyebilir
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_all" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users u WHERE u.email = current_setting('app.user_email', true) AND u.role = 'Admin')
);

-- Tag definitions: herkes okuyabilir, admin düzenleyebilir
ALTER TABLE tag_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_select" ON tag_definitions FOR SELECT USING (true);
CREATE POLICY "tags_all" ON tag_definitions FOR ALL USING (
  EXISTS (SELECT 1 FROM users u WHERE u.email = current_setting('app.user_email', true) AND u.role = 'Admin')
);

-- Projeler: herkes okuyabilir (filtreleme frontend'de), admin/owner düzenleyebilir
ALTER TABLE projeler ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projeler_select" ON projeler FOR SELECT USING (true);
CREATE POLICY "projeler_insert" ON projeler FOR INSERT WITH CHECK (true);
CREATE POLICY "projeler_update" ON projeler FOR UPDATE USING (true);
CREATE POLICY "projeler_delete" ON projeler FOR DELETE USING (
  EXISTS (SELECT 1 FROM users u WHERE u.email = current_setting('app.user_email', true) AND u.role = 'Admin')
);

-- Aksiyonlar: herkes okuyabilir, ekleme/düzenleme serbest, silme admin
ALTER TABLE aksiyonlar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aksiyonlar_select" ON aksiyonlar FOR SELECT USING (true);
CREATE POLICY "aksiyonlar_insert" ON aksiyonlar FOR INSERT WITH CHECK (true);
CREATE POLICY "aksiyonlar_update" ON aksiyonlar FOR UPDATE USING (true);
CREATE POLICY "aksiyonlar_delete" ON aksiyonlar FOR DELETE USING (
  EXISTS (SELECT 1 FROM users u WHERE u.email = current_setting('app.user_email', true) AND u.role = 'Admin')
);

-- Proje participants: herkes okuyabilir
ALTER TABLE proje_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants_select" ON proje_participants FOR SELECT USING (true);
CREATE POLICY "participants_all" ON proje_participants FOR ALL USING (true);

-- Proje tags: herkes okuyabilir
ALTER TABLE proje_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proje_tags_select" ON proje_tags FOR SELECT USING (true);
CREATE POLICY "proje_tags_all" ON proje_tags FOR ALL USING (true);

-- App settings: herkes okuyabilir, admin düzenleyebilir
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select" ON app_settings FOR SELECT USING (true);
CREATE POLICY "settings_all" ON app_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM users u WHERE u.email = current_setting('app.user_email', true) AND u.role = 'Admin')
);

-- Report templates: herkes okuyabilir, sahip düzenleyebilir
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_select" ON report_templates FOR SELECT USING (true);
CREATE POLICY "templates_insert" ON report_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "templates_update" ON report_templates FOR UPDATE USING (
  owner_email = current_setting('app.user_email', true)
);
CREATE POLICY "templates_delete" ON report_templates FOR DELETE USING (
  owner_email = current_setting('app.user_email', true)
);

-- Role permissions: herkes okuyabilir, admin düzenleyebilir
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_perms_select" ON role_permissions FOR SELECT USING (true);
CREATE POLICY "role_perms_all" ON role_permissions FOR ALL USING (
  EXISTS (SELECT 1 FROM users u WHERE u.email = current_setting('app.user_email', true) AND u.role = 'Admin')
);

-- ============================================
-- SEED DATA — Default tags
-- ============================================
INSERT INTO tag_definitions (name, color) VALUES
  ('Ön Çalışma', '#D4A017'),
  ('Geliştirme', '#3b82f6'),
  ('Uygulama', '#10b981')
ON CONFLICT (name) DO NOTHING;

-- Default app settings
INSERT INTO app_settings (key, value) VALUES
  ('companyName', '"Tiryaki Agro"'),
  ('idTemplateProje', '"P{YY}-{NNNN}"'),
  ('idTemplateAksiyon', '"A{YY}-{NNNN}"')
ON CONFLICT (key) DO NOTHING;

-- Default role permissions
INSERT INTO role_permissions (role, permissions) VALUES
  ('Admin', '{"canCreateProje":true,"canEditProje":true,"canDeleteProje":true,"canCreateAksiyon":true,"canEditAksiyon":true,"canDeleteAksiyon":true,"canManageUsers":true,"canManageSettings":true,"canViewAll":true}'),
  ('Proje Lideri', '{"canCreateProje":false,"canEditProje":true,"canDeleteProje":false,"canCreateAksiyon":true,"canEditAksiyon":true,"canDeleteAksiyon":true,"canManageUsers":false,"canManageSettings":false,"canViewAll":false}'),
  ('Kullanıcı', '{"canCreateProje":false,"canEditProje":false,"canDeleteProje":false,"canCreateAksiyon":false,"canEditAksiyon":true,"canDeleteAksiyon":false,"canManageUsers":false,"canManageSettings":false,"canViewAll":false}')
ON CONFLICT (role) DO NOTHING;

-- Default admin user
INSERT INTO users (email, display_name, department, role) VALUES
  ('cenk.sayli@tiryaki.com.tr', 'Cenk Şayli', 'IT', 'Admin')
ON CONFLICT (email) DO NOTHING;
