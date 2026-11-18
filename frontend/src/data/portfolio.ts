import generatedPortfolio from "./portfolio-images.generated.json" with { type: "json" };

export type PortfolioCategorySlug = "cocina-mobiliario" | "diseno-construccion";

export type PortfolioImage = { src: string; alt: string; width: number; height: number };

export type PortfolioProject = {
  id: string;
  slug: string;
  category: PortfolioCategorySlug;
  title: string;
  shortDescription: string;
  description: string;
  tag: string;
  coverImage: PortfolioImage;
  images: readonly PortfolioImage[];
};

export type PortfolioCategory = {
  slug: PortfolioCategorySlug;
  label: string;
  projects: readonly PortfolioProject[];
  cta: { prompt: string; label: string; href: string };
};

type GeneratedImage = { src: string; width: number; height: number };
type ProjectDefinition = Omit<PortfolioProject, "id" | "coverImage" | "images"> & { cover?: number };

const imageManifest = generatedPortfolio.projects as Record<string, readonly GeneratedImage[]>;

export function wrapPortfolioIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return (index + length) % length;
}

const definitions: readonly ProjectDefinition[] = [
  {
    slug: "cocina-ambar", category: "cocina-mobiliario", title: "Cocina Ámbar", tag: "Cocina integral",
    shortDescription: "Cocina integral de composición cálida y almacenamiento continuo.",
    description: "Proyecto integral de cocina con una paleta cálida, superficies de trabajo amplias y soluciones de almacenamiento diseñadas para el uso cotidiano.",
  },
  {
    slug: "cocina-departamento", category: "cocina-mobiliario", title: "Cocina para departamento", tag: "Cocina integral",
    shortDescription: "Distribución compacta con acabados claros y funcionales.",
    description: "Una cocina pensada para aprovechar un espacio contenido mediante mobiliario a medida, una circulación despejada y acabados luminosos.",
  },
  {
    slug: "cocina-durango", category: "cocina-mobiliario", title: "Cocina Durango", tag: "Cocina integral",
    shortDescription: "Carpintería sobria y superficies de alto contraste.",
    description: "Diseño de cocina con una lectura limpia, integración de equipos y carpintería fabricada a la medida del espacio.",
  },
  {
    slug: "cocina-encinos", category: "cocina-mobiliario", title: "Cocina Encinos", tag: "Renovación de cocina",
    shortDescription: "Transformación completa documentada antes, durante y después.",
    description: "Proyecto de renovación integral que reúne el estado previo, el proceso de instalación, los detalles de carpintería y el resultado terminado.",
  },
  {
    slug: "cocina-lineal-neutra", category: "cocina-mobiliario", title: "Cocina lineal en tonos neutros", tag: "Cocina a medida",
    shortDescription: "Una solución lineal precisa para un espacio compacto.",
    description: "Cocina de trazo lineal con frentes neutros, almacenamiento superior e inferior y una composición visual continua.",
  },
  {
    slug: "cocina-acento-azul", category: "cocina-mobiliario", title: "Cocina compacta con acento azul", tag: "Cocina a medida",
    shortDescription: "Color, textura y almacenamiento en una distribución eficiente.",
    description: "Proyecto compacto que utiliza un acento cromático para dar identidad al espacio sin perder capacidad de guardado ni superficie útil.",
  },
  {
    slug: "cocina-lambrin", category: "cocina-mobiliario", title: "Cocina Lambrín", tag: "Cocina y alacena",
    shortDescription: "Mobiliario envolvente con cubierta e integración de alacena.",
    description: "Diseño, fabricación e instalación de cocina y alacena coordinadas, documentadas desde la carpintería inicial hasta el montaje de cubierta.",
  },
  {
    slug: "cocina-nogal-neo", category: "cocina-mobiliario", title: "Cocina Nogal Neo", tag: "Cocina integral",
    shortDescription: "Acabado nogal y líneas contemporáneas en una cocina abierta.",
    description: "Composición contemporánea con textura de madera, módulos a medida y una integración cuidada de electrodomésticos y herrajes.",
  },
  {
    slug: "cocina-orizaba", category: "cocina-mobiliario", title: "Cocina Orizaba", tag: "Diseño y fabricación",
    shortDescription: "Proyecto completo con isla, iluminación y proceso de ejecución.",
    description: "Una galería extensa del desarrollo de la cocina: fabricación, instalación, ajustes, detalles funcionales y resultado final.",
  },
  {
    slug: "cocina-oxford", category: "cocina-mobiliario", title: "Cocina Oxford", tag: "Cocina integral",
    shortDescription: "Volúmenes claros y contraste oscuro en una composición compacta.",
    description: "Cocina integral que combina frentes claros, detalles oscuros y almacenamiento optimizado para mantener una imagen ordenada.",
  },
  {
    slug: "cocina-verde-isla", category: "cocina-mobiliario", title: "Cocina verde con isla", tag: "Cocina con isla",
    shortDescription: "Una propuesta expresiva articulada alrededor de la isla central.",
    description: "Diseño de cocina con color protagonista, isla de trabajo y una selección de acabados que aporta carácter al espacio.",
  },
  {
    slug: "showroom-tuxtepec", category: "cocina-mobiliario", title: "Showroom Tuxtepec", tag: "Showroom",
    shortDescription: "Materiales, herrajes y soluciones de mobiliario en exhibición.",
    description: "Recorrido por el showroom de MHG en Tuxtepec: cocinas, acabados, sistemas de apertura, almacenamiento y detalles constructivos.",
  },
  {
    slug: "alacena-integral-oscura", category: "cocina-mobiliario", title: "Alacena integral oscura", tag: "Alacena a medida",
    shortDescription: "Almacenamiento de piso a techo con acabado sobrio.",
    description: "Mueble de guardado diseñado a medida para concentrar capacidad, accesibilidad y una presencia visual uniforme.",
  },
  {
    slug: "closet-amplio", category: "cocina-mobiliario", title: "Clóset de gran formato", tag: "Carpintería residencial",
    shortDescription: "Frentes continuos y distribución interior personalizada.",
    description: "Clóset fabricado a medida con una modulación amplia para ordenar prendas y objetos sin fragmentar visualmente la habitación.",
  },
  {
    slug: "closet-oscuro", category: "cocina-mobiliario", title: "Clóset en acabado oscuro", tag: "Carpintería residencial",
    shortDescription: "Carpintería de tono profundo con presencia arquitectónica.",
    description: "Solución de almacenamiento que integra un acabado oscuro y una modulación precisa para complementar el interior.",
  },
  {
    slug: "closet-compacto", category: "cocina-mobiliario", title: "Clóset compacto", tag: "Clóset a medida",
    shortDescription: "Aprovechamiento vertical para una habitación de escala contenida.",
    description: "Diseño compacto que concentra cajones, entrepaños y áreas de colgado en un frente ordenado y fácil de usar.",
  },
  {
    slug: "closet-integral", category: "cocina-mobiliario", title: "Clóset integral", tag: "Clóset a medida",
    shortDescription: "Sistema completo de guardado con módulos especializados.",
    description: "Carpintería integral resuelta según las dimensiones del espacio y las necesidades de organización del proyecto.",
  },
  {
    slug: "vestidor-contemporaneo", category: "cocina-mobiliario", title: "Vestidor contemporáneo", tag: "Vestidor a medida",
    shortDescription: "Vestidor abierto con iluminación y módulos de exhibición.",
    description: "Diseño de vestidor que combina áreas abiertas, cajoneras y luz integrada para mejorar la organización y la lectura del espacio.",
  },
  {
    slug: "mobiliario-residencial-terra", category: "cocina-mobiliario", title: "Mobiliario residencial Terra", tag: "Mobiliario integral",
    shortDescription: "Conjunto de piezas a medida para distintos espacios del departamento.",
    description: "Proyecto de mobiliario integral con soluciones para estancia, comedor y recámaras, coordinadas mediante materiales y detalles comunes.",
  },
  {
    slug: "puertas-carpinteria-interior", category: "cocina-mobiliario", title: "Puertas y carpintería interior", tag: "Carpintería interior",
    shortDescription: "Piezas de carpintería que completan la identidad del interior.",
    description: "Selección de puertas fabricadas e instaladas a medida, con atención a proporción, acabado y encuentro con los espacios.",
  },
  {
    slug: "residencia-fachada-piedra", category: "diseno-construccion", title: "Residencia con fachada de piedra", tag: "Diseño y construcción",
    shortDescription: "Composición residencial contemporánea con materialidad cálida.",
    description: "Proyecto residencial documentado desde una vista general y aérea, con una fachada que integra piedra, volúmenes limpios y áreas exteriores.",
  },
  {
    slug: "acceso-residencial", category: "diseno-construccion", title: "Acceso residencial", tag: "Arquitectura residencial",
    shortDescription: "Umbral contemporáneo definido por luz, textura y proporción.",
    description: "Diseño de acceso que articula la llegada mediante una composición sobria de materiales y elementos arquitectónicos.",
  },
  {
    slug: "interior-residencial", category: "diseno-construccion", title: "Interior residencial", tag: "Interiorismo",
    shortDescription: "Recámara terminada con carpintería integrada.",
    description: "Espacio interior resuelto como un conjunto, coordinando arquitectura, acabados y mobiliario para mantener una lectura unitaria.",
  },
  {
    slug: "obra-residencial-proceso", category: "diseno-construccion", title: "Obra residencial en proceso", tag: "Proceso de obra",
    shortDescription: "Registro de ejecución y avance de una obra residencial.",
    description: "Vista del proceso constructivo que muestra la materialización del proyecto y el seguimiento de sus etapas de obra.",
  },
];

