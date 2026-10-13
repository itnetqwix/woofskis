import { AppApiError } from '@/lib/axios';
import { isUuid } from '@/lib/is-uuid';
import { listDeploymentActiveContests, type ApiContest } from '@/services/contests-api';

/**
 * ACTIVE contests for this deployment.
 * The server resolves the organization. This does not read localStorage.
 */
export async function loadDeploymentActiveContests(): Promise<ApiContest[]> {
  try {
    const envelope = await listDeploymentActiveContests();
    if (!envelope.success || !Array.isArray(envelope.data)) return [];
    return envelope.data.filter((contest) => contest.status === 'ACTIVE' && isUuid(contest.id));
  } catch (error) {
    if (error instanceof AppApiError && error.statusCode === 404) {
      return [];
    }
    return [];
  }
}
