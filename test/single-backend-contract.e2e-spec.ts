/**
 * §C. Контракт «один backend для всех клиентов».
 *
 * Этот файл — статический ассерт, что:
 *   - admin/lib/api.ts указывает на тот же origin, что и mobile baseUrl;
 *   - web/apps/landing/lib/constants.ts указывает туда же.
 *
 * Origin может различаться по схеме (http/https) если один — local dev, другой — prod,
 * но HOST должен совпадать (или быть в whitelist'е известных синонимов).
 *
 * Если кто-то поменяет URL в одном репо и забудет в другом — этот тест упадёт.
 */
import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

// __dirname в этих тестах = api/test, поэтому до /mozey корня нужен ../..
// Проверим оба варианта (на случай build из dist) и возьмём существующий.
const CANDIDATES = [
  path.resolve(__dirname, '../..'),
  path.resolve(__dirname, '../../..'),
];
let ROOT = CANDIDATES[0];
for (const c of CANDIDATES) {
  // если внутри есть admin/lib/api.ts — это наш моно-папка mozey
  if (fs.existsSync(path.join(c, 'admin/lib/api.ts'))) {
    ROOT = c;
    break;
  }
}

function readFileSafe(p: string): string | null {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

function extractFirstUrl(re: RegExp, text: string | null): string | null {
  if (!text) return null;
  const m = text.match(re);
  return m ? m[1] : null;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/**
 * Известные синонимы — один логический backend, разные DNS-имена.
 * Сюда добавляем prod IP ↔ DNS, если они пока не настроены через CNAME.
 */
const KNOWN_SYNONYMS: string[][] = [
  ['157.230.225.147:3000', 'api.mozey.uz', 'api.muzeylari.uz'],
  ['localhost:3333', 'localhost:3000', 'localhost:3030'],
];

function sameLogicalBackend(a: string, b: string): boolean {
  if (a === b) return true;
  return KNOWN_SYNONYMS.some((group) => group.includes(a) && group.includes(b));
}

describe('§C. Один backend — все клиенты ходят на один API', () => {
  const adminApiTs = readFileSafe(path.join(ROOT, 'admin/lib/api.ts'));
  const mobileApiCfg = readFileSafe(
    path.join(ROOT, 'mobile/lib/core/config/api_config.dart'),
  );
  const landingConstants = readFileSafe(
    path.join(ROOT, 'web/apps/landing/lib/constants.ts'),
  );

  // Каждая константа извлекается своей регуляркой потому что синтаксис разный.
  const adminBase = extractFirstUrl(
    /API_BASE_URL[^'`"]*['"`]([^'"`]+)['"`]/,
    adminApiTs,
  );
  const mobileBase = extractFirstUrl(
    /baseUrl\s*=\s*'([^']+)'/,
    mobileApiCfg,
  );
  const landingBase = extractFirstUrl(
    /API_BASE\s*=[\s\S]*?\|\|\s*['"`]([^'"`]+)['"`]/,
    landingConstants,
  );

  it('TC-C-01: исходные файлы клиентов читаются', () => {
    expect(adminApiTs, 'admin/lib/api.ts должен существовать').not.toBeNull();
    expect(mobileApiCfg, 'mobile/lib/core/config/api_config.dart должен существовать').not.toBeNull();
    expect(landingConstants, 'web/apps/landing/lib/constants.ts должен существовать').not.toBeNull();
  });

  it('TC-C-02: в каждом клиенте найден base URL', () => {
    expect(adminBase, 'API_BASE_URL не извлёкся из admin/lib/api.ts').toBeTruthy();
    expect(mobileBase, 'baseUrl не извлёкся из mobile/lib/core/config/api_config.dart').toBeTruthy();
    expect(landingBase, 'API_BASE не извлёкся из web/apps/landing/lib/constants.ts').toBeTruthy();
  });

  it('TC-C-03: путь у всех заканчивается на /api/v1', () => {
    expect(adminBase?.endsWith('/api/v1')).toBe(true);
    expect(mobileBase?.endsWith('/api/v1')).toBe(true);
    expect(landingBase?.endsWith('/api/v1')).toBe(true);
  });

  it('TC-C-04: admin и mobile указывают на один логический backend', () => {
    const a = hostOf(adminBase!);
    const m = hostOf(mobileBase!);
    expect(
      sameLogicalBackend(a, m),
      `admin (${a}) и mobile (${m}) должны указывать на один backend (или быть в KNOWN_SYNONYMS)`,
    ).toBe(true);
  });

  it('TC-C-05: landing и mobile указывают на один логический backend', () => {
    const l = hostOf(landingBase!);
    const m = hostOf(mobileBase!);
    expect(
      sameLogicalBackend(l, m),
      `landing (${l}) и mobile (${m}) должны указывать на один backend`,
    ).toBe(true);
  });

  it('TC-C-06: ни в одном клиенте нет в роли каноничного источника локальной БД / "fake" URL', () => {
    const ban = ['sqlite', 'mock', 'fake', 'stub', '127.0.0.1', '/data/local'];
    for (const [label, url] of [
      ['admin', adminBase],
      ['mobile', mobileBase],
      ['landing', landingBase],
    ] as const) {
      for (const b of ban) {
        expect(
          url!.toLowerCase().includes(b),
          `${label} base url "${url}" не должен содержать "${b}"`,
        ).toBe(false);
      }
    }
  });

  it('TC-C-07: в mobile нет резервного «локального источника правды» помимо seed-фоллбэка', () => {
    // У mobile есть LocalConfig (drift / shared_prefs) — это допустимо как кеш,
    // но не должно быть отдельного "/regions" провайдера, конкурирующего с remote.
    // Тут проверяем только, что в RemoteConfig нет switch'а на другой URL.
    const remoteCfg = readFileSafe(
      path.join(ROOT, 'mobile/lib/core/config/remote_config.dart'),
    );
    expect(remoteCfg).not.toBeNull();
    // Нет alt-URL и нет if (offline) return hardcoded data
    expect(remoteCfg!).not.toMatch(/altBaseUrl|fallbackUrl|FALLBACK_URL/);
  });
});
