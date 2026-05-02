export type UserRole = 'client' | 'supplier' | 'admin' | 'ops' | 'finance' | 'cs';
export type UserStatus = 'pending_callback' | 'callback_completed' | 'pending_kyc' | 'active' | 'suspended';
export type ActivationStatus = 'awaiting_callback' | 'callback_completed' | 'activated';
export type Language = 'en' | 'ar';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  real_name: string;
  phone: string;
  platform_alias: string;
  company_id: string;
  status: UserStatus;
  activation_status: ActivationStatus;
  callback_notes: string | null;
  activation_token: string | null;
  language: Language;
  onboarding_completed: boolean;
  auto_quote_review_window?: 'instant' | '30min' | '2hr';
  created_at: string;
  updated_at: string;
}

export type CompanyType = 'client' | 'supplier';
export type CompanyStatus = 'pending_callback' | 'callback_completed' | 'pending_kyc' | 'active' | 'suspended';
export type SignupSource = 'client_form' | 'supplier_form' | 'admin_invited';

export interface KycDoc {
  id: string;
  name: string;
  url: string;
  uploaded_at: string;
}

export interface Company {
  id: string;
  real_name: string;
  platform_alias: string;
  type: CompanyType;
  cr_number: string | null;
  vat_number: string | null;
  status: CompanyStatus;
  kyc_docs: KycDoc[];
  categories_served?: string[];
  signup_source: SignupSource;
  signup_intent: string | null;
  expected_monthly_volume_sar: number | null;
  subscription_tier: string;
  onboarding_completed: boolean;
  auto_quote_review_window?: 'instant' | '30min' | '2hr';
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  company_role_id: string;
}

export interface CompanyRole {
  id: string;
  company_id: string;
  name: string;
  permissions: string[];
}

export interface ApprovalNode {
  id: string;
  company_id: string;
  member_user_id: string;
  direct_approver_user_id: string | null;
}

export type AddressType = 'delivery' | 'billing';

export interface Address {
  id: string;
  company_id: string;
  type: AddressType;
  label: string;
  national_address_code: string;
  address_code: string;
  full_address: string;
  phone: string;
  is_default: boolean;
  deleted_at?: string | null;
}

export interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  parent_id?: string | null;
  icon_url: string;
  sort_order: number;
}

export type PackType = 'Each' | 'Box' | 'Carton' | 'Pallet' | 'Ream' | 'Pack' | 'Pair';
export type ProductStatus = 'active' | 'deprecated';

export interface MasterProduct {
  id: string;
  master_product_code: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  category_id: string;
  specs: Record<string, string>;
  images: string[];
  pack_types: PackType[];
  default_unit: string;
  status: ProductStatus;
  created_by_admin_id: string;
  created_at: string;
  updated_at: string;
}

export interface Bundle {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  image_url: string;
  description: string;
  items: BundleItem[];
}

export interface BundleItem {
  id: string;
  bundle_id: string;
  master_product_id: string;
  qty: number;
  sort_order: number;
}

export type FulfillmentMode = 'express' | 'market';
export type OfferStatus = 'active' | 'inactive';
export type OfferApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface PackTypePricing {
  pack_type: PackType;
  supplier_cost_sar: number;
  min_order_qty: number;
}

export interface Offer {
  id: string;
  master_product_id: string;
  supplier_company_id: string;
  pack_type_pricing: PackTypePricing[];
  default_lead_time_days: number;
  available_quantity_estimate: number | null;
  auto_quote_enabled: boolean;
  fulfillment_mode: FulfillmentMode;
  status: OfferStatus;
  approval_status: OfferApprovalStatus;
  supplier_internal_sku: string | null;
  supplier_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductAdditionRequestStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';

export interface ProductAdditionRequest {
  id: string;
  requested_by_user_id: string;
  supplier_company_id: string;
  proposed_name_en: string;
  proposed_name_ar: string;
  proposed_category_id: string;
  proposed_description: string;
  proposed_specs: Record<string, string>;
  sample_images: string[];
  reason_for_addition: string;
  estimated_demand: string | null;
  status: ProductAdditionRequestStatus;
  admin_notes: string | null;
  resulting_master_product_id: string | null;
  rejection_reason: string | null;
  reviewed_by_admin_id: string | null;
  created_at: string;
  decided_at: string | null;
}

export interface FavouriteList {
  id: string;
  user_id: string;
  master_product_ids: string[];
}

export interface CompanyCatalog {
  id: string;
  company_id: string;
  name: string;
  description: string;
  master_product_ids: string[];
  created_by_user_id: string;
}

export type CartStatus = 'active' | 'saved' | 'expired';

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  status: CartStatus;
  name?: string;
  expires_at?: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  master_product_id: string;
  qty: number;
  pack_type: PackType;
}

export type RFQStatus = 'draft' | 'open' | 'quoted' | 'awarded' | 'partially_awarded' | 'cancelled';
export type RFQSource = 'catalog' | 'custom_request';

