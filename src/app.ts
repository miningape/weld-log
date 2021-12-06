#!/usr/bin/env node

import chalk from "chalk";
import { Writable } from "stream";

const stdin = process.openStdin();

interface pinoObject {
  [key: string]: string | number | object;

  level: number;
  time: number;
  pid: number;
  hostname: string;
  context: string;
  msg: string;
  err: string;
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

interface loggerConfig {
  outputf: string;

  mapping: {
    [varname: string]: (value: any) => string;
  };
}

function exists(value: any) {
  return value;
}

function ignored() {
  return "";
}

function omit(source: Record<string, any> = {}, omitKeys: string[] = []) {
  return Object.keys(source).reduce((acc, cur) => {
    return omitKeys.includes(cur) ? acc : { ...acc, [cur]: source[cur] };
  }, {});
}

/* ----------------------------- Example Output ----------------------------- */
//  [ERROR] @ 12/06/2020 20:12:21 - [MixpanelClient] something broke a thing again.     <-- Formatted string from pino object
//      httpCode: 400,                                                                  <-- Extra props on pino object
//      httpResponse: { body: { ... } }

const config: loggerConfig = {
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

function makeFunctionFromConfig(input: pinoObject) {
  const mappedInput = Object.entries(input)
    .map(([key, value]) => {
      const func = config.mapping[key];

      if (func) return { key, value: func(value) };

      return { key, value };
    })
    .reduce((acc: any, cur) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});

  let formattedString = config.outputf.replace(
    /\{#(\w+)#\}/g,
    (value, ...args) => {
      return mappedInput[args[0]] || "";
    }
  );

  // strip mappedInput Of Already Used Props
  const JSONoutput = omit(mappedInput, Object.keys(config.mapping));

  // print all non used props as json
  const s = JSON.stringify(JSONoutput);
  formattedString += s.length > 2 ? "\n" + s : "";

  return formattedString;
}

async function main(): Promise<void> {
  //const pipeData = await getInput();

  const outputStream = new Writable({
    write(chunk: Buffer, encoding, callback) {
      const inputStrings: string[] = chunk
        .toString()
        .split("\n")
        .filter((e) => e !== "");

      for (const jsonString of inputStrings) {
        try {
          const logData: pinoObject = JSON.parse(jsonString);
          console.log(makeFunctionFromConfig(logData));
        } catch (e: any) {
          console.log(jsonString);
        }
      }

      callback();
    },
  });

  stdin.pipe(outputStream);
}

main();
