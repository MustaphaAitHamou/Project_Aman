import { allCities, FRENCH_CITIES, normalizeSearchText, searchCities } from '../cities';

describe('recherche de villes', () => {
  it('normalise accents, tirets et apostrophes', () => {
    expect(normalizeSearchText('  Saint-Étienne ')).toBe('saint etienne');
    expect(normalizeSearchText('Côte d’Azur')).toBe('cote d azur');
  });

  it('trouve une ville sans tenir compte des accents ni de la casse', () => {
    expect(searchCities('saint etienne').map((c) => c.id)).toEqual(['saint-etienne']);
    expect(searchCities('NÎMES').map((c) => c.id)).toEqual(['nimes']);
    expect(searchCities('lyo').map((c) => c.id)).toEqual(['lyon']);
  });

  it('classe les débuts de nom avant les correspondances partielles', () => {
    const ids = searchCities('an').map((c) => c.id);
    expect(ids.indexOf('angers')).toBeLessThan(ids.indexOf('nantes'));
  });

  it('cherche aussi dans la région', () => {
    expect(
      searchCities('corse')
        .map((c) => c.id)
        .sort(),
    ).toEqual(['ajaccio', 'bastia']);
  });

  it('renvoie toutes les villes pour une saisie vide et rien pour une saisie inconnue', () => {
    expect(searchCities('   ')).toHaveLength(FRENCH_CITIES.length);
    expect(searchCities('zzzz')).toEqual([]);
  });

  it('identifiants uniques et coordonnées situées en France métropolitaine ou en Corse', () => {
    expect(new Set(FRENCH_CITIES.map((c) => c.id)).size).toBe(FRENCH_CITIES.length);
    for (const { center } of FRENCH_CITIES) {
      const [lng, lat] = center;
      expect(lng).toBeGreaterThan(-5.5);
      expect(lng).toBeLessThan(9.7);
      expect(lat).toBeGreaterThan(41.3);
      expect(lat).toBeLessThan(51.2);
    }
  });
});

describe('villes des autres pays', () => {
  it('le pays de l’appareil passe en premier, sans doublon d’identifiant', () => {
    const cities = allCities('DZ');
    expect(cities[0]?.country).toBe('DZ');
    expect(new Set(cities.map((c) => c.id)).size).toBe(cities.length);
    expect(allCities(null)[0]?.country).toBe('FR');
    for (const { center } of cities) {
      expect(Math.abs(center[0])).toBeLessThanOrEqual(180);
      expect(Math.abs(center[1])).toBeLessThanOrEqual(90);
    }
  });

  it('recherche sans accents dans les noms et par nom de pays', () => {
    const cities = allCities('DZ');
    expect(searchCities('bejaia', cities).map((c) => c.id)).toEqual(['bejaia']);
    const names: Record<string, string> = { DZ: 'Algérie', BE: 'Belgique' };
    const algerian = searchCities('algerie', cities, (code) => names[code] ?? '');
    expect(algerian.length).toBe(cities.filter((c) => c.country === 'DZ').length);
  });
});
