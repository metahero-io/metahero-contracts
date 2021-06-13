export function getNetworkEnvPrefix(networkName: string): string {
  return networkName.replace(/([A-Z])+/, '_$1').toUpperCase();
}
