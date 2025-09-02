// Server-side file system operations (Node.js only)
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

export async function readYAML(path: string): Promise<any> {
  try {
    if (!existsSync(path)) {
      throw new Error(`File not found: ${path}`);
    }
    const content = readFileSync(path, 'utf8');
    return parseYaml(content);
  } catch (error) {
    throw new Error(`Error reading YAML file ${path}: ${error}`);
  }
}

export async function writeYAML(path: string, data: any): Promise<void> {
  try {
    const yamlContent = stringifyYaml(data, {
      indent: 2,
      lineWidth: 120,
      minContentWidth: 0
    });
    writeFileSync(path, yamlContent, 'utf8');
  } catch (error) {
    throw new Error(`Error writing YAML file ${path}: ${error}`);
  }
}

export async function readJSON(path: string): Promise<any> {
  try {
    if (!existsSync(path)) {
      throw new Error(`File not found: ${path}`);
    }
    const content = readFileSync(path, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Error reading JSON file ${path}: ${error}`);
  }
}

export async function writeJSON(path: string, data: any): Promise<void> {
  try {
    const jsonContent = JSON.stringify(data, null, 2);
    writeFileSync(path, jsonContent, 'utf8');
  } catch (error) {
    throw new Error(`Error writing JSON file ${path}: ${error}`);
  }
}

export function fileExists(path: string): boolean {
  return existsSync(path);
}

export function readFile(path: string): string {
  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    throw new Error(`Error reading file ${path}: ${error}`);
  }
}

export function writeFile(path: string, content: string): void {
  try {
    writeFileSync(path, content, 'utf8');
  } catch (error) {
    throw new Error(`Error writing file ${path}: ${error}`);
  }
}

export function createDirectory(path: string): void {
  try {
    const fs = require('fs');
    fs.mkdirSync(path, { recursive: true });
  } catch (error) {
    throw new Error(`Error creating directory ${path}: ${error}`);
  }
}

export function resolvePath(...paths: string[]): string {
  return join(...paths);
}

export function getWorkspacePath(relativePath: string = ''): string {
  return join(process.cwd(), 'src/lib/workspace', relativePath);
}

export function getRuntimePath(relativePath: string = ''): string {
  return join(process.cwd(), 'src/lib/runtime', relativePath);
}

export function getDefaultsPath(relativePath: string = ''): string {
  return join(process.cwd(), 'src/lib/defaults', relativePath);
}