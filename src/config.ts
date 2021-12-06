/* ----------------------------- Example Output ----------------------------- */
//  [ERROR] @ 12/06/2020 20:12:21 - [MixpanelClient] something broke a thing again.     <-- Formatted string from pino object
//      httpCode: 400,                                                                  <-- Extra props on pino object
//      httpResponse: { body: { ... } }

import chalk from "chalk";
import { loggerConfig } from "./app";

export const config: loggerConfig = {
  // We template this string with the properties in the console output
  outputf: "{#level#} @ {#time#} - {#context#} {#msg#} {#err#}",

  // We have to map the properties used in `outputf` to a string
  // So here we store the mapping function, in a key with the name of the prop
  // Any props not declared in here will be logged to the console as json after the formatted message
  // Unused props are not displayed (fx when `msg` is a prop `err` isnt)
  mapping: {
    // You can make a custom function to format the input
    level: logLevelString,
    time: (unixTime: number) =>
      chalk.underline.magenta(`${timeformat(unixTime)}`),
    context: (ctx: string) => chalk.yellow(`[${ctx}]`),

    // for props you dont want to transform you can just say they exist
    msg: chalk.blueBright,
    err: exists,

    // For the props you dont want to show in the log ignore them
    pid: ignored,
    hostname: ignored,
  },
};

function exists(value: any) {
  return value;
}

function ignored() {
  return "";
}

function timeformat(unixTime: number): string {
  const time = new Date(unixTime);

  return chalk.magenta.italic(time.toLocaleString());
}

function logLevelString(logLevel: number) {
  const defaultLogLevel = chalk.cyan("LOG");
  const logLevelMap: Record<number, string> = {
    60: chalk.red("FATAL"),
    50: chalk.red("ERROR"),
    40: chalk.yellow("WARN"),
    30: chalk.blue("INFO"),
    20: chalk.green("DEBUG"),
    10: "TRACE",
  };

  return logLevelMap[logLevel] || defaultLogLevel;
}
