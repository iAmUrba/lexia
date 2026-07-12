export async function scenario(name: string, fn: () => Promise<void> | void) {
  console.log(`\n==========================================`);
  console.log(`📜 Scenario: ${name}`);
  console.log(`==========================================`);
  try {
    await fn();
    console.log(`✅ Escenario Superado`);
  } catch (error: any) {
    console.error(`❌ Falla en el escenario: ${error.message}`);
    process.exit(1);
  }
}

export async function given(description: string, fn: () => Promise<void> | void) {
  console.log(`  [Given] ${description}`);
  await fn();
}

export async function when(description: string, fn: () => Promise<void> | void) {
  console.log(`  [When] ${description}`);
  await fn();
}

export async function and(description: string, fn: () => Promise<void> | void) {
  console.log(`  [And] ${description}`);
  await fn();
}

export async function then(description: string, fn: () => Promise<void> | void) {
  console.log(`  [Then] ${description}`);
  await fn();
}

export function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}
