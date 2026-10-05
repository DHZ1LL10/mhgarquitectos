import assert from "node:assert/strict";
import test from "node:test";
import { createDemoProperties } from "../src/data/properties.mock.ts";
import { saveDemoProperty, validateDemoProperty } from "../src/features/properties/admin/demo-state.ts";

test("demo editing changes only the supplied copy and reset restores fixtures", () => {
  const initial = createDemoProperties();
  const edited = structuredClone(initial[2]); edited.status = "published"; edited.title = "Ejemplo editado";
  const saved = saveDemoProperty(initial, edited);
  assert.equal(saved[2].status, "published");
  assert.equal(initial[2].status, "draft");
  assert.equal(createDemoProperties()[2].status, "draft");
  const next = { ...edited, id: "new-demo", slug: "nueva-propiedad-demo" };
  assert.equal(saveDemoProperty(saved, next).length, 5);
});

test("demo rejects duplicate slugs, invalid URL segments and non-finite prices", () => {
  const initial = createDemoProperties();
  const invalid = structuredClone(initial[0]); invalid.slug = initial[1].slug;
  assert.ok(validateDemoProperty(invalid, initial).some(error => error.includes("otra propiedad")));
  invalid.slug = "../admin"; invalid.price = Infinity; invalid.features.bedrooms = -1;
  assert.ok(validateDemoProperty(invalid, initial).length >= 3);
  assert.throws(() => saveDemoProperty(initial, invalid));
});
