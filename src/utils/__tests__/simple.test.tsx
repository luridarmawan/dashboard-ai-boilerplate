import { generateDynamicConfigurationComponent } from '../configurationGenerator';
import { describe, it, expect} from "vitest"

describe('Simple Test', () => {
  it('should import function successfully', () => {
    expect(typeof generateDynamicConfigurationComponent).toBe('function');
  });
});