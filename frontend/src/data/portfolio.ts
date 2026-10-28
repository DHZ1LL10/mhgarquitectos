export type PortfolioCategorySlug = "construccion" | "cocinas" | "carpinteria-mobiliario" | "showroom-tuxtepec";

export type PortfolioProject = {
  src: string;
  alt: string;
  width: number;
  height: number;
  category: PortfolioCategorySlug;
  title: string;
};

export type PortfolioCategory = {
  slug: PortfolioCategorySlug;
  label: string;
  projects: readonly PortfolioProject[];
  cta: {
    prompt: string;
    label: string;
    href: string;
  };
};

const constructionProjects: readonly PortfolioProject[] = [
  { src: "/img/construccion/fachada-1.jpg", alt: "Fachada residencial realizada por MHG Arquitectos", width: 1080, height: 608, category: "construccion", title: "Fachada residencial" },
  { src: "/img/construccion/entrada.jpg", alt: "Entrada de proyecto realizada por MHG Arquitectos", width: 1080, height: 608, category: "construccion", title: "Entrada de proyecto" },
  { src: "/img/construccion/recamara.jpg", alt: "Recámara terminada con clóset integrado", width: 1080, height: 607, category: "construccion", title: "Recámara con clóset" },
  { src: "/img/construccion/obra-proceso.jpg", alt: "Obra en proceso vista desde el aire", width: 1080, height: 1080, category: "construccion", title: "Obra en proceso" },
  { src: "/img/construccion/obra-aerea.jpg", alt: "Vista aérea de un proyecto de MHG Arquitectos", width: 1080, height: 608, category: "construccion", title: "Vista aérea" },
];

const kitchenProjects: readonly PortfolioProject[] = [
  { src: "/img/portfolio/kitchens/cocina-encinos-01.webp", alt: "Cocina Encinos realizada por MHG Arquitectos", width: 1800, height: 1350, category: "cocinas", title: "Cocina Encinos" },
  { src: "/img/portfolio/kitchens/cocina-orizaba-01.webp", alt: "Cocina Orizaba realizada por MHG Arquitectos", width: 1800, height: 1350, category: "cocinas", title: "Cocina Orizaba" },
  { src: "/img/portfolio/kitchens/cocina-orizaba-02.webp", alt: "Vista frontal de Cocina Orizaba realizada por MHG Arquitectos", width: 1800, height: 1350, category: "cocinas", title: "Cocina Orizaba" },
  { src: "/img/portfolio/kitchens/cocina-nogal-neo-01.webp", alt: "Cocina Nogal Neo realizada por MHG Arquitectos", width: 1800, height: 1350, category: "cocinas", title: "Cocina Nogal Neo" },
  { src: "/img/portfolio/kitchens/cocina-romero-01.webp", alt: "Cocina Romero realizada por MHG Arquitectos", width: 1280, height: 960, category: "cocinas", title: "Cocina Romero" },
  { src: "/img/portfolio/kitchens/cocina-ambar-01.webp", alt: "Cocina Ámbar realizada por MHG Arquitectos", width: 1206, height: 1205, category: "cocinas", title: "Cocina Ámbar" },
  { src: "/img/portfolio/kitchens/cocina-lambrin-01.webp", alt: "Cocina Lambrín realizada por MHG Arquitectos", width: 1280, height: 1280, category: "cocinas", title: "Cocina Lambrín" },
  { src: "/img/portfolio/kitchens/cocina-durango-01.webp", alt: "Cocina Durango realizada por MHG Arquitectos", width: 854, height: 1280, category: "cocinas", title: "Cocina Durango" },
  { src: "/img/portfolio/kitchens/cocina-oxford-01.webp", alt: "Cocina Oxford realizada por MHG Arquitectos", width: 1280, height: 960, category: "cocinas", title: "Cocina Oxford" },
  { src: "/img/portfolio/kitchens/cocina-departamento-01.webp", alt: "Cocina para departamento realizada por MHG Arquitectos", width: 1280, height: 960, category: "cocinas", title: "Cocina para departamento" },
  { src: "/img/portfolio/kitchens/cocina-verde-01.webp", alt: "Cocina contemporánea en tonos verdes realizada por MHG Arquitectos", width: 1280, height: 1280, category: "cocinas", title: "Cocina contemporánea" },
  { src: "/img/portfolio/kitchens/cocina-azul-01.webp", alt: "Cocina contemporánea con detalles azules realizada por MHG Arquitectos", width: 1280, height: 1280, category: "cocinas", title: "Cocina contemporánea" },
];

