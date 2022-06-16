import { parse, DotenvParseOutput } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

function mergeWith(target: DotenvParseOutput, source: DotenvParseOutput) {
  const keys = Object.keys(source);

  for (const key of keys) {
    if (!target[key]) {
      target[key] = source[key];
    }
  }
}

const WORKING_PATH = process.cwd();
const DOTENV_PATHS = ['../..', ''];
const DOTENV_FILE_NAMES = ['.env.defaults', '.env'];

const parsed: DotenvParseOutput = {};

for (const path of DOTENV_PATHS) {
  for (const fileName of DOTENV_FILE_NAMES) {
    const filePath = resolve(WORKING_PATH, path, fileName);

    try {
      mergeWith(
        parsed, //
        parse(readFileSync(filePath, { encoding: 'utf8' })),
      );
    } catch (err) {
      //
    }
  }
}

mergeWith(process.env, parsed);