export interface RFQ {
  id: string;
  rfq_number: string;
  client_company_id: string;
  created_by_user_id: string;
  title: string;
  description: string;
  category_id?: string | null;
  delivery_city: string;
  delivery_date: string;
  status: RFQStatus;
  source: RFQSource;
  items: RFQItem[];
  created_at: string;
  expires_at: string;
}

export interface RFQItem {
  id: string;
  rfq_id: string;
  master_product_id?: string | null;
  free_text_name?: string | null;
  description: string;
  qty: number;
  unit: string;
  pack_type?: string | null;
  specs_overrides?: string | null;
}

export type QuoteStatus =
  | 'draft_auto'
  | 'draft_manual'
  | 'pending_supplier_send'
  | 'pending_admin_review'
  | 'submitted_to_client'
  | 'accepted'
  | 'partially_accepted'
  | 'rejected'
  | 'expired';

export type ReviewWindow = 'instant' | '30min' | '2hr';

export interface Quote {
  id: string;
  quote_number: string;
  rfq_id: string;
  supplier_company_id: string;
  status: QuoteStatus;
  is_auto_generated: boolean;
  supplier_review_window: ReviewWindow;
  supplier_reviewed_at: string | null;
  auto_send_at: string | null;
  admin_held: boolean;
  valid_until: string;
  lead_time_days: number;
  items: QuoteItem[];
  notes: string;
  submitted_at: string | null;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  rfq_item_id: string;
  offer_id?: string | null;
  supplier_unit_price_sar: number;
  final_unit_price_sar: number;
  qty_available: number;
  lead_time_days: number;
  notes: string;
  declined: boolean;
}

export interface QuoteLineSelection {
  id: string;
  rfq_id: string;
  quote_id: string;
  quote_item_id: string;
  client_user_id: string;
  selected_at: string;
}

export type POType = 'CPO' | 'SPO';
export type POStatus =
  | 'draft'
  | 'awaiting_approval'
  | 'confirmed'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface PO {
  id: string;
  po_number: string;
  type: POType;
  transaction_ref: string;
  rfq_id?: string;
  source_quote_id?: string;
  source_quote_line_selections?: string[];
  client_company_id: string;
  supplier_company_id: string;
  status: POStatus;
  total_sar: number;
  items: POItem[];
  created_at: string;
}

export interface POItem {
  id: string;
  po_id: string;
  master_product_id: string;
  name_en: string;
  qty: number;
  pack_type: string;
  unit_price_sar: number;
  total_sar: number;
}

export type ApprovalTaskStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalTask {
  id: string;
  po_id: string;
  approver_user_id: string;
  status: ApprovalTaskStatus;
  order_in_chain: number;
  decided_at?: string | null;
  note?: string | null;
}

export interface DNItem {
  id: string;
  dn_id: string;
  master_product_id: string;
  name_en: string;
  qty_dispatched: number;
  notes: string;
}

export interface DN {
  id: string;
  dn_number: string;
  spo_id: string;
  courier: string;
  tracking_number: string;
  dispatch_date: string;
  expected_delivery_date: string;
  items: DNItem[];
}

export type GRNItemCondition = 'ok' | 'damaged' | 'short';

export interface GRNItem {
  id: string;
  grn_id: string;
  master_product_id: string;
  name_en: string;
  qty_received: number;
  condition: GRNItemCondition;
}

export interface GRN {
  id: string;
  grn_number: string;
  cpo_id: string;
  dn_id: string;
  received_by_user_id: string;
  received_at: string;
  items: GRNItem[];
  notes: string;
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  invoice_number: string;
  cpo_id: string;
  grn_id: string;
  total_sar: number;
  vat_amount_sar: number;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  zatca_uuid?: string | null;
  zatca_qr?: string | null;
  payment_intent_id?: string | null;
  wafeq_invoice_id?: string | null;
  wafeq_pdf_url?: string | null;
}

export type MarginScope = 'global' | 'category' | 'client';

export interface Margin {
  id: string;
  scope: MarginScope;
  scope_id?: string | null;
  pct: number;
  updated_by_user_id: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read_at?: string | null;
  created_at: string;
  link?: string | null;
}

export interface AuditLog {
  id: string;
  actor_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before?: unknown;
  after?: unknown;
  created_at: string;
}

export interface PlatformSettings {
  id: string;
  vat_rate: number;
  default_lead_time_days: number;
  rfq_expiry_days: number;
  auto_quote_admin_hold_threshold_sar: number;
  auto_quote_globally_enabled: boolean;
}

export interface ThreeWayMatchResult {
  matches: boolean;
  variance_pct: number;
  discrepancies: string[];
}

export interface SessionToken {
  token: string;
  user_id: string;
  role: UserRole;
  issued_at: string;
  last_seen: string;
  is_backoffice: boolean;
}
