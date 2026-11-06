import type { Loan, Member, Transaction } from '../utils/chamaCalculations';

export interface AuthUser {
  id: string;
  email: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const result = await response.json() as { error?: string } & T;

  if (!response.ok) {
    throw new Error(result.error ?? `Database request failed (${response.status}).`);
  }
  return result;
}

export async function loadChamaData() {
  return request<{ members: Member[]; loans: Loan[]; transactions: Transaction[] }>('/api/data');
}

export async function initializeChamaData(data: {
  members: Member[];
  loans: Loan[];
  transactions: Transaction[];
}) {
  return request<{ initialized: boolean }>('/api/initialize', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function saveMember(member: Member) {
  await request('/api/members', { method: 'POST', body: JSON.stringify(member) });
}

export async function saveLoan(loan: Loan) {
  await request('/api/loans', { method: 'POST', body: JSON.stringify(loan) });
}

export async function recordContribution(transaction: Transaction) {
  await request('/api/transactions/contribution', { method: 'POST', body: JSON.stringify(transaction) });
}

export async function recordMpesaPayment(transaction: Transaction) {
  await request('/api/transactions/mpesa', { method: 'POST', body: JSON.stringify(transaction) });
}

export async function approveLoan(loanId: string, transaction: Transaction) {
  await request(`/api/loans/${encodeURIComponent(loanId)}/approve`, {
    method: 'POST',
    body: JSON.stringify(transaction),
  });
}

export async function rejectLoan(loanId: string) {
  await request(`/api/loans/${encodeURIComponent(loanId)}/reject`, { method: 'POST' });
}

export async function getCurrentUser() {
  return request<{ user: AuthUser | null }>('/api/auth/me');
}

export async function signIn(email: string, password: string) {
  return request<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function signUp(email: string, password: string) {
  return request<{ user: AuthUser }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function signOut() {
  await request<{ signedOut: boolean }>('/api/auth/logout', { method: 'POST' });
}
