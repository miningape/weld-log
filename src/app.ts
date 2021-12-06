#!/usr/bin/env node

import { config } from "./config.js";
import { Writable } from "stream";

const stdin = process.openStdin();

export interface pinoObject {
  [key: string]: string | number | object;

  level: number;
  time: number;
  pid: number;
  hostname: string;
  context: string;
  msg: string;
  err: string;
}

export interface loggerConfig {
  outputf: string;

  mapping: {
    [varname: string]: (value: any) => string;
  };
}

function omit(source: Record<string, any> = {}, omitKeys: string[] = []) {
  return Object.keys(source).reduce((acc, cur) => {
    return omitKeys.includes(cur) ? acc : { ...acc, [cur]: source[cur] };
  }, {});
}

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
    (value: string, ...args: string[]) => {
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
