import { getAddress } from 'viem';

export interface SafeInfo {
  address: string;
}

export async function fetchUserSafes(ownerAddress: string): Promise<string[]> {
  const checksumAddress = getAddress(ownerAddress);
  const response = await fetch(
    `https://safe-transaction-gnosis-chain.safe.global/api/v1/owners/${checksumAddress}/safes/`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Safe accounts');
  }

  const data = await response.json();
  return data.safes || [];
}
