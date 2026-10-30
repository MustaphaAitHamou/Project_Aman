import { FALLBACK_LANGUAGE, resolveLanguage } from '..';
import { en } from '../locales/en';
import { fr } from '../locales/fr';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') acc[path] = value;
    else Object.assign(acc, flatten(value, path));
    return acc;
  }, {});
}

const placeholders = (text: string) =>
  [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort();

describe('traductions', () => {
  const frKeys = flatten(fr as unknown as Tree);
  const enKeys = flatten(en as unknown as Tree);

  it('l’anglais contient exactement les mêmes clés que le français', () => {
    expect(Object.keys(enKeys).sort()).toEqual(Object.keys(frKeys).sort());
  });

  it('aucun texte vide', () => {
    for (const [key, value] of Object.entries({ ...frKeys, ...enKeys })) {
      expect([key, value.trim().length > 0]).toEqual([key, true]);
    }
  });

  it('les variables d’interpolation sont identiques dans les deux langues', () => {
    for (const [key, frText] of Object.entries(frKeys)) {
      expect([key, placeholders(enKeys[key] ?? '')]).toEqual([key, placeholders(frText)]);
    }
  });
});

describe('choix de la langue', () => {
  it('respecte un choix explicite', () => {
    expect(resolveLanguage('en', ['fr-FR'])).toBe('en');
    expect(resolveLanguage('fr', ['en-US'])).toBe('fr');
  });

  it('suit la première langue prise en charge de l’appareil', () => {
    expect(resolveLanguage('system', ['fr-CA'])).toBe('fr');
    expect(resolveLanguage('system', ['de-DE', 'en-GB', 'fr-FR'])).toBe('en');
    expect(resolveLanguage('system', ['es', null, 'fr'])).toBe('fr');
  });

  it('se replie sur l’anglais pour une langue non prise en charge', () => {
    expect(FALLBACK_LANGUAGE).toBe('en');
    expect(resolveLanguage('system', ['ja-JP'])).toBe('en');
    expect(resolveLanguage('system', [])).toBe('en');
  });
});