const carpentryProjects: readonly PortfolioProject[] = [
  { src: "/img/portfolio/carpentry-furniture/closet-01.webp", alt: "Clóset de madera realizado por MHG Arquitectos", width: 1280, height: 1262, category: "carpinteria-mobiliario", title: "Clóset a medida" },
  { src: "/img/portfolio/carpentry-furniture/closet-02.webp", alt: "Interior de clóset realizado por MHG Arquitectos", width: 1496, height: 1496, category: "carpinteria-mobiliario", title: "Clóset a medida" },
  { src: "/img/portfolio/carpentry-furniture/closet-03.webp", alt: "Clóset con iluminación realizado por MHG Arquitectos", width: 1200, height: 1600, category: "carpinteria-mobiliario", title: "Clóset con iluminación" },
  { src: "/img/portfolio/carpentry-furniture/vestidor-01.webp", alt: "Vestidor de madera realizado por MHG Arquitectos", width: 960, height: 1280, category: "carpinteria-mobiliario", title: "Vestidor a medida" },
  { src: "/img/portfolio/carpentry-furniture/alacena-01.webp", alt: "Mobiliario de almacenamiento realizado por MHG Arquitectos", width: 1280, height: 1280, category: "carpinteria-mobiliario", title: "Mobiliario de almacenamiento" },
  { src: "/img/portfolio/carpentry-furniture/alacena-02.webp", alt: "Alacena integrada realizada por MHG Arquitectos", width: 1280, height: 1024, category: "carpinteria-mobiliario", title: "Alacena integrada" },
  { src: "/img/portfolio/carpentry-furniture/alacena-03.webp", alt: "Alacena en acabado oscuro realizada por MHG Arquitectos", width: 1280, height: 1280, category: "carpinteria-mobiliario", title: "Alacena a medida" },
  { src: "/img/portfolio/carpentry-furniture/mobiliario-terra-01.webp", alt: "Mobiliario interior Terra realizado por MHG Arquitectos", width: 1280, height: 854, category: "carpinteria-mobiliario", title: "Mobiliario Terra" },
  { src: "/img/portfolio/carpentry-furniture/mobiliario-terra-02.webp", alt: "Mueble de sala Terra realizado por MHG Arquitectos", width: 854, height: 1280, category: "carpinteria-mobiliario", title: "Mobiliario Terra" },
  { src: "/img/portfolio/carpentry-furniture/mobiliario-terra-03.webp", alt: "Comedor con mobiliario Terra realizado por MHG Arquitectos", width: 1280, height: 854, category: "carpinteria-mobiliario", title: "Mobiliario Terra" },
  { src: "/img/portfolio/carpentry-furniture/mobiliario-terra-04.webp", alt: "Mobiliario interior iluminado realizado por MHG Arquitectos", width: 854, height: 1280, category: "carpinteria-mobiliario", title: "Mobiliario Terra" },
  { src: "/img/portfolio/carpentry-furniture/mobiliario-terra-05.webp", alt: "Cabecera y mesas laterales realizadas por MHG Arquitectos", width: 1280, height: 854, category: "carpinteria-mobiliario", title: "Mobiliario de recámara" },
  { src: "/img/portfolio/carpentry-furniture/puerta-01.webp", alt: "Puerta de madera realizada por MHG Arquitectos", width: 960, height: 1280, category: "carpinteria-mobiliario", title: "Puerta de madera" },
  { src: "/img/portfolio/carpentry-furniture/puerta-02.webp", alt: "Puerta contemporánea realizada por MHG Arquitectos", width: 960, height: 1280, category: "carpinteria-mobiliario", title: "Puerta contemporánea" },
];

