/**
 * Regenerates textNet.<locale>.json (the trained network) and curve.<locale>.json
 * (its test accuracy after each mini-batch) from a fresh seeded training.
 * Run from the repository root:
 *   pnpm exec tsx packages/scene-components/src/textlab/data/trainNets.ts
 * then run the tests: they say which picked sentences or scores changed.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { computeAccuracyCurve } from "./learning.ts";
import { serializeNet, trainTextNet } from "./net.ts";

for (const locale of ["en", "fr"] as const) {
  const file = serializeNet(trainTextNet(locale), locale);
  const path = fileURLToPath(new URL(`./textNet.${locale}.json`, import.meta.url));
  writeFileSync(path, JSON.stringify(file) + "\n");
  const curve = computeAccuracyCurve(locale);
  writeFileSync(fileURLToPath(new URL(`./curve.${locale}.json`, import.meta.url)), JSON.stringify(curve) + "\n");
  console.log(
    `${locale}: ${file.vocab.length} words, train ${(file.trainAccuracy * 100).toFixed(1)}%, test ${(file.testAccuracy * 100).toFixed(1)}%`,
  );
}