function buildProject(definition: ProjectDefinition): PortfolioProject {
  const generatedImages = imageManifest[definition.slug];
  if (!generatedImages?.length) throw new Error(`Portfolio images missing for ${definition.slug}`);
  const images = generatedImages.map((image, index) => ({
    ...image,
    alt: `${definition.title} — fotografía ${index + 1} de ${generatedImages.length}`,
  }));
  return {
    ...definition,
    id: `portfolio:${definition.slug}`,
    coverImage: images[definition.cover ?? 0],
    images,
  };
}

export const portfolioProjects: readonly PortfolioProject[] = definitions.map(buildProject);

export const portfolioCategories: readonly PortfolioCategory[] = [
  {
    slug: "cocina-mobiliario",
    label: "Cocina y mobiliario",
    projects: portfolioProjects.filter((project) => project.category === "cocina-mobiliario"),
    cta: {
      prompt: "¿Quieres transformar tu cocina o crear mobiliario a medida?",
      label: "Cotizar mi proyecto",
      href: "https://wa.me/5212711055612?text=Hola%2C%20me%20interesa%20cotizar%20una%20cocina%20o%20mobiliario%20a%20medida.",
    },
  },
  {
    slug: "diseno-construccion",
    label: "Diseño y construcción",
    projects: portfolioProjects.filter((project) => project.category === "diseno-construccion"),
    cta: {
      prompt: "¿Tienes un proyecto residencial o comercial?",
      label: "Platicar sobre mi obra",
      href: "https://wa.me/5212711055612?text=Hola%2C%20me%20interesa%20construir%20o%20remodelar.%20%C2%BFPodr%C3%ADan%20darme%20informaci%C3%B3n%3F",
    },
  },
];

export const portfolioAudit = generatedPortfolio.audit;
