export function sleep(seconds = 0): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), seconds * 1000);
  });
}
