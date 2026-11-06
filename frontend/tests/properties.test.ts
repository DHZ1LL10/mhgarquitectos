import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { mockProperties, createDemoProperties } from "../src/data/properties.mock.ts";
import { createLocalPropertyRepository } from "../src/features/properties/local-repository.ts";
import { propertySeoDescription, propertyWhatsAppUrl } from "../src/features/properties/presentation.ts";

const realSlug = "residencia-mata-larga-fortin";
const realProperty = mockProperties.find(property => property.slug === realSlug)!;
const read = (relative: string) => readFileSync(path.resolve(import.meta.dirname, "..", relative), "utf8");

test("public repository exposes only the real published listing", async () => {
  const repository = createLocalPropertyRepository();
  const records = await repository.listPublished();
  assert.deepEqual(records.map(record => record.slug), [realSlug]);
  assert.equal((await repository.getPublishedBySlug(realSlug))?.title, "Residencia en venta en Mata Larga, Fortín");
  for (const record of mockProperties.filter(property => property.id.startsWith("demo-"))) {
    assert.notEqual(record.status, "published");
    assert.equal(await repository.getPublishedBySlug(record.slug), null);
  }
  assert.equal(await repository.getPublishedBySlug("unknown"), null);
  assert.equal(await repository.getPublishedBySlug("../admin"), null);
});

test("repository consumers cannot mutate the catalog seed", async () => {
  const seed = createDemoProperties();
  const repository = createLocalPropertyRepository(seed);
  seed[0].status = "archived";
  const first = await repository.listPublished();
  first[0].images[0].alt = "modified";
  first[0].title = "modified";
  const second = await repository.listPublished();
  assert.equal(second[0].title, realProperty.title);
  assert.equal(second[0].images[0].alt, realProperty.images[0].alt);
  assert.equal(createDemoProperties()[0].status, "published");
});

test("real listing contains exact commercial data and usable local photographs", () => {
  assert.equal(realProperty.price, 2_990_000);
  assert.deepEqual(realProperty.location, { neighborhood: "Mata Larga", city: "Fortín", state: "Veracruz" });
  assert.deepEqual({
    construction: realProperty.features.constructionAreaM2,
    land: realProperty.features.landAreaM2,
    garden: realProperty.features.gardenAreaM2,
    bedrooms: realProperty.features.bedrooms,
    bathrooms: realProperty.features.bathrooms,
    halfBathrooms: realProperty.features.halfBathrooms,
    parking: realProperty.features.parkingSpaces,
    progress: realProperty.features.constructionProgress,
    listPrice: realProperty.features.listPrice,
    bonus: realProperty.features.bonus,
  }, { construction: 174, land: 202, garden: 105, bedrooms: 3, bathrooms: 2, halfBathrooms: 1, parking: null, progress: 85, listPrice: 3_190_000, bonus: 200_000 });
  assert.equal(realProperty.images.length, 18);
  assert.match(realProperty.images[0].src, /fachada-portada\.jpg$/);
  for (const image of realProperty.images) {
    assert.ok(existsSync(path.resolve(import.meta.dirname, "../public", image.src.slice(1))), image.src);
    assert.equal(image.width, 1080);
    assert.equal(image.height, 1350);
    assert.ok(image.alt);
  }
});

test("legacy property records remain structurally compatible", () => {
  const legacy = mockProperties.find(property => property.id === "demo-001")!;
  assert.deepEqual(legacy.features, { areaM2: 180, bedrooms: 3, bathrooms: 2, parkingSpaces: 2 });
  assert.match(legacy.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
});

test("SEO and WhatsApp use the real listing without inventing parking", () => {
  assert.equal(propertySeoDescription(realProperty), "202 m² de terreno, 174 m² de construcción, 105 m² de jardín, 3 recámaras y precio de oportunidad de $2,990,000 MXN.");
  const whatsapp = new URL(propertyWhatsAppUrl(realProperty));
  assert.equal(whatsapp.hostname, "wa.me");
  assert.match(whatsapp.searchParams.get("text") || "", /Mata Larga, Fortín/);
  assert.match(whatsapp.searchParams.get("text") || "", /\$2,990,000 MXN/);
  assert.doesNotMatch(whatsapp.searchParams.get("text") || "", /estacionamiento|cajón/i);
});

test("public card, detail and gallery present a real property", () => {
  const card = read("src/features/properties/components/PropertyCard.tsx");
  const detail = read("src/features/properties/components/PropertyDetail.tsx");
  const gallery = read("src/features/properties/components/PropertyGallery.tsx");
  const listingPage = read("src/app/(public)/propiedades/page.tsx");
  const route = read("src/app/(public)/propiedades/[slug]/page.tsx");
  assert.match(card, /constructionAreaM2/);
  assert.match(card, /landAreaM2/);
  assert.match(detail, /Precio de lista/);
  assert.match(detail, /Bono especial/);
  assert.match(detail, /Agendar visita por WhatsApp/);
  assert.match(gallery, /Fotografías de la propiedad/);
  assert.match(gallery, /Fotografía.*de/);
  assert.doesNotMatch(card + detail + gallery + listingPage, /DemoNotice|ficticia|Fotografías de ejemplo|solo ilustrativa/i);
  assert.match(route, /propertySeoDescription/);
});