const showroomProjects: readonly PortfolioProject[] = [
  { src: "/img/portfolio/showroom-tuxtepec/showroom-tuxtepec-01.webp", alt: "Exhibición de acabados en el showroom de MHG Arquitectos en Tuxtepec", width: 1800, height: 1350, category: "showroom-tuxtepec", title: "Exhibición de acabados" },
  { src: "/img/portfolio/showroom-tuxtepec/showroom-tuxtepec-02.webp", alt: "Cocina de exhibición en el showroom de MHG Arquitectos en Tuxtepec", width: 1800, height: 1350, category: "showroom-tuxtepec", title: "Cocina de exhibición" },
  { src: "/img/portfolio/showroom-tuxtepec/showroom-tuxtepec-03.webp", alt: "Mobiliario de exhibición en el showroom de MHG Arquitectos en Tuxtepec", width: 1800, height: 1350, category: "showroom-tuxtepec", title: "Mobiliario de exhibición" },
  { src: "/img/portfolio/showroom-tuxtepec/showroom-tuxtepec-04.webp", alt: "Mecanismos de almacenamiento en el showroom de MHG Arquitectos en Tuxtepec", width: 1800, height: 1350, category: "showroom-tuxtepec", title: "Mecanismos de almacenamiento" },
  { src: "/img/portfolio/showroom-tuxtepec/showroom-tuxtepec-05.webp", alt: "Vista general del showroom de MHG Arquitectos en Tuxtepec", width: 1800, height: 1350, category: "showroom-tuxtepec", title: "Showroom Tuxtepec" },
  { src: "/img/portfolio/showroom-tuxtepec/showroom-tuxtepec-06.webp", alt: "Muestras y mobiliario en el showroom de MHG Arquitectos en Tuxtepec", width: 1800, height: 1350, category: "showroom-tuxtepec", title: "Selección de materiales" },
  { src: "/img/portfolio/showroom-tuxtepec/showroom-tuxtepec-07.webp", alt: "Herrajes exhibidos en el showroom de MHG Arquitectos en Tuxtepec", width: 1350, height: 1800, category: "showroom-tuxtepec", title: "Herrajes y mecanismos" },
  { src: "/img/portfolio/showroom-tuxtepec/showroom-tuxtepec-08.webp", alt: "Detalle de cajones en el showroom de MHG Arquitectos en Tuxtepec", width: 809, height: 1800, category: "showroom-tuxtepec", title: "Detalle de mecanismos" },
];

export const portfolioCategories: readonly PortfolioCategory[] = [
  {
    slug: "construccion",
    label: "Diseño y construcción",
    projects: constructionProjects,
    cta: {
      prompt: "¿Tienes un proyecto residencial o comercial?",
      label: "Platicar sobre mi obra",
      href: "https://wa.me/5212711055612?text=Hola%2C%20me%20interesa%20construir%20o%20remodelar.%20%C2%BFPodr%C3%ADan%20darme%20informaci%C3%B3n?",
    },
  },
  {
    slug: "cocinas",
    label: "Cocinas",
    projects: kitchenProjects,
    cta: {
      prompt: "¿Quieres renovar tu cocina?",
      label: "Cotizar mi cocina",
      href: "https://wa.me/5212711055612?text=Hola%2C%20me%20interesa%20una%20Cocina%20Integral%20a%20medida.%20%C2%BFPueden%20cotizarme?",
    },
  },
  {
    slug: "carpinteria-mobiliario",
    label: "Carpintería y mobiliario",
    projects: carpentryProjects,
    cta: {
      prompt: "¿Buscas mobiliario hecho a medida?",
      label: "Cotizar mobiliario",
      href: "https://wa.me/5212711055612?text=Hola%2C%20me%20interesa%20cotizar%20mobiliario%20hecho%20a%20medida.",
    },
  },
  {
    slug: "showroom-tuxtepec",
    label: "Showroom Tuxtepec",
    projects: showroomProjects,
    cta: {
      prompt: "Conoce materiales y soluciones en nuestro showroom.",
      label: "Contactar showroom",
      href: "https://wa.me/5212711055612?text=Hola%2C%20me%20interesa%20conocer%20el%20showroom%20de%20MHG%20Arquitectos%20en%20Tuxtepec.",
    },
  },
];
