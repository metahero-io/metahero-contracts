/* eslint-disable no-process-exit */

export function runScript(main: (...args: string[]) => Promise<any>): void {
  const wrapper = async () => {
    const { argv } = process;

    const args =
      Array.isArray(argv) && argv.length
        ? process.argv.slice(2).filter((item) => !!item)
        : [];

    await main(...args);
  };

  wrapper()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
