import type { ApprovalNode } from '../types/index.js';

export function computeApprovalChain(
  approvalNodes: ApprovalNode[],
  startUserId: string,
): string[] {
  const chain: string[] = [];
  const nodeMap = new Map(approvalNodes.map((n) => [n.member_user_id, n]));

  let current = startUserId;
  const visited = new Set<string>();

  while (current) {
    if (visited.has(current)) break;
    visited.add(current);

    const node = nodeMap.get(current);
    if (!node || !node.direct_approver_user_id) break;

    chain.push(node.direct_approver_user_id);
    current = node.direct_approver_user_id;
  }

  return chain;
}

export function detectCycle(
  approvalNodes: ApprovalNode[],
  proposedMemberId: string,
  proposedApproverId: string,
): boolean {
  const nodeMap = new Map(approvalNodes.map((n) => [n.member_user_id, n]));
  const tempMap = new Map(nodeMap);

  tempMap.set(proposedMemberId, {
    id: 'temp',
    company_id: '',
    member_user_id: proposedMemberId,
    direct_approver_user_id: proposedApproverId,
  });

  let current: string | null = proposedApproverId;
  const visited = new Set<string>();

  while (current) {
    if (current === proposedMemberId) return true;
    if (visited.has(current)) break;
    visited.add(current);

    const node = tempMap.get(current);
    current = node?.direct_approver_user_id ?? null;
  }

  return false;
}
