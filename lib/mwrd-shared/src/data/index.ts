import { v4 as uuidv4 } from 'uuid';
import {
  seedUsers, seedCompanies, seedCompanyRoles, seedCompanyMembers,
  seedApprovalNodes, seedAddresses, seedCategories, seedMasterProducts,
  seedBundles, seedOffers, seedProductAdditionRequests, seedFavouriteLists,
  seedCompanyCatalogs, seedCarts, seedRFQs, seedQuotes, seedPOs,
  seedApprovalTasks, seedDNs, seedGRNs, seedInvoices, seedMargins,
  seedPlatformSettings, seedProductAdditionRequests as seedPARs,
  seedAuditLogs,
} from './seed.js';
import type {
  User, Company, CompanyMember, CompanyRole, ApprovalNode, Address,
  Category, MasterProduct, Bundle, Cart, CartItem, RFQ, RFQItem, Quote,
  QuoteItem, PO, POItem, ApprovalTask, DN, GRN, GRNItem, Invoice, Margin,
  Notification, AuditLog, PlatformSettings, FavouriteList, CompanyCatalog,
  ProductAdditionRequest, Offer, SessionToken, QuoteLineSelection,
  PackType, ThreeWayMatchResult,
} from '../types/index.js';
import {
  generateClientAlias, generateSupplierAlias,
} from '../utils/aliases.js';
import { applyMargin, resolveMargin } from '../utils/margins.js';
import { generateDocNumber, newId, nowISO, addDays } from '../utils/numbers.js';
import { matchOffersToRFQ, generateAutoQuote, processAutoSendQueue } from '../utils/auto-quote.js';
import { computeApprovalChain, detectCycle } from '../utils/approval-chain.js';
import { matchPOGRNInvoice } from '../utils/three-way-match.js';
import { createMoyasarPaymentIntent } from '../utils/moyasar.js';
import { issueWafeqInvoice } from '../utils/wafeq.js';

const users = new Map<string, User>(seedUsers.map((u) => [u.id, u]));
const companies = new Map<string, Company>(seedCompanies.map((c) => [c.id, c]));
const companyRoles = new Map<string, CompanyRole>(seedCompanyRoles.map((r) => [r.id, r]));
const companyMembers = new Map<string, CompanyMember>(seedCompanyMembers.map((m) => [m.id, m]));
const approvalNodes = new Map<string, ApprovalNode>(seedApprovalNodes.map((n) => [n.id, n]));
const addresses = new Map<string, Address>(seedAddresses.map((a) => [a.id, a]));
const categories = new Map<string, Category>(seedCategories.map((c) => [c.id, c]));
const masterProducts = new Map<string, MasterProduct>(seedMasterProducts.map((p) => [p.id, p]));
const bundles = new Map<string, Bundle>(seedBundles.map((b) => [b.id, b]));
const offers = new Map<string, Offer>(seedOffers.map((o) => [o.id, o]));
const productAdditionRequests = new Map<string, ProductAdditionRequest>(seedPARs.map((p) => [p.id, p]));
const favouriteLists = new Map<string, FavouriteList>(seedFavouriteLists.map((f) => [f.user_id, f]));
const companyCatalogs = new Map<string, CompanyCatalog>(seedCompanyCatalogs.map((c) => [c.id, c]));
const carts = new Map<string, Cart>(seedCarts.map((c) => [c.id, c]));
const rfqs = new Map<string, RFQ>(seedRFQs.map((r) => [r.id, r]));
const quotes = new Map<string, Quote>(seedQuotes.map((q) => [q.id, q]));
const pos = new Map<string, PO>(seedPOs.map((p) => [p.id, p]));
const approvalTasks = new Map<string, ApprovalTask>(seedApprovalTasks.map((t) => [t.id, t]));
const dns = new Map<string, DN>(seedDNs.map((d) => [d.id, d]));
const grns = new Map<string, GRN>(seedGRNs.map((g) => [g.id, g]));
const invoices = new Map<string, Invoice>(seedInvoices.map((i) => [i.id, i]));
const margins = new Map<string, Margin>(seedMargins.map((m) => [m.id, m]));
const notifications = new Map<string, Notification>();
const auditLogs = new Map<string, AuditLog>(seedAuditLogs.map((a) => [a.id, a]));
const sessionTokens = new Map<string, SessionToken>();
const quoteLineSelections = new Map<string, QuoteLineSelection>();
let platformSettings = { ...seedPlatformSettings };

function recordAudit(actor_user_id: string, action: string, entity_type: string, entity_id: string, before?: unknown, after?: unknown): void {
  const id = newId();
  auditLogs.set(id, { id, actor_user_id, action, entity_type, entity_id, before, after, created_at: nowISO() });
}

export async function sendNotification(user_id: string, type: string, title: string, body: string, link?: string): Promise<void> {
  const id = newId();
  const n: Notification = { id, user_id, type, title, body, read_at: null, created_at: nowISO(), link };
  notifications.set(id, n);
  console.log(`[NOTIFICATION] To ${user_id}: ${title} - ${body}${link ? ` (${link})` : ''}`);
}

export async function registerPublic(payload: {
  full_name: string;
  email: string;
  phone: string;
  account_type: 'client' | 'supplier';
  company_name: string;
}): Promise<{ user: User; message: string }> {
  const existing = [...users.values()].find((u) => u.email === payload.email);
  if (existing) throw new Error('Email already registered');

  const userId = newId();
  const companyId = newId();
  const takenAliases = [...companies.values()].map((c) => c.platform_alias);
  const alias =
    payload.account_type === 'client'
      ? generateClientAlias()
      : generateSupplierAlias(takenAliases);

  const company: Company = {
    id: companyId,
    real_name: payload.company_name,
    platform_alias: alias,
    type: payload.account_type,
    cr_number: null,
    vat_number: null,
    status: 'pending_callback',
    kyc_docs: [],
    categories_served: payload.account_type === 'supplier' ? [] : undefined,
    signup_source: payload.account_type === 'client' ? 'client_form' : 'supplier_form',
    signup_intent: null,
    expected_monthly_volume_sar: null,
    subscription_tier: 'enterprise',
    onboarding_completed: false,
    created_at: nowISO(),
    updated_at: nowISO(),
  };

  const user: User = {
    id: userId,
    email: payload.email,
    password_hash: '',
    role: payload.account_type,
    real_name: payload.full_name,
    phone: payload.phone,
    platform_alias: alias,
    company_id: companyId,
    status: 'pending_callback',
    activation_status: 'awaiting_callback',
    callback_notes: null,
    activation_token: null,
    language: 'en',
    onboarding_completed: false,
    created_at: nowISO(),
    updated_at: nowISO(),
  };

  companies.set(companyId, company);
  users.set(userId, user);

  return { user, message: "Registration received. We'll call you within 24 hours to verify your details." };
}

export async function markCallbackComplete(userId: string, notes: string, actorAdminId: string): Promise<User> {
  const user = users.get(userId);
  if (!user) throw new Error('User not found');
  const token = `act_${uuidv4().replace(/-/g, '')}`;
  const updated: User = { ...user, activation_status: 'callback_completed', status: 'callback_completed', callback_notes: notes, activation_token: token, updated_at: nowISO() };
  users.set(userId, updated);
  await sendNotification(userId, 'activation', 'Account Verified - Set Your Password', `Your account has been verified. Click to set your password: /activate?token=${token}`, `/activate?token=${token}`);
  console.log(`[ACTIVATION LINK] /activate?token=${token}`);
  recordAudit(actorAdminId, 'CALLBACK_COMPLETED', 'User', userId, { activation_status: user.activation_status }, { activation_status: 'callback_completed' });
  return updated;
}

export async function activateAccount(token: string, password: string): Promise<{ user: User; sessionToken: string }> {
  const user = [...users.values()].find((u) => u.activation_token === token);
  if (!user) throw new Error('Invalid or expired activation token');
  const updated: User = { ...user, password_hash: password, status: 'active', activation_status: 'activated', activation_token: null, updated_at: nowISO() };
  users.set(user.id, updated);
  const sessionToken = `sess_pub_${uuidv4()}`;
  sessionTokens.set(sessionToken, { token: sessionToken, user_id: user.id, role: user.role, issued_at: nowISO(), last_seen: nowISO(), is_backoffice: false });
  return { user: updated, sessionToken };
}

export async function signIn(email: string, password: string): Promise<{ user: User; sessionToken: string } | null> {
  const user = [...users.values()].find((u) => u.email === email && u.password_hash === password);
  if (!user) return null;
  const sessionToken = `sess_pub_${uuidv4()}`;
  sessionTokens.set(sessionToken, { token: sessionToken, user_id: user.id, role: user.role, issued_at: nowISO(), last_seen: nowISO(), is_backoffice: false });
  return { user, sessionToken };
}

