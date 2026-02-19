/**
 * Tests for validation utilities
 */

import {
  isValidId,
  normalizeId,
  validateId,
  isValidUrl,
  validateUrl,
  isValidJson,
  parseJson,
  isValidVersion,
  validateVersion,
  isValidColor,
  validateColor,
  isValidBlockType,
  validateBlockType,
  VALID_COLORS,
  VALID_BLOCK_TYPES,
} from '../lib/validation';

describe('isValidId', () => {
  it('should return true for valid UUID with hyphens', () => {
    expect(isValidId('12345678-1234-1234-1234-123456789012')).toBe(true);
  });

  it('should return true for valid UUID without hyphens', () => {
    expect(isValidId('12345678123412341234123412345678')).toBe(true);
  });

  it('should return false for invalid ID', () => {
    expect(isValidId('invalid-id')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidId('')).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isValidId(undefined as any)).toBe(false);
  });

  it('should return false for wrong length', () => {
    expect(isValidId('12345678-1234-1234')).toBe(false);
  });
});

describe('normalizeId', () => {
  it('should add hyphens to ID without hyphens', () => {
    const result = normalizeId('12345678123412341234123412345678');
    expect(result).toBe('12345678-1234-1234-1234-123412345678');
  });

  it('should keep hyphens in ID', () => {
    const result = normalizeId('12345678-1234-1234-1234-123456789012');
    expect(result).toBe('12345678-1234-1234-1234-123456789012');
  });

  it('should throw for invalid ID format', () => {
    expect(() => normalizeId('invalid')).toThrow('Invalid Notion ID format');
  });
});

describe('validateId', () => {
  it('should not throw for valid ID', () => {
    expect(() => validateId('12345678-1234-1234-1234-123456789012')).not.toThrow();
  });

  it('should throw for invalid ID', () => {
    expect(() => validateId('invalid')).toThrow('Invalid ID format');
  });

  it('should include context in error message', () => {
    expect(() => validateId('invalid', 'Page ID')).toThrow('Invalid Page ID format');
  });
});

describe('isValidUrl', () => {
  it('should return true for valid HTTP URL', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('should return true for valid HTTPS URL', () => {
    expect(isValidUrl('https://example.com/path')).toBe(true);
  });

  it('should return false for invalid URL', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('should return false for URL without protocol', () => {
    expect(isValidUrl('example.com')).toBe(false);
  });
});

describe('validateUrl', () => {
  it('should not throw for valid URL', () => {
    expect(() => validateUrl('https://example.com')).not.toThrow();
  });

  it('should throw for invalid URL', () => {
    expect(() => validateUrl('invalid')).toThrow('Invalid URL');
  });

  it('should include context in error message', () => {
    expect(() => validateUrl('invalid', 'Image URL')).toThrow('Invalid Image URL');
  });
});

describe('isValidJson', () => {
  it('should return true for valid JSON', () => {
    expect(isValidJson('{"key": "value"}')).toBe(true);
    expect(isValidJson('[1, 2, 3]')).toBe(true);
    expect(isValidJson('"string"')).toBe(true);
    expect(isValidJson('123')).toBe(true);
  });

  it('should return false for invalid JSON', () => {
    expect(isValidJson('{key: value}')).toBe(false);
    expect(isValidJson('invalid')).toBe(false);
  });
});

describe('parseJson', () => {
  it('should parse valid JSON', () => {
    const result = parseJson('{"key": "value"}');
    expect(result).toEqual({ key: 'value' });
  });

  it('should throw for invalid JSON', () => {
    expect(() => parseJson('invalid')).toThrow('Invalid JSON');
  });

  it('should include context in error message', () => {
    expect(() => parseJson('invalid', 'properties')).toThrow('Invalid properties');
  });
});

describe('isValidVersion', () => {
  it('should return true for valid version format', () => {
    expect(isValidVersion('2025-09-03')).toBe(true);
    expect(isValidVersion('2022-06-28')).toBe(true);
  });

  it('should return false for invalid version format', () => {
    expect(isValidVersion('2025/09/03')).toBe(false);
    expect(isValidVersion('25-09-03')).toBe(false);
    expect(isValidVersion('latest')).toBe(false);
  });
});

describe('validateVersion', () => {
  it('should not throw for valid version', () => {
    expect(() => validateVersion('2025-09-03')).not.toThrow();
  });

  it('should throw for invalid version', () => {
    expect(() => validateVersion('invalid')).toThrow('Invalid API version format');
  });
});

describe('isValidColor', () => {
  it('should return true for valid colors', () => {
    expect(isValidColor('default')).toBe(true);
    expect(isValidColor('red')).toBe(true);
    expect(isValidColor('blue')).toBe(true);
    expect(isValidColor('green')).toBe(true);
  });

  it('should return false for invalid colors', () => {
    expect(isValidColor('invalid')).toBe(false);
    expect(isValidColor('black')).toBe(false);
  });

  it('should validate all VALID_COLORS', () => {
    VALID_COLORS.forEach((color) => {
      expect(isValidColor(color)).toBe(true);
    });
  });
});

describe('validateColor', () => {
  it('should not throw for valid color', () => {
    expect(() => validateColor('red')).not.toThrow();
  });

  it('should throw for invalid color', () => {
    expect(() => validateColor('invalid')).toThrow('Invalid color');
  });

  it('should list valid options in error message', () => {
    try {
      validateColor('invalid');
    } catch (error) {
      expect((error as Error).message).toContain('Valid options:');
    }
  });
});

describe('isValidBlockType', () => {
  it('should return true for valid block types', () => {
    expect(isValidBlockType('paragraph')).toBe(true);
    expect(isValidBlockType('heading_1')).toBe(true);
    expect(isValidBlockType('to_do')).toBe(true);
    expect(isValidBlockType('image')).toBe(true);
  });

  it('should return false for invalid block types', () => {
    expect(isValidBlockType('invalid')).toBe(false);
    expect(isValidBlockType('nonexistent_block')).toBe(false);
  });

  it('should validate all VALID_BLOCK_TYPES', () => {
    VALID_BLOCK_TYPES.forEach((type) => {
      expect(isValidBlockType(type)).toBe(true);
    });
  });
});

describe('validateBlockType', () => {
  it('should not throw for valid block type', () => {
    expect(() => validateBlockType('paragraph')).not.toThrow();
  });

  it('should throw for invalid block type', () => {
    expect(() => validateBlockType('invalid')).toThrow('Invalid block type');
  });

  it('should list valid options in error message', () => {
    try {
      validateBlockType('invalid');
    } catch (error) {
      expect((error as Error).message).toContain('Valid options:');
    }
  });
});
