import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('web inline action bindings', () => {
  it('only references declared handler functions', () => {
    const source = fs.readFileSync(new URL('../web/Index.html', import.meta.url), 'utf8');
    const declared = new Set([...source.matchAll(/(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(match => match[1]));
    const attributes = [...source.matchAll(/onclick=["']([^"']*)["']/g)].map(match => match[1]);
    const handlers = new Set(attributes.flatMap(value => [...value.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g)].map(match => match[1])));
    const browserBuiltins = new Set(['if', 'confirm']);
    expect([...handlers].filter(name => !declared.has(name) && !browserBuiltins.has(name))).toEqual([]);
  });
});