export async function signOut(token: string): Promise<void> {
  sessionTokens.delete(token);
}

export async function getCurrentUser(token: string): Promise<User | null> {
  const session = sessionTokens.get(token);
  if (!session) return null;
  session.last_seen = nowISO();
  return users.get(session.user_id) ?? null;
}

export async function completeOnboarding(userId: string, payload: {
  cr_number?: string;
  vat_number?: string;
  full_address?: string;
  categories_served?: string[];
}): Promise<{ user: User; company: Company }> {
  const user = users.get(userId);
  if (!user) throw new Error('User not found');
  const company = companies.get(user.company_id);
  if (!company) throw new Error('Company not found');
  const updatedCompany: Company = {
    ...company,
    cr_number: payload.cr_number ?? company.cr_number,
    vat_number: payload.vat_number ?? company.vat_number,
    categories_served: payload.categories_served ?? company.categories_served,
    onboarding_completed: true,
    updated_at: nowISO(),
  };
  const updatedUser: User = { ...user, onboarding_completed: true, updated_at: nowISO() };
  companies.set(company.id, updatedCompany);
  users.set(userId, updatedUser);
  return { user: updatedUser, company: updatedCompany };
}

export async function signInBackoffice(email: string, password: string): Promise<{ user: User; sessionToken: string } | null> {
  const backofficeRoles = ['admin', 'ops', 'finance', 'cs'];
  const user = [...users.values()].find((u) => u.email === email && u.password_hash === password && backofficeRoles.includes(u.role));
  if (!user) return null;
  const sessionToken = `sess_bo_${uuidv4()}`;
  sessionTokens.set(sessionToken, { token: sessionToken, user_id: user.id, role: user.role, issued_at: nowISO(), last_seen: nowISO(), is_backoffice: true });
  return { user, sessionToken };
}

export async function getBackofficeSession(token: string): Promise<User | null> {
  const session = sessionTokens.get(token);
  if (!session || !session.is_backoffice) return null;
  const backofficeRoles = ['admin', 'ops', 'finance', 'cs'];
  if (!backofficeRoles.includes(session.role)) return null;
  // Keep backoffice sessions valid for 24h, matching the public session lifetime.
  // The previous 15-minute idle window was logging admins out mid-task because the
  // dashboard's stats / audit-log queries fire less frequently than every 15 min.
  const idleCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  if (session.last_seen < idleCutoff) {
    sessionTokens.delete(token);
    return null;
  }
  session.last_seen = nowISO();
  return users.get(session.user_id) ?? null;
}

export async function inviteInternalUser(email: string, name: string, role: string, actorSuperadminId: string): Promise<User> {
  const companyId = 'admin-company-001';
  const userId = newId();
  const token = `act_internal_${uuidv4().replace(/-/g, '')}`;
  const user: User = {
    id: userId, email, password_hash: '', role: role as User['role'], real_name: name, phone: '',
    platform_alias: 'Admin', company_id: companyId, status: 'pending_callback',
    activation_status: 'awaiting_callback', callback_notes: null, activation_token: token,
    language: 'en', onboarding_completed: true, created_at: nowISO(), updated_at: nowISO(),
  };
  users.set(userId, user);
  console.log(`[INTERNAL ACTIVATION LINK] /internal/activate?token=${token}`);
  recordAudit(actorSuperadminId, 'INTERNAL_USER_INVITED', 'User', userId, null, { email, role });
  return user;
}

export async function activateInternalUser(token: string, password: string): Promise<{ user: User; sessionToken: string }> {
  const user = [...users.values()].find((u) => u.activation_token === token);
  if (!user) throw new Error('Invalid token');
  const updated: User = { ...user, password_hash: password, status: 'active', activation_status: 'activated', activation_token: null, updated_at: nowISO() };
  users.set(user.id, updated);
  const sessionToken = `sess_bo_${uuidv4()}`;
  sessionTokens.set(sessionToken, { token: sessionToken, user_id: user.id, role: user.role, issued_at: nowISO(), last_seen: nowISO(), is_backoffice: true });
  return { user: updated, sessionToken };
}

export async function listCategories(): Promise<Category[]> {
  return [...categories.values()].sort((a, b) => a.sort_order - b.sort_order);
}

