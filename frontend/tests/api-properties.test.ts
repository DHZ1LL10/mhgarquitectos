import assert from "node:assert/strict";
import test from "node:test";
import { ApiPropertyRepository, mapApiProperty } from "../src/features/properties/api-repository.ts";
import { createConfiguredPropertyRepository } from "../src/features/properties/configured-repository.ts";

function dto(overrides: Record<string, unknown> = {}) {
  return {
    id: "test-id", slug: "casa-prueba", status: "published", title: "Casa", description: "Descripción",
    operation: "sale", property_type: "house", price: "2500000.50", currency: "MXN",
    location: { city: "Puebla", state: "Puebla", neighborhood: "Centro" },
    features: { area_m2: 180, bedrooms: 3, bathrooms: 2, parking_spaces: 2 },
    images: [{ url: "/img/test.jpg", alt: "Fachada", width: 1200, height: 800 }],
    ...overrides,
  };
}

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

test("HTTP adapter maps decimal/snake_case DTO to the existing view contract", () => {
  const property = mapApiProperty(dto());
  assert.equal(property.price, 2500000.5);
  assert.equal(property.propertyType, "house");
  assert.equal(property.features.areaM2, 180);
  assert.equal(property.images[0].src, "/img/test.jpg");
});

test("HTTP adapter pages through published properties", async () => {
  const urls: string[] = [];
  const fetcher: typeof fetch = async input => {
    urls.push(String(input));
    return reply(urls.length === 1 ? Array.from({ length: 100 }, (_, i) => dto({ id: String(i) })) : [dto({ id: "last" })]);
  };
  const repository = new ApiPropertyRepository("http://localhost:8000/api/v1/", fetcher);
  assert.equal((await repository.listPublished()).length, 101);
  assert.equal(urls[1], "http://localhost:8000/api/v1/properties?limit=100&offset=100");
});

test("detail maps 404 to null but propagates API failures", async () => {
  assert.equal(await new ApiPropertyRepository("http://localhost/api/v1", async () => reply({}, 404)).getPublishedBySlug("missing"), null);
  await assert.rejects(() => new ApiPropertyRepository("http://localhost/api/v1", async () => reply({}, 503)).getPublishedBySlug("casa"), /503/);
  await assert.rejects(() => new ApiPropertyRepository("http://localhost/api/v1", async () => { throw new Error("timeout"); }).listPublished(), /timeout/);
  const repository = new ApiPropertyRepository("http://localhost/api/v1", async () => { throw new Error("must not fetch"); });
  assert.equal(await repository.getPublishedBySlug("../admin"), null);
});

test("adapter rejects malformed/private/mismatched records instead of masking failures with mocks", async () => {
  for (const overrides of [{ status: "draft" }, { status: "archived" }, { currency: "USD" },
    { price: "" }, { price: null }, { operation: "other" }, { images: null }]) {
    assert.throws(() => mapApiProperty(dto(overrides)));
  }
  const repository = new ApiPropertyRepository("http://localhost/api/v1", async () => reply(dto()));
  await assert.rejects(() => repository.getPublishedBySlug("different"), /different slug/);
  const repeated = new ApiPropertyRepository("http://localhost/api/v1", async () => reply(Array.from({ length: 100 }, () => dto())));
  await assert.rejects(() => repeated.listPublished(), /duplicate/);
});

test("configuration keeps local default and requires explicit API configuration", async () => {
  assert.ok((await createConfiguredPropertyRepository({}).listPublished()).length > 0);
  assert.throws(() => createConfiguredPropertyRepository({ PROPERTY_REPOSITORY: "api" }), /required/);
  assert.throws(() => createConfiguredPropertyRepository({ PROPERTY_REPOSITORY: "typo" }), /local or api/);
  assert.ok(createConfiguredPropertyRepository({ PROPERTY_REPOSITORY: "api", PROPERTY_API_BASE_URL: "http://localhost:8000/api/v1" }) instanceof ApiPropertyRepository);
  assert.throws(() => new ApiPropertyRepository("https://user:password@example.com/api/v1"), /without credentials/);
});

