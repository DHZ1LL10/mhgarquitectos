import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { mockProperties, createDemoProperties } from "../src/data/properties.mock.ts";
import { createLocalPropertyRepository } from "../src/features/properties/local-repository.ts";

test("public repository exposes only published records and hides other slugs", async () => {
  const repository = createLocalPropertyRepository();
  const records = await repository.listPublished();
  assert.equal(records.length, 2);
  assert.ok(records.every(record => record.status === "published"));
  for (const record of mockProperties) {
    assert.equal(Boolean(await repository.getPublishedBySlug(record.slug)), record.status === "published");
  }
  assert.equal(await repository.getPublishedBySlug("unknown"), null);
  assert.equal(await repository.getPublishedBySlug("../admin"), null);
});

test("repository and demo state cannot mutate fixtures or subsequent reads", async () => {
  const seed = createDemoProperties();
  const repository = createLocalPropertyRepository(seed);
  seed[0].status = "archived";
  const first = await repository.listPublished();
  first[0].images[0].alt = "modified";
  first[0].title = "modified";
  const second = await repository.listPublished();
  assert.equal(second[0].title, mockProperties[0].title);
  assert.equal(second[0].images[0].alt, mockProperties[0].images[0].alt);
  assert.equal(createDemoProperties()[0].status, "published");
});

test("fixtures have unique IDs/slugs, explicit demo content and existing local images", () => {
  assert.equal(new Set(mockProperties.map(p => p.id)).size, mockProperties.length);
  assert.equal(new Set(mockProperties.map(p => p.slug)).size, mockProperties.length);
  for (const property of mockProperties) {
    assert.match(property.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.match(property.title, /ejemplo/);
    assert.ok(property.price > 0);
    assert.ok(property.images.length);
    for (const image of property.images) {
      assert.ok(existsSync(path.resolve(import.meta.dirname, "../public", image.src.slice(1))));
      assert.ok(image.width > 0 && image.height > 0 && image.alt);
    }
  }
});