export async function listMasterProducts(filters: {
  category_id?: string;
  search?: string;
  status?: 'active' | 'deprecated';
  page?: number;
  limit?: number;
} = {}): Promise<{ data: MasterProduct[]; total: number }> {
  let data = [...masterProducts.values()].filter((p) => {
    if (filters.status ? p.status !== filters.status : p.status === 'deprecated') return false;
    if (filters.category_id) {
      const cat = categories.get(p.category_id);
      if (p.category_id !== filters.category_id && cat?.parent_id !== filters.category_id) return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!p.name_en.toLowerCase().includes(q) && !p.name_ar.includes(q) && !p.master_product_code.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const total = data.length;
  const page = filters.page ?? 1;
  const lim = filters.limit ?? 25;
  data = data.slice((page - 1) * lim, page * lim);
  return { data, total };
}

export async function getMasterProduct(id: string): Promise<MasterProduct | null> {
  return masterProducts.get(id) ?? null;
}

export async function createMasterProduct(actorAdminId: string, input: Omit<MasterProduct, 'id' | 'master_product_code' | 'created_by_admin_id' | 'created_at' | 'updated_at'>): Promise<MasterProduct> {
  const id = newId();
  const seq = masterProducts.size + 1;
  const product: MasterProduct = { ...input, id, master_product_code: `mwrd-PROD-${seq.toString().padStart(5, '0')}`, created_by_admin_id: actorAdminId, created_at: nowISO(), updated_at: nowISO() };
  masterProducts.set(id, product);
  recordAudit(actorAdminId, 'MASTER_PRODUCT_CREATED', 'MasterProduct', id, null, product);
  return product;
}

export async function updateMasterProduct(id: string, patch: Partial<MasterProduct>, actorAdminId: string): Promise<MasterProduct> {
  const product = masterProducts.get(id);
  if (!product) throw new Error('Product not found');
  const updated = { ...product, ...patch, id, updated_at: nowISO() };
  masterProducts.set(id, updated);
  recordAudit(actorAdminId, 'MASTER_PRODUCT_UPDATED', 'MasterProduct', id, product, updated);
  return updated;
}

export async function deprecateMasterProduct(id: string, actorAdminId: string): Promise<MasterProduct> {
  return updateMasterProduct(id, { status: 'deprecated' }, actorAdminId);
}

export async function createCategory(input: Omit<Category, 'id'>, actorAdminId: string): Promise<Category> {
  const id = newId();
  const cat: Category = { ...input, id };
  categories.set(id, cat);
  recordAudit(actorAdminId, 'CATEGORY_CREATED', 'Category', id, null, cat);
  return cat;
}

export async function updateCategory(id: string, patch: Partial<Category>, actorAdminId: string): Promise<Category> {
  const cat = categories.get(id);
  if (!cat) throw new Error('Category not found');
  const updated = { ...cat, ...patch, id };
  categories.set(id, updated);
  recordAudit(actorAdminId, 'CATEGORY_UPDATED', 'Category', id, cat, updated);
  return updated;
}

export async function listOffersForSupplier(supplierCompanyId: string, filters: {
  master_product_id?: string;
  category?: string;
  status?: string;
  approval_status?: string;
  auto_quote_enabled?: boolean;
  page?: number;
} = {}): Promise<{ data: Offer[]; total: number }> {
  let data = [...offers.values()].filter((o) => {
    if (o.supplier_company_id !== supplierCompanyId) return false;
    if (filters.master_product_id && o.master_product_id !== filters.master_product_id) return false;
    if (filters.status && o.status !== filters.status) return false;
    if (filters.approval_status && o.approval_status !== filters.approval_status) return false;
    if (filters.auto_quote_enabled !== undefined && o.auto_quote_enabled !== filters.auto_quote_enabled) return false;
    return true;
  });
  const total = data.length;
  const page = filters.page ?? 1;
  data = data.slice((page - 1) * 25, page * 25);
  return { data, total };
}

export async function getOffer(id: string, viewerSupplierId: string): Promise<Offer | null> {
  const offer = offers.get(id);
  if (!offer) return null;
  if (offer.supplier_company_id !== viewerSupplierId) return null;
  return offer;
}

export async function createOffer(supplierUserId: string, masterProductId: string, input: Omit<Offer, 'id' | 'master_product_id' | 'supplier_company_id' | 'approval_status' | 'status' | 'created_at' | 'updated_at'>): Promise<Offer> {
  const user = users.get(supplierUserId);
  if (!user) throw new Error('User not found');
  const id = newId();
  const offer: Offer = { ...input, id, master_product_id: masterProductId, supplier_company_id: user.company_id, approval_status: 'pending', status: 'active', created_at: nowISO(), updated_at: nowISO() };
  offers.set(id, offer);
  return offer;
}

export async function updateOffer(id: string, patch: Partial<Offer>, supplierUserId: string): Promise<Offer> {
  const offer = offers.get(id);
  if (!offer) throw new Error('Offer not found');
  const user = users.get(supplierUserId);
  if (!user || offer.supplier_company_id !== user.company_id) throw new Error('Unauthorized');
  const updated = { ...offer, ...patch, id, updated_at: nowISO() };
  offers.set(id, updated);
  return updated;
}

export async function approveOffer(offerId: string, actorAdminId: string): Promise<Offer> {
  const offer = offers.get(offerId);
  if (!offer) throw new Error('Offer not found');
  const updated = { ...offer, approval_status: 'approved' as const, status: 'active' as const, updated_at: nowISO() };
  offers.set(offerId, updated);
  recordAudit(actorAdminId, 'OFFER_APPROVED', 'Offer', offerId, { approval_status: offer.approval_status }, { approval_status: 'approved' });
  return updated;
}

export async function rejectOffer(offerId: string, reason: string, actorAdminId: string): Promise<Offer> {
  const offer = offers.get(offerId);
  if (!offer) throw new Error('Offer not found');
  const updated = { ...offer, approval_status: 'rejected' as const, supplier_notes: reason, updated_at: nowISO() };
  offers.set(offerId, updated);
  recordAudit(actorAdminId, 'OFFER_REJECTED', 'Offer', offerId, { approval_status: offer.approval_status }, { approval_status: 'rejected' });
  return updated;
}

export async function listPendingOffers(actorAdminId: string): Promise<Offer[]> {
  void actorAdminId;
  return [...offers.values()].filter((o) => o.approval_status === 'pending');
}

export async function createProductAdditionRequest(supplierUserId: string, input: Omit<ProductAdditionRequest, 'id' | 'requested_by_user_id' | 'supplier_company_id' | 'status' | 'admin_notes' | 'resulting_master_product_id' | 'rejection_reason' | 'reviewed_by_admin_id' | 'created_at' | 'decided_at'>): Promise<ProductAdditionRequest> {
  const user = users.get(supplierUserId);
  if (!user) throw new Error('User not found');
  const id = newId();
  const par: ProductAdditionRequest = { ...input, id, requested_by_user_id: supplierUserId, supplier_company_id: user.company_id, status: 'submitted', admin_notes: null, resulting_master_product_id: null, rejection_reason: null, reviewed_by_admin_id: null, created_at: nowISO(), decided_at: null };
  productAdditionRequests.set(id, par);
  return par;
}

export async function listMyProductAdditionRequests(supplierCompanyId: string): Promise<ProductAdditionRequest[]> {
  return [...productAdditionRequests.values()].filter((p) => p.supplier_company_id === supplierCompanyId);
}

export async function listAllProductAdditionRequests(filters: { status?: string; page?: number } = {}, actorAdminId: string): Promise<{ data: ProductAdditionRequest[]; total: number }> {
  void actorAdminId;
  let data = [...productAdditionRequests.values()];
  if (filters.status) data = data.filter((p) => p.status === filters.status);
  const total = data.length;
  const page = filters.page ?? 1;
  return { data: data.slice((page - 1) * 25, page * 25), total };
}

export async function approveProductAdditionRequest(requestId: string, masterProductInput: Omit<MasterProduct, 'id' | 'master_product_code' | 'created_by_admin_id' | 'created_at' | 'updated_at'>, actorAdminId: string): Promise<{ request: ProductAdditionRequest; masterProduct: MasterProduct }> {
  const request = productAdditionRequests.get(requestId);
  if (!request) throw new Error('Request not found');
  const masterProduct = await createMasterProduct(actorAdminId, masterProductInput);
  const updated: ProductAdditionRequest = { ...request, status: 'approved', resulting_master_product_id: masterProduct.id, reviewed_by_admin_id: actorAdminId, decided_at: nowISO() };
  productAdditionRequests.set(requestId, updated);
  await sendNotification(request.requested_by_user_id, 'par_approved', 'Product Addition Approved', `Your product addition request for "${request.proposed_name_en}" has been approved and added to the master catalog.`);
  recordAudit(actorAdminId, 'PAR_APPROVED', 'ProductAdditionRequest', requestId, { status: request.status }, { status: 'approved', resulting_master_product_id: masterProduct.id });
  return { request: updated, masterProduct };
}

export async function rejectProductAdditionRequest(requestId: string, reason: string, actorAdminId: string): Promise<ProductAdditionRequest> {
  const request = productAdditionRequests.get(requestId);
  if (!request) throw new Error('Request not found');
  const updated: ProductAdditionRequest = { ...request, status: 'rejected', rejection_reason: reason, reviewed_by_admin_id: actorAdminId, decided_at: nowISO() };
  productAdditionRequests.set(requestId, updated);
  await sendNotification(request.requested_by_user_id, 'par_rejected', 'Product Addition Request Update', `Your product addition request for "${request.proposed_name_en}" was not approved: ${reason}`);
  recordAudit(actorAdminId, 'PAR_REJECTED', 'ProductAdditionRequest', requestId, { status: request.status }, { status: 'rejected' });
  return updated;
}

export async function listBundles(): Promise<Bundle[]> {
  return [...bundles.values()];
}

export async function getBundle(slug: string): Promise<Bundle | null> {
  return [...bundles.values()].find((b) => b.slug === slug) ?? null;
}

export async function addBundleToCart(userId: string, bundleId: string): Promise<Cart> {
  const bundle = bundles.get(bundleId);
  if (!bundle) throw new Error('Bundle not found');
  for (const item of bundle.items) {
    await addToCart(userId, item.master_product_id, item.qty, 'Each');
  }
  return getActiveCart(userId);
}

export async function getActiveCart(userId: string): Promise<Cart> {
  const active = [...carts.values()].find((c) => c.user_id === userId && c.status === 'active');
  if (active) return active;
  const id = newId();
  const cart: Cart = { id, user_id: userId, items: [], status: 'active' };
  carts.set(id, cart);
  return cart;
}

export async function addToCart(userId: string, masterProductId: string, qty: number, packType: PackType): Promise<Cart> {
  const cart = await getActiveCart(userId);
  const existing = cart.items.find((i) => i.master_product_id === masterProductId && i.pack_type === packType);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.items.push({ id: newId(), cart_id: cart.id, master_product_id: masterProductId, qty, pack_type: packType });
  }
  carts.set(cart.id, cart);
  return cart;
}

export async function updateCartItem(userId: string, cartItemId: string, patch: Partial<CartItem>): Promise<Cart> {
  const cart = await getActiveCart(userId);
  const idx = cart.items.findIndex((i) => i.id === cartItemId);
  if (idx === -1) throw new Error('Cart item not found');
  cart.items[idx] = { ...cart.items[idx], ...patch };
  carts.set(cart.id, cart);
  return cart;
}

export async function removeFromCart(userId: string, cartItemId: string): Promise<Cart> {
  const cart = await getActiveCart(userId);
  cart.items = cart.items.filter((i) => i.id !== cartItemId);
  carts.set(cart.id, cart);
  return cart;
}

export async function saveCart(userId: string, name: string): Promise<Cart> {
  const cart = await getActiveCart(userId);
  const saved: Cart = { ...cart, status: 'saved', name, expires_at: addDays(new Date(), 7) };
  carts.set(cart.id, saved);
  const newActive: Cart = { id: newId(), user_id: userId, items: [], status: 'active' };
  carts.set(newActive.id, newActive);
  return saved;
}

export async function listSavedCarts(userId: string): Promise<Cart[]> {
  return [...carts.values()].filter((c) => c.user_id === userId && c.status === 'saved');
}

export async function resumeSavedCart(cartId: string): Promise<Cart> {
  const saved = carts.get(cartId);
  if (!saved || saved.status !== 'saved') throw new Error('Saved cart not found');
  const active = await getActiveCart(saved.user_id);
  active.items = [...saved.items.map((i) => ({ ...i, cart_id: active.id }))];
  carts.set(active.id, active);
  return active;
}

export async function submitCartAsRFQ(cartId: string, rfqMeta: { title: string; delivery_city: string; delivery_date: string; description: string }): Promise<RFQ> {
  const cart = carts.get(cartId) ?? [...carts.values()].find((c) => c.id === cartId);
  if (!cart) throw new Error('Cart not found');
  const user = [...users.values()].find((u) => u.id === cart.user_id);
  if (!user) throw new Error('User not found');
  return createRFQ(cart.user_id, {
    ...rfqMeta,
    items: cart.items.map((ci) => {
      const prod = masterProducts.get(ci.master_product_id);
      return {
        master_product_id: ci.master_product_id,
        description: prod?.name_en ?? '',
        qty: ci.qty,
        unit: ci.pack_type,
        pack_type: ci.pack_type,
      };
    }),
  }, 'catalog');
}

export async function createRFQ(clientUserId: string, input: {
  title: string;
  delivery_city: string;
  delivery_date: string;
  description: string;
  items: Array<{ master_product_id?: string; free_text_name?: string; description: string; qty: number; unit: string; pack_type?: string; specs_overrides?: string }>;
}, source: 'catalog' | 'custom_request'): Promise<RFQ> {
  const user = users.get(clientUserId);
  if (!user) throw new Error('User not found');
  const id = newId();
  const rfq: RFQ = {
    id,
    rfq_number: generateDocNumber('RFQ'),
    client_company_id: user.company_id,
    created_by_user_id: clientUserId,
    title: input.title,
    description: input.description,
    delivery_city: input.delivery_city,
    delivery_date: input.delivery_date,
    status: 'open',
    source,
    items: input.items.map((item) => ({
      id: newId(),
      rfq_id: id,
      master_product_id: item.master_product_id ?? null,
      free_text_name: item.free_text_name ?? null,
      description: item.description,
      qty: item.qty,
      unit: item.unit,
      pack_type: item.pack_type ?? null,
      specs_overrides: item.specs_overrides ?? null,
    })),
    created_at: nowISO(),
    expires_at: addDays(new Date(), platformSettings.rfq_expiry_days),
  };
  rfqs.set(id, rfq);

  // Always seed quotes + notify suppliers/admins so RFQs are visible across the platform.
  // Auto-matching only runs when the catalog flow is enabled; otherwise we still create
  // draft_manual quotes for active suppliers and notify everyone.
  const runAutoMatch = source === 'catalog' && platformSettings.auto_quote_globally_enabled;
  await runAutoQuoteEngine(rfq, runAutoMatch);

  // Notify mwrd admin / ops staff
  const staff = [...users.values()].filter((u) => u.role === 'admin' || u.role === 'ops');
  for (const s of staff) {
    await sendNotification(
      s.id,
      'rfq_submitted',
      'New RFQ Submitted',
      `${user.email} submitted "${rfq.title}" (${rfq.rfq_number}).`,
      `/backoffice/rfqs/${rfq.id}`,
    );
  }

  return rfq;
}

async function runAutoQuoteEngine(rfq: RFQ, runAutoMatch: boolean = true): Promise<void> {
  const matchMap = runAutoMatch
    ? matchOffersToRFQ(rfq, [...offers.values()])
    : new Map<string, { matched_items: Array<{ rfq_item: import('../types/index.js').RFQItem; offer: import('../types/index.js').Offer }>; unmatched_rfq_items: import('../types/index.js').RFQItem[] }>();

  for (const [supplierId, { matched_items }] of matchMap.entries()) {
    const supplierCompany = companies.get(supplierId);
    if (!supplierCompany) continue;
    const marginPct = resolveMargin([...margins.values()], rfq.category_id ?? '', rfq.client_company_id);
    const quote = generateAutoQuote(rfq, supplierId, matched_items, supplierCompany);
    quote.items = quote.items.map((item) => ({
      ...item,
      final_unit_price_sar: applyMargin(item.supplier_unit_price_sar, marginPct),
    }));
    quotes.set(quote.id, quote);
    const supplierUser = [...users.values()].find((u) => u.company_id === supplierId);
    if (supplierUser) {
      await sendNotification(supplierUser.id, 'new_rfq', 'New RFQ Match', `You've been matched to a new RFQ: ${rfq.title}`, `/rfqs/${rfq.id}`);
    }
  }

  // Every other active supplier gets a manual draft quote so they can submit pricing,
  // and a notification so they actually know it's there.
  const allActiveSuppliers = [...companies.values()].filter(
    (c) => c.type === 'supplier' && c.status === 'active',
  );
  for (const supplier of allActiveSuppliers) {
    if (matchMap.has(supplier.id)) continue;
    const manualQuoteId = newId();
    const manualQuote: Quote = {
      id: manualQuoteId, quote_number: generateDocNumber('Q'), rfq_id: rfq.id,
      supplier_company_id: supplier.id, status: 'draft_manual', is_auto_generated: false,
      supplier_review_window: '30min', supplier_reviewed_at: null, auto_send_at: null,
      admin_held: false, valid_until: addDays(new Date(), 14), lead_time_days: 7,
      items: rfq.items.map((it) => ({
        id: newId(),
        quote_id: manualQuoteId,
        rfq_item_id: it.id,
        offer_id: null,
        supplier_unit_price_sar: 0,
        final_unit_price_sar: 0,
        qty_available: it.qty,
        lead_time_days: 7,
        notes: '',
        declined: false,
      })),
      notes: '', submitted_at: null,
    };
    quotes.set(manualQuoteId, manualQuote);
    const supplierUser = [...users.values()].find((u) => u.company_id === supplier.id);
    if (supplierUser) {
      await sendNotification(
        supplierUser.id,
        'new_rfq',
        'New RFQ Available',
        `Quote requested: ${rfq.title} (${rfq.rfq_number}).`,
        `/rfqs/${rfq.id}`,
      );
    }
  }
}

/**
 * Process the auto-send queue: any draft_auto quote whose supplier review
 * window has expired gets margin applied and is either sent to the client
 * or held for admin review based on the platform threshold.
 *
 * Called on a periodic tick from the API server (Phase 1) and intended to
 * become a Supabase scheduled function in Phase 2.
 */
export async function tickAutoSendQueue(now: Date = new Date()): Promise<{ sent: number; held: number }> {
  const all = [...quotes.values()];
  const { to_send_to_client, to_hold_for_admin } = processAutoSendQueue(
    all,
    now,
    platformSettings.auto_quote_admin_hold_threshold_sar,
  );
  for (const quote of to_send_to_client) {
    const rfq = rfqs.get(quote.rfq_id);
    const marginPct = resolveMargin([...margins.values()], rfq?.category_id ?? '', rfq?.client_company_id ?? '');
    const updated: Quote = {
      ...quote,
      status: 'submitted_to_client',
      submitted_at: nowISO(),
      items: quote.items.map((i) => ({ ...i, final_unit_price_sar: applyMargin(i.supplier_unit_price_sar, marginPct) })),
    };
    quotes.set(quote.id, updated);
    if (rfq) {
      rfqs.set(rfq.id, { ...rfq, status: 'quoted' });
      const clientUser = [...users.values()].find((u) => u.company_id === rfq.client_company_id);
      if (clientUser) await sendNotification(clientUser.id, 'quote_received', 'Quote Received', `A quote has been submitted for your RFQ: ${rfq.title}`, `/rfqs/${rfq.id}`);
    }
  }
  for (const quote of to_hold_for_admin) {
    const rfq = rfqs.get(quote.rfq_id);
    const marginPct = resolveMargin([...margins.values()], rfq?.category_id ?? '', rfq?.client_company_id ?? '');
    const updated: Quote = {
      ...quote,
      status: 'pending_admin_review',
      admin_held: true,
      submitted_at: nowISO(),
      items: quote.items.map((i) => ({ ...i, final_unit_price_sar: applyMargin(i.supplier_unit_price_sar, marginPct) })),
    };
    quotes.set(quote.id, updated);
    const adminStaff = [...users.values()].filter((u) => u.role === 'admin' || u.role === 'ops');
    for (const a of adminStaff) {
      await sendNotification(a.id, 'quote_admin_review', 'Quote Awaiting Review', `Auto-quote ${quote.quote_number} exceeds threshold and needs admin review.`, `/backoffice/quote-manager`);
    }
  }
  return { sent: to_send_to_client.length, held: to_hold_for_admin.length };
}

export async function listRFQsForClient(clientCompanyId: string, filters: { status?: string; page?: number } = {}): Promise<{ data: RFQ[]; total: number }> {
  let data = [...rfqs.values()].filter((r) => {
    if (r.client_company_id !== clientCompanyId) return false;
    if (filters.status && r.status !== filters.status) return false;
    return true;
  }).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const total = data.length;
  const page = filters.page ?? 1;
  return { data: data.slice((page - 1) * 25, page * 25), total };
}

export async function listOpenRFQsForSupplier(supplierCompanyId: string, filters: { page?: number } = {}): Promise<{ data: RFQ[]; total: number }> {
  const supplierQuotes = [...quotes.values()].filter((q) => q.supplier_company_id === supplierCompanyId);
  const rfqIds = new Set(supplierQuotes.map((q) => q.rfq_id));
  let data = [...rfqs.values()].filter((r) => rfqIds.has(r.id) && ['open', 'quoted'].includes(r.status))
    .map((r) => ({ ...r, client_company_id: '' }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const total = data.length;
  const page = filters.page ?? 1;
  return { data: data.slice((page - 1) * 25, page * 25) as RFQ[], total };
}

export async function getRFQ(id: string, viewerId: string): Promise<RFQ | null> {
  const rfq = rfqs.get(id);
  if (!rfq) return null;
  const viewer = users.get(viewerId);
  if (!viewer) return null;
  if (viewer.role === 'client' || viewer.role === 'admin' || viewer.role === 'ops') return rfq;
  if (viewer.role === 'supplier') return { ...rfq, client_company_id: '' };
  return rfq;
}

export async function listQuotesForSupplier(supplierCompanyId: string, filters: { status?: string; page?: number } = {}): Promise<{ data: Quote[]; total: number }> {
  let data = [...quotes.values()].filter((q) => {
    if (q.supplier_company_id !== supplierCompanyId) return false;
    if (filters.status && q.status !== filters.status) return false;
    return true;
  }).sort((a, b) => (b.submitted_at ?? b.auto_send_at ?? '').localeCompare(a.submitted_at ?? a.auto_send_at ?? ''));
  const total = data.length;
  const page = filters.page ?? 1;
  return { data: data.slice((page - 1) * 25, page * 25), total };
}

export async function getQuote(id: string, viewerId: string): Promise<Quote | null> {
  const quote = quotes.get(id);
  if (!quote) return null;
  const viewer = users.get(viewerId);
  if (!viewer) return null;
  if (viewer.role === 'admin' || viewer.role === 'ops' || viewer.role === 'finance') return quote;
  const viewerCompany = companies.get(viewer.company_id);
  if (viewer.role === 'supplier' && viewerCompany?.id === quote.supplier_company_id) {
    return { ...quote, items: quote.items.map((i) => ({ ...i, final_unit_price_sar: 0 })) };
  }
  if (viewer.role === 'client') {
    const rfq = rfqs.get(quote.rfq_id);
    if (rfq?.client_company_id !== viewerCompany?.id) return null;
    return { ...quote, items: quote.items.map((i) => ({ ...i, supplier_unit_price_sar: 0 })) };
  }
  return null;
}

export async function editQuoteBeforeSend(quoteId: string, patch: Partial<Quote>, supplierUserId: string): Promise<Quote> {
  const quote = quotes.get(quoteId);
  if (!quote) throw new Error('Quote not found');
  const user = users.get(supplierUserId);
  if (!user || companies.get(user.company_id)?.id !== quote.supplier_company_id) throw new Error('Unauthorized');
  const updated = { ...quote, ...patch, id: quoteId };
  quotes.set(quoteId, updated);
  return updated;
}

export async function sendQuoteNow(quoteId: string, supplierUserId: string): Promise<Quote> {
  const quote = quotes.get(quoteId);
  if (!quote) throw new Error('Quote not found');
  const user = users.get(supplierUserId);
  if (!user) throw new Error('User not found');
  const marginPct = resolveMargin([...margins.values()], '', '');
  const total = quote.items.reduce((s, i) => s + applyMargin(i.supplier_unit_price_sar, marginPct) * i.qty_available, 0);
  const adminHeld = total > platformSettings.auto_quote_admin_hold_threshold_sar;
  const newStatus: Quote['status'] = adminHeld ? 'pending_admin_review' : 'submitted_to_client';
  const updated: Quote = {
    ...quote,
    status: newStatus,
    supplier_reviewed_at: nowISO(),
    submitted_at: nowISO(),
    admin_held: adminHeld,
    items: quote.items.map((i) => ({ ...i, final_unit_price_sar: applyMargin(i.supplier_unit_price_sar, marginPct) })),
  };
  quotes.set(quoteId, updated);
  const rfq = rfqs.get(quote.rfq_id);
  if (rfq) rfqs.set(rfq.id, { ...rfq, status: 'quoted' });
  if (!adminHeld && rfq) {
    const clientUser = [...users.values()].find((u) => u.company_id === rfq.client_company_id);
    if (clientUser) await sendNotification(clientUser.id, 'quote_received', 'Quote Received', `A quote has been submitted for your RFQ: ${rfq.title}`, `/rfqs/${rfq.id}`);
  }
  return updated;
}

export async function approveAdminHeldQuote(quoteId: string, finalMarginPct: number, actorAdminId: string): Promise<Quote> {
  const quote = quotes.get(quoteId);
  if (!quote) throw new Error('Quote not found');
  const updated: Quote = {
    ...quote,
    status: 'submitted_to_client',
    admin_held: false,
    items: quote.items.map((i) => ({ ...i, final_unit_price_sar: applyMargin(i.supplier_unit_price_sar, finalMarginPct) })),
  };
  quotes.set(quoteId, updated);
  const rfq = rfqs.get(quote.rfq_id);
  if (rfq) {
    const clientUser = [...users.values()].find((u) => u.company_id === rfq.client_company_id);
    if (clientUser) await sendNotification(clientUser.id, 'quote_received', 'Quote Received', `A quote is available for your RFQ: ${rfq.title}`);
  }
  recordAudit(actorAdminId, 'QUOTE_APPROVED', 'Quote', quoteId, { status: quote.status }, { status: 'submitted_to_client', margin_pct: finalMarginPct });
  return updated;
}

export async function listQuotesForRFQ(rfqId: string, viewerId: string): Promise<Array<Quote & { supplier_alias?: string }>> {
  const viewer = users.get(viewerId);
  const isAdmin = viewer && ['admin', 'ops', 'finance'].includes(viewer.role);
  return [...quotes.values()]
    .filter((q) => q.rfq_id === rfqId && (isAdmin || q.status === 'submitted_to_client' || q.status === 'accepted' || q.status === 'partially_accepted'))
    .map((q) => {
      const supplier = companies.get(q.supplier_company_id);
      const supplier_alias = supplier?.platform_alias;
      if (isAdmin) return { ...q, supplier_alias };
      return { ...q, supplier_alias, items: q.items.map((i) => ({ ...i, supplier_unit_price_sar: 0 })) };
    });
}

function createPOPair(rfq: RFQ, quote: Quote, selectedItems: QuoteItem[], clientCompanyId: string, supplierCompanyId: string, quoteLineSelections?: string[]) {
  const txnRef = `TXN-${uuidv4().slice(0, 8).toUpperCase()}`;
  const marginPct = resolveMargin([...margins.values()], rfq.category_id ?? '', clientCompanyId);
  const poItems: POItem[] = selectedItems.filter((i) => !i.declined).map((i) => {
    const rfqItem = rfq.items.find((ri) => ri.id === i.rfq_item_id);
    const prod = rfqItem?.master_product_id ? masterProducts.get(rfqItem.master_product_id) : null;
    return {
      id: newId(), po_id: '', master_product_id: rfqItem?.master_product_id ?? '', name_en: prod?.name_en ?? rfqItem?.description ?? '',
      qty: rfqItem?.qty ?? i.qty_available, pack_type: rfqItem?.pack_type ?? 'Each',
      unit_price_sar: i.final_unit_price_sar, total_sar: i.final_unit_price_sar * (rfqItem?.qty ?? 1),
    };
  });
  const clientTotal = poItems.reduce((s, i) => s + i.total_sar, 0);
  const supplierTotal = poItems.reduce((s, i) => s + (i.unit_price_sar / (1 + marginPct / 100)) * i.qty, 0);
  const cpoId = newId();
  const spoId = newId();
  const cpo: PO = {
    id: cpoId, po_number: generateDocNumber('CPO'), type: 'CPO', transaction_ref: txnRef,
    rfq_id: rfq.id, source_quote_id: quote.id, source_quote_line_selections: quoteLineSelections,
    client_company_id: clientCompanyId, supplier_company_id: supplierCompanyId,
    status: 'awaiting_approval', total_sar: clientTotal,
    items: poItems.map((i) => ({ ...i, po_id: cpoId })), created_at: nowISO(),
  };
  const spo: PO = {
    id: spoId, po_number: generateDocNumber('SPO'), type: 'SPO', transaction_ref: txnRef,
    rfq_id: rfq.id, source_quote_id: quote.id,
    client_company_id: clientCompanyId, supplier_company_id: supplierCompanyId,
    // SPO stays in 'draft' while the client-side approval chain runs.
    // Flips to 'confirmed' alongside the CPO when the final approver signs off
    // (see approveOrder). Keeps suppliers from seeing WIP client approvals.
    status: 'draft', total_sar: supplierTotal,
    items: poItems.map((i) => ({ ...i, po_id: spoId, unit_price_sar: i.unit_price_sar / (1 + marginPct / 100), total_sar: (i.unit_price_sar / (1 + marginPct / 100)) * i.qty })),
    created_at: nowISO(),
  };
  pos.set(cpoId, cpo);
  pos.set(spoId, spo);
  const user = [...users.values()].find((u) => u.company_id === clientCompanyId);
  if (user) {
    const chain = computeApprovalChain([...approvalNodes.values()], user.id);
    const approvers = chain.length > 0 ? chain : [user.id];
    approvers.forEach((approverId, idx) => {
      const taskId = newId();
      approvalTasks.set(taskId, { id: taskId, po_id: cpoId, approver_user_id: approverId, status: idx === 0 ? 'pending' : 'pending', order_in_chain: idx + 1, decided_at: null, note: null });
    });
  }
  return { cpo, spo };
}

export async function acceptQuoteFullBasket(clientUserId: string, quoteId: string): Promise<{ cpo: PO; spo: PO }> {
  const quote = quotes.get(quoteId);
  if (!quote) throw new Error('Quote not found');
  const rfq = rfqs.get(quote.rfq_id);
  if (!rfq) throw new Error('RFQ not found');
  const user = users.get(clientUserId);
  if (!user) throw new Error('User not found');
  const updatedQuote = { ...quote, status: 'accepted' as const };
  quotes.set(quoteId, updatedQuote);
  rfqs.set(rfq.id, { ...rfq, status: 'awarded' });
  const otherQuotes = [...quotes.values()].filter((q) => q.rfq_id === rfq.id && q.id !== quoteId);
  otherQuotes.forEach((q) => quotes.set(q.id, { ...q, status: 'rejected' }));
  return createPOPair(rfq, quote, quote.items, rfq.client_company_id, quote.supplier_company_id);
}

export async function acceptQuotesPerLine(clientUserId: string, rfqId: string, selections: Array<{ quote_id: string; quote_item_id: string }>): Promise<Array<{ cpo: PO; spo: PO }>> {
  const rfq = rfqs.get(rfqId);
  if (!rfq) throw new Error('RFQ not found');
  const user = users.get(clientUserId);
  if (!user) throw new Error('User not found');
  const bySupplier = new Map<string, { quote: Quote; items: QuoteItem[] }>();
  for (const sel of selections) {
    const quote = quotes.get(sel.quote_id);
    if (!quote) continue;
    const item = quote.items.find((i) => i.id === sel.quote_item_id);
    if (!item) continue;
    const qls: QuoteLineSelection = { id: newId(), rfq_id: rfqId, quote_id: sel.quote_id, quote_item_id: sel.quote_item_id, client_user_id: clientUserId, selected_at: nowISO() };
    quoteLineSelections.set(qls.id, qls);
    if (!bySupplier.has(quote.supplier_company_id)) {
      bySupplier.set(quote.supplier_company_id, { quote, items: [] });
    }
    bySupplier.get(quote.supplier_company_id)!.items.push(item);
  }
  rfqs.set(rfqId, { ...rfq, status: 'partially_awarded' });
  const results: Array<{ cpo: PO; spo: PO }> = [];
  for (const [supplierId, { quote, items }] of bySupplier.entries()) {
    quotes.set(quote.id, { ...quote, status: 'partially_accepted' });
    const pair = createPOPair(rfq, quote, items, rfq.client_company_id, supplierId);
    results.push(pair);
  }
  const unselectedSuppliers = [...quotes.values()].filter((q) => q.rfq_id === rfqId && !bySupplier.has(q.supplier_company_id));
  unselectedSuppliers.forEach((q) => quotes.set(q.id, { ...q, status: 'rejected' }));
  return results;
}

export async function listMyApprovalTasks(userId: string, status?: string): Promise<Array<{ task: ApprovalTask; po: PO }>> {
  const tasks = [...approvalTasks.values()].filter((t) => {
    if (t.approver_user_id !== userId) return false;
    if (status && t.status !== status) return false;
    return true;
  });
  return tasks.map((task) => ({ task, po: pos.get(task.po_id)! })).filter((r) => r.po);
}

export async function approveOrder(taskId: string, note: string, userId: string): Promise<ApprovalTask> {
  const task = approvalTasks.get(taskId);
  if (!task) throw new Error('Task not found');
  if (task.approver_user_id !== userId) throw new Error('Unauthorized');
  const updated = { ...task, status: 'approved' as const, decided_at: nowISO(), note };
  approvalTasks.set(taskId, updated);
  const po = pos.get(task.po_id);
  if (po) {
    const nextTask = [...approvalTasks.values()].find((t) => t.po_id === task.po_id && t.order_in_chain === task.order_in_chain + 1 && t.status === 'pending');
    if (!nextTask) {
      pos.set(po.id, { ...po, status: 'confirmed' });
      const spoPair = [...pos.values()].find((p) => p.transaction_ref === po.transaction_ref && p.type === 'SPO');
      if (spoPair) {
        pos.set(spoPair.id, { ...spoPair, status: 'confirmed' });
        const supplierUser = [...users.values()].find((u) => u.company_id === spoPair.supplier_company_id);
        if (supplierUser) {
          await sendNotification(supplierUser.id, 'order_confirmed', 'New Order Confirmed', `Order ${spoPair.po_number} is ready to fulfil.`, `/orders/${spoPair.id}`);
        }
      }
    }
  }
  return updated;
}

export async function rejectOrder(taskId: string, note: string, userId: string): Promise<ApprovalTask> {
  const task = approvalTasks.get(taskId);
  if (!task) throw new Error('Task not found');
  if (task.approver_user_id !== userId) throw new Error('Unauthorized');
  const updated = { ...task, status: 'rejected' as const, decided_at: nowISO(), note };
  approvalTasks.set(taskId, updated);
  const po = pos.get(task.po_id);
  if (po) {
    pos.set(po.id, { ...po, status: 'cancelled' });
    const spoPair = [...pos.values()].find((p) => p.transaction_ref === po.transaction_ref && p.type === 'SPO');
    if (spoPair) pos.set(spoPair.id, { ...spoPair, status: 'cancelled' });
  }
  return updated;
}

export async function getApprovalChainStatus(poId: string): Promise<{ tasks: ApprovalTask[]; current_approver: User | null }> {
  const tasks = [...approvalTasks.values()].filter((t) => t.po_id === poId).sort((a, b) => a.order_in_chain - b.order_in_chain);
  const current = tasks.find((t) => t.status === 'pending');
  return { tasks, current_approver: current ? users.get(current.approver_user_id) ?? null : null };
}

export async function listCompanyMembers(companyId: string): Promise<CompanyMember[]> {
  return [...companyMembers.values()].filter((m) => m.company_id === companyId);
}

export async function inviteCompanyMember(companyId: string, email: string, roleId: string, inviterUserId: string): Promise<CompanyMember> {
  const existingUser = [...users.values()].find((u) => u.email === email);
  let user = existingUser;
  if (!user) {
    const userId = newId();
    user = { id: userId, email, password_hash: '', role: 'client', real_name: email, phone: '', platform_alias: generateClientAlias(), company_id: companyId, status: 'pending_callback', activation_status: 'awaiting_callback', callback_notes: null, activation_token: null, language: 'en', onboarding_completed: false, created_at: nowISO(), updated_at: nowISO() };
    users.set(userId, user);
  }
  const id = newId();
  const member: CompanyMember = { id, company_id: companyId, user_id: user.id, company_role_id: roleId };
  companyMembers.set(id, member);
  return member;
}

export async function listCompanyRoles(companyId: string): Promise<CompanyRole[]> {
  return [...companyRoles.values()].filter((r) => r.company_id === companyId);
}

export async function createCompanyRole(companyId: string, name: string, permissions: string[], userId: string): Promise<CompanyRole> {
  void userId;
  const id = newId();
  const role: CompanyRole = { id, company_id: companyId, name, permissions };
  companyRoles.set(id, role);
  return role;
}

export async function assignRoleToMember(memberId: string, roleId: string, userId: string): Promise<CompanyMember> {
  void userId;
  const member = companyMembers.get(memberId);
  if (!member) throw new Error('Member not found');
  const updated = { ...member, company_role_id: roleId };
  companyMembers.set(memberId, updated);
  return updated;
}

export async function listApprovalNodes(companyId: string): Promise<ApprovalNode[]> {
  return [...approvalNodes.values()].filter((n) => n.company_id === companyId);
}

export async function setDirectApprover(memberUserId: string, approverUserId: string | null, actorUserId: string): Promise<ApprovalNode> {
  void actorUserId;
  if (approverUserId) {
    const wouldCycle = detectCycle([...approvalNodes.values()], memberUserId, approverUserId);
    if (wouldCycle) throw new Error('Cycle detected: this would create a circular approval chain');
  }
  const existing = [...approvalNodes.values()].find((n) => n.member_user_id === memberUserId);
  const user = users.get(memberUserId);
  if (!user) throw new Error('User not found');
  const id = existing?.id ?? newId();
  const node: ApprovalNode = { id, company_id: user.company_id, member_user_id: memberUserId, direct_approver_user_id: approverUserId };
  approvalNodes.set(id, node);
  return node;
}

export async function listAddresses(companyId: string, type?: 'delivery' | 'billing'): Promise<Address[]> {
  return [...addresses.values()].filter((a) => {
    if (a.company_id !== companyId) return false;
    if (type && a.type !== type) return false;
    if (a.deleted_at) return false;
    return true;
  });
}

export async function createAddress(companyId: string, input: Omit<Address, 'id' | 'company_id' | 'deleted_at'>, userId: string): Promise<Address> {
  void userId;
  const id = newId();
  const addr: Address = { ...input, id, company_id: companyId };
  addresses.set(id, addr);
  return addr;
}

export async function updateAddress(id: string, patch: Partial<Address>, userId: string): Promise<Address> {
  void userId;
  const addr = addresses.get(id);
  if (!addr) throw new Error('Address not found');
  const updated = { ...addr, ...patch, id };
  addresses.set(id, updated);
  return updated;
}

export async function deleteAddress(id: string, userId: string): Promise<void> {
  void userId;
  const addr = addresses.get(id);
  if (!addr) throw new Error('Address not found');
  addresses.set(id, { ...addr, deleted_at: nowISO() });
}

export async function listPOsForUser(userId: string, role: string): Promise<PO[]> {
  const user = users.get(userId);
  if (!user) return [];
  const companyId = user.company_id;
  let data = [...pos.values()];
  if (role === 'client') {
    data = data.filter((p) => p.type === 'CPO' && p.client_company_id === companyId);
    return data.map((p) => ({ ...p, supplier_company_id: '' }));
  }
  if (role === 'supplier') {
    data = data.filter((p) => p.type === 'SPO' && p.supplier_company_id === companyId);
    return data.map((p) => ({ ...p, client_company_id: '' }));
  }
  return data;
}

export async function getPO(id: string, viewerId: string): Promise<PO | null> {
  const po = pos.get(id);
  if (!po) return null;
  const viewer = users.get(viewerId);
  if (!viewer) return null;
  if (['admin', 'ops', 'finance'].includes(viewer.role)) return po;
  const companyId = viewer.company_id;
  if (viewer.role === 'client' && po.client_company_id === companyId) return { ...po, supplier_company_id: '' };
  if (viewer.role === 'supplier' && po.supplier_company_id === companyId) return { ...po, client_company_id: '' };
  return null;
}

export async function createDN(supplierUserId: string, spoId: string, input: Omit<DN, 'id' | 'dn_number' | 'spo_id'>): Promise<DN> {
  const id = newId();
  const dn: DN = { ...input, id, dn_number: generateDocNumber('DN'), spo_id: spoId };
  dns.set(id, dn);
  const spo = pos.get(spoId);
  if (spo) pos.set(spoId, { ...spo, status: 'in_transit' });
  const cpo = [...pos.values()].find((p) => p.transaction_ref === spo?.transaction_ref && p.type === 'CPO');
  if (cpo) pos.set(cpo.id, { ...cpo, status: 'in_transit' });
  return dn;
}

export async function createGRN(clientUserId: string, cpoId: string, dnId: string, input: { items: Omit<GRNItem, 'id' | 'grn_id'>[]; notes: string }): Promise<GRN> {
  const id = newId();
  const grn: GRN = { id, grn_number: generateDocNumber('GRN'), cpo_id: cpoId, dn_id: dnId, received_by_user_id: clientUserId, received_at: nowISO(), items: input.items.map((i) => ({ ...i, id: newId(), grn_id: id })), notes: input.notes };
  grns.set(id, grn);
  const cpo = pos.get(cpoId);
  if (cpo) pos.set(cpoId, { ...cpo, status: 'delivered' });
  const spo = [...pos.values()].find((p) => p.transaction_ref === cpo?.transaction_ref && p.type === 'SPO');
  if (spo) pos.set(spo.id, { ...spo, status: 'delivered' });
  return grn;
}

export async function generateInvoice(
  cpoId: string,
  grnId: string,
  wafeqData?: { wafeq_invoice_id?: string | null; wafeq_pdf_url?: string | null },
): Promise<Invoice> {
  const cpo = pos.get(cpoId);
  const grn = grns.get(grnId);
  if (!cpo || !grn) throw new Error('PO or GRN not found');
  const vatRate = platformSettings.vat_rate;
  const subtotal = cpo.total_sar;
  const vatAmount = Math.round(subtotal * vatRate * 100) / 100;
  const total = subtotal + vatAmount;
  const existingInv = [...invoices.values()].find((i) => i.cpo_id === cpoId && i.grn_id === grnId);
  if (existingInv) {
    if (wafeqData && (!existingInv.wafeq_invoice_id || existingInv.wafeq_invoice_id.startsWith('wafeq-error'))) {
      const updated = { ...existingInv, ...wafeqData };
      invoices.set(existingInv.id, updated);
      return updated;
    }
    return existingInv;
  }
  const matchResult: ThreeWayMatchResult = matchPOGRNInvoice(cpo, grn, { id: '', invoice_number: '', cpo_id: cpoId, grn_id: grnId, total_sar: total, vat_amount_sar: vatAmount, status: 'draft', issue_date: nowISO(), due_date: addDays(new Date(), 30) });
  const id = newId();
  const invoiceDraft: Invoice = {
    id, invoice_number: generateDocNumber('INV'), cpo_id: cpoId, grn_id: grnId,
    total_sar: total, vat_amount_sar: vatAmount,
    status: matchResult.matches ? 'issued' : 'draft',
    issue_date: nowISO(), due_date: addDays(new Date(), 30),
    wafeq_invoice_id: wafeqData?.wafeq_invoice_id ?? null,
    wafeq_pdf_url: wafeqData?.wafeq_pdf_url ?? null,
  };
  // Issue via Wafeq when caller didn't pre-supply a wafeq id and the invoice
  // is in an issuable state. Wafeq submits to ZATCA Fatoora upstream and
  // returns the ZATCA UUID + QR (Phase 3 wires the real client; today nulls).
  let invoice = invoiceDraft;
  if (!wafeqData?.wafeq_invoice_id && invoiceDraft.status === 'issued') {
    const seller = { name: 'MWRD', vat_number: platformSettings.platform_vat_number ?? '' };
    const wafeqResult = await issueWafeqInvoice(invoiceDraft, seller);
    invoice = {
      ...invoiceDraft,
      wafeq_invoice_id: wafeqResult.wafeq_invoice_id,
      zatca_uuid: wafeqResult.zatca_uuid,
      zatca_qr: wafeqResult.zatca_qr,
    };
  }
  invoices.set(id, invoice);
  return invoice;
}

export async function recordPayment(invoiceId: string, paymentIntentId?: string): Promise<Invoice> {
  const invoice = invoices.get(invoiceId);
  if (!invoice) throw new Error('Invoice not found');
  const intent = paymentIntentId ?? (await createMoyasarPaymentIntent(invoiceId, invoice.total_sar, 'mock')).intent_id;
  const updated = { ...invoice, status: 'paid' as const, payment_intent_id: intent };
  invoices.set(invoiceId, updated);
  const cpo = pos.get(invoice.cpo_id);
  if (cpo) pos.set(cpo.id, { ...cpo, status: 'completed' });
  return updated;
}

export async function listLeadsQueue(filters: { account_type?: string; page?: number } = {}, actorAdminId: string): Promise<{ data: User[]; total: number }> {
  void actorAdminId;
  let data = [...users.values()].filter((u) => {
    if (u.status !== 'pending_callback') return false;
    if (filters.account_type && u.role !== filters.account_type) return false;
    return true;
  }).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const total = data.length;
  const page = filters.page ?? 1;
  return { data: data.slice((page - 1) * 25, page * 25), total };
}

export async function listKycQueue(filters: { page?: number } = {}, actorAdminId: string): Promise<{ data: User[]; total: number }> {
  void actorAdminId;
  let data = [...users.values()].filter((u) => u.status === 'pending_kyc' || (u.activation_status === 'activated' && u.status === 'callback_completed')).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const total = data.length;
  const page = filters.page ?? 1;
  return { data: data.slice((page - 1) * 25, page * 25), total };
}

export async function approveKYC(userId: string, actorAdminId: string): Promise<User> {
  const user = users.get(userId);
  if (!user) throw new Error('User not found');
  const updated = { ...user, status: 'active' as const, updated_at: nowISO() };
  users.set(userId, updated);
  recordAudit(actorAdminId, 'KYC_APPROVED', 'User', userId, { status: user.status }, { status: 'active' });
  await sendNotification(userId, 'kyc_approved', 'KYC Approved', 'Your account has been verified. You can now use the platform fully.');
  return updated;
}

export async function rejectKYC(userId: string, reason: string, actorAdminId: string): Promise<User> {
  const user = users.get(userId);
  if (!user) throw new Error('User not found');
  const updated = { ...user, status: 'suspended' as const, updated_at: nowISO() };
  users.set(userId, updated);
  recordAudit(actorAdminId, 'KYC_REJECTED', 'User', userId, { status: user.status }, { status: 'suspended' });
  await sendNotification(userId, 'kyc_rejected', 'KYC Not Approved', `Your KYC verification was not approved: ${reason}`);
  return updated;
}

export async function listAllUsers(filters: { role?: string; status?: string; page?: number } = {}, actorAdminId: string): Promise<{ data: User[]; total: number }> {
  void actorAdminId;
  let data = [...users.values()].filter((u) => {
    if (filters.role && u.role !== filters.role) return false;
    if (filters.status && u.status !== filters.status) return false;
    return true;
  });
  const total = data.length;
  const page = filters.page ?? 1;
  return { data: data.slice((page - 1) * 25, page * 25), total };
}

export async function getUser(id: string): Promise<User | null> {
  return users.get(id) ?? null;
}

export async function getCompany(id: string): Promise<Company | null> {
  return companies.get(id) ?? null;
}

export async function setMargin(scope: 'global' | 'category' | 'client', scopeId: string | null, pct: number, actorAdminId: string): Promise<Margin> {
  const existing = [...margins.values()].find((m) => m.scope === scope && m.scope_id === scopeId);
  if (existing) {
    const updated = { ...existing, pct, updated_by_user_id: actorAdminId, updated_at: nowISO() };
    margins.set(existing.id, updated);
    recordAudit(actorAdminId, 'MARGIN_UPDATED', 'Margin', existing.id, { pct: existing.pct }, { pct });
    return updated;
  }
  const id = newId();
  const margin: Margin = { id, scope, scope_id: scopeId, pct, updated_by_user_id: actorAdminId, updated_at: nowISO() };
  margins.set(id, margin);
  recordAudit(actorAdminId, 'MARGIN_CREATED', 'Margin', id, null, margin);
  return margin;
}

export async function getMargin(clientCompanyId: string, categoryId: string): Promise<number> {
  return resolveMargin([...margins.values()], categoryId, clientCompanyId);
}

export async function listMargins(): Promise<Margin[]> {
  return [...margins.values()];
}

export async function listAuditLog(filters: { actor_user_id?: string; entity_type?: string; page?: number } = {}, actorAdminId: string): Promise<AuditLog[]> {
  void actorAdminId;
  return [...auditLogs.values()].filter((a) => {
    if (filters.actor_user_id && a.actor_user_id !== filters.actor_user_id) return false;
    if (filters.entity_type && a.entity_type !== filters.entity_type) return false;
    return true;
  }).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 100);
}

export async function listAdminHeldQuotes(actorAdminId: string): Promise<Quote[]> {
  void actorAdminId;
  return [...quotes.values()].filter((q) => q.admin_held || q.status === 'pending_admin_review');
}

export async function listPendingAutoQuotes(actorAdminId: string): Promise<Quote[]> {
  void actorAdminId;
  return [...quotes.values()].filter((q) => q.status === 'draft_auto');
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  return [...notifications.values()].filter((n) => n.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  const n = notifications.get(notificationId);
  if (n && n.user_id === userId) notifications.set(notificationId, { ...n, read_at: nowISO() });
}

export async function getFavourites(userId: string): Promise<FavouriteList> {
  return favouriteLists.get(userId) ?? { id: newId(), user_id: userId, master_product_ids: [] };
}

export async function toggleFavourite(userId: string, masterProductId: string): Promise<FavouriteList> {
  const fav = await getFavourites(userId);
  const ids = fav.master_product_ids.includes(masterProductId)
    ? fav.master_product_ids.filter((id) => id !== masterProductId)
    : [...fav.master_product_ids, masterProductId];
  const updated = { ...fav, master_product_ids: ids };
  favouriteLists.set(userId, updated);
  return updated;
}

export async function listCompanyCatalogs(companyId: string): Promise<CompanyCatalog[]> {
  return [...companyCatalogs.values()].filter((c) => c.company_id === companyId);
}

export async function createCompanyCatalog(input: { name: string; description: string }, userId: string): Promise<CompanyCatalog> {
  const user = users.get(userId);
  if (!user) throw new Error('User not found');
  const id = newId();
  const catalog: CompanyCatalog = { id, company_id: user.company_id, name: input.name, description: input.description, master_product_ids: [], created_by_user_id: userId };
  companyCatalogs.set(id, catalog);
  return catalog;
}

export async function addToCompanyCatalog(catalogId: string, masterProductId: string, userId: string): Promise<CompanyCatalog> {
  void userId;
  const catalog = companyCatalogs.get(catalogId);
  if (!catalog) throw new Error('Catalog not found');
  if (!catalog.master_product_ids.includes(masterProductId)) {
    catalog.master_product_ids.push(masterProductId);
  }
  companyCatalogs.set(catalogId, catalog);
  return catalog;
}

export async function removeFromCompanyCatalog(catalogId: string, masterProductId: string, userId: string): Promise<CompanyCatalog> {
  void userId;
  const catalog = companyCatalogs.get(catalogId);
  if (!catalog) throw new Error('Catalog not found');
  catalog.master_product_ids = catalog.master_product_ids.filter((id) => id !== masterProductId);
  companyCatalogs.set(catalogId, catalog);
  return catalog;
}

export async function renameCompanyCatalog(id: string, name: string, userId: string): Promise<CompanyCatalog> {
  void userId;
  const catalog = companyCatalogs.get(id);
  if (!catalog) throw new Error('Catalog not found');
  const updated = { ...catalog, name };
  companyCatalogs.set(id, updated);
  return updated;
}

export async function deleteCompanyCatalog(id: string, userId: string): Promise<void> {
  void userId;
  companyCatalogs.delete(id);
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  return platformSettings;
}

export async function updatePlatformSettings(patch: Partial<PlatformSettings>, actorAdminId: string): Promise<PlatformSettings> {
  const before = { ...platformSettings };
  platformSettings = { ...platformSettings, ...patch };
  recordAudit(actorAdminId, 'PLATFORM_SETTINGS_UPDATED', 'PlatformSettings', 'platform-settings-001', before, platformSettings);
  return platformSettings;
}

export async function suspendUser(userId: string, actorAdminId: string): Promise<User> {
  const user = users.get(userId);
  if (!user) throw new Error('User not found');
  const updated = { ...user, status: 'suspended' as const, updated_at: nowISO() };
  users.set(userId, updated);
  recordAudit(actorAdminId, 'USER_SUSPENDED', 'User', userId, { status: user.status }, { status: 'suspended' });
  return updated;
}

export async function reactivateUser(userId: string, actorAdminId: string): Promise<User> {
  const user = users.get(userId);
  if (!user) throw new Error('User not found');
  const updated = { ...user, status: 'active' as const, updated_at: nowISO() };
  users.set(userId, updated);
  recordAudit(actorAdminId, 'USER_REACTIVATED', 'User', userId, { status: user.status }, { status: 'active' });
  return updated;
}

export async function getDashboardStats(companyId: string, role: string): Promise<{
  open_rfqs: number;
  pending_quotes: number;
  active_orders: number;
  total_spend_sar: number;
}> {
  if (role === 'client') {
    const clientRFQs = [...rfqs.values()].filter((r) => r.client_company_id === companyId);
    const clientPOs = [...pos.values()].filter((p) => p.type === 'CPO' && p.client_company_id === companyId);
    return {
      open_rfqs: clientRFQs.filter((r) => r.status === 'open').length,
      pending_quotes: clientRFQs.filter((r) => r.status === 'quoted').length,
      active_orders: clientPOs.filter((p) => ['confirmed', 'in_transit'].includes(p.status)).length,
      total_spend_sar: clientPOs.filter((p) => p.status === 'completed').reduce((s, p) => s + p.total_sar, 0),
    };
  }
  if (role === 'supplier') {
    const supplierQuotes = [...quotes.values()].filter((q) => q.supplier_company_id === companyId);
    const supplierPOs = [...pos.values()].filter((p) => p.type === 'SPO' && p.supplier_company_id === companyId);
    return {
      open_rfqs: [...quotes.values()].filter((q) => q.supplier_company_id === companyId && ['draft_auto', 'draft_manual'].includes(q.status)).length,
      pending_quotes: supplierQuotes.filter((q) => q.status === 'submitted_to_client').length,
      active_orders: supplierPOs.filter((p) => ['confirmed', 'in_transit'].includes(p.status)).length,
      total_spend_sar: supplierPOs.filter((p) => p.status === 'completed').reduce((s, p) => s + p.total_sar, 0),
    };
  }
  return { open_rfqs: 0, pending_quotes: 0, active_orders: 0, total_spend_sar: 0 };
}
