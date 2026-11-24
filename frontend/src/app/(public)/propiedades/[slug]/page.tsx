import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { propertyRepository } from "@/features/properties";
import PropertyDetail from "@/features/properties/components/PropertyDetail";
import { propertySeoDescription } from "@/features/properties/presentation";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const property = await propertyRepository.getPublishedBySlug((await params).slug);
  if (!property) notFound();
  const title = `${property.title} | MHG Arquitectos`;
  const description = propertySeoDescription(property);
  const url = `/propiedades/${property.slug}`;
  const images = property.images.slice(0, 1).map(image => ({ url: image.src, width: image.width, height: image.height, alt: image.alt }));
  return {
    title, description, alternates: { canonical: url },
    openGraph: { title, description, url, images, type: "website", locale: "es_MX" },
    twitter: { card: "summary_large_image", title, description, images: images.map(image => image.url) },
  };
}

export default async function PropertyPage({ params }: Props) {
  const property = await propertyRepository.getPublishedBySlug((await params).slug);
  if (!property) notFound();
  return <PropertyDetail property={property} />;
}
