import chalk from "chalk";

export const logTitle = (message: string) => {
  const totalLength = 80;
  const messageLength = message.length;
  const padding = Math.max(0, totalLength - messageLength - 4);
  const paddedMessage = `${'='.repeat(Math.floor(padding / 2))} ${message} ${'='.repeat(Math.ceil(padding / 2))}`
  console.log(chalk.bold.cyanBright(paddedMessage));
}


// export const logTitle = (message: string) => {
//   const totalLength = 80;
//   const messageLength = message.length;
//   const leftLength = Math.floor((totalLength - messageLength) / 2);
//   const rightLength = totalLength - messageLength - leftLength;
//   const line = "-".repeat(leftLength) + message + "-".repeat(rightLength);
//   console.log(chalk.green(line));
// };

