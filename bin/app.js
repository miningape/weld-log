#!/usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import chalk from "chalk";
import { Writable } from "stream";
const stdin = process.openStdin();
function timeformat(unixTime) {
    const time = new Date(unixTime);
    return chalk.magenta.italic(time.toLocaleString());
}
function logLevelString(logLevel) {
    const defaultLogLevel = chalk.cyan("LOG");
    const logLevelMap = {
        60: chalk.red("FATAL"),
        50: chalk.red("ERROR"),
        40: chalk.yellow("WARN"),
        30: chalk.blue("INFO"),
        20: chalk.green("DEBUG"),
        10: "TRACE",
    };
    return logLevelMap[logLevel] || defaultLogLevel;
}
function exists(value) {
    return value;
}
function ignored() {
    return "";
}
function omit(source = {}, omitKeys = []) {
    return Object.keys(source).reduce((acc, cur) => {
        return omitKeys.includes(cur) ? acc : Object.assign(Object.assign({}, acc), { [cur]: source[cur] });
    }, {});
}
/* ----------------------------- Example Output ----------------------------- */
//  [ERROR] @ 12/06/2020 20:12:21 - [MixpanelClient] something broke a thing again.     <-- Formatted string from pino object
//      httpCode: 400,                                                                  <-- Extra props on pino object
//      httpResponse: { body: { ... } }
const config = {
    // We template this string with the properties in the console output
    outputf: "{#level#} @ {#time#} - {#context#} {#msg#} {#err#}",
    // We have to map the properties used in `outputf` to a string
    // So here we store the mapping function, in a key with the name of the prop
    // Any props not declared in here will be logged to the console as json after the formatted message
    // Unused props are not displayed (fx when `msg` is a prop `err` isnt)
    mapping: {
        // You can make a custom function to format the input
        level: logLevelString,
        time: (unixTime) => chalk.underline.magenta(`${timeformat(unixTime)}`),
        context: (ctx) => chalk.yellow(`[${ctx}]`),
        // for props you dont want to transform you can just say they exist
        msg: chalk.blueBright,
        err: exists,
        // For the props you dont want to show in the log ignore them
        pid: ignored,
        hostname: ignored,
    },
};
function makeFunctionFromConfig(input) {
    const mappedInput = Object.entries(input)
        .map(([key, value]) => {
        const func = config.mapping[key];
        if (func)
            return { key, value: func(value) };
        return { key, value };
    })
        .reduce((acc, cur) => {
        acc[cur.key] = cur.value;
        return acc;
    }, {});
    let formattedString = config.outputf.replace(/\{#(\w+)#\}/g, (value, ...args) => {
        return mappedInput[args[0]] || "";
    });
    // strip mappedInput Of Already Used Props
    const JSONoutput = omit(mappedInput, Object.keys(config.mapping));
    // print all non used props as json
    const s = JSON.stringify(JSONoutput);
    formattedString += s.length > 2 ? "\n" + s : "";
    return formattedString;
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        //const pipeData = await getInput();
        const outputStream = new Writable({
            write(chunk, encoding, callback) {
                const inputStrings = chunk
                    .toString()
                    .split("\n")
                    .filter((e) => e !== "");
                for (const jsonString of inputStrings) {
                    try {
                        const logData = JSON.parse(jsonString);
                        console.log(makeFunctionFromConfig(logData));
                    }
                    catch (e) {
                        console.log(jsonString);
                    }
                }
                callback();
            },
        });
        stdin.pipe(outputStream);
    });
}
main();
const TXT = "forward 4\ndown 8\ndown 1\nforward 6";
function getPositionMultiplied(text) {
    let commands;
    (function (commands) {
        commands["forward"] = "forward";
        commands["down"] = "down";
        commands["up"] = "up";
    })(commands || (commands = {}));
    const position = {
        horisontal: 0,
        vertical: 0,
    };
    let aim = 0;
    const instructionStrings = text.split("\n");
    const instructions = instructionStrings
        .filter((s) => s !== "")
        .map((s) => s.split(" "))
        .map(([a, b]) => [a, parseInt(b)]);
    for (const i in instructions) {
        const [command, amount] = instructions[i];
        switch (command) {
            case commands.down:
                aim += amount;
                break;
            case commands.up:
                aim -= amount;
                break;
            case commands.forward:
                position.horisontal += amount;
                position.vertical += amount * aim;
                break;
            default:
                throw new Error("Command " + i + " " + command + " not recognized");
        }
    }
    return position.vertical * position.horisontal;
}
