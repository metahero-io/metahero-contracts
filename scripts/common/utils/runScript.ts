/* eslint-disable no-process-exit */

export function runScript(main: () => Promise<any>): void {
  const wrapper = async () => {
    await main();
  };

  wrapper()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
