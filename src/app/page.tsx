import { Stage } from "@/design/ui";
import { Landing } from "@/design/screens/Landing";
import { SITE_URL, SITE_DESCRIPTION, CAFE } from "@/lib/site";
import { CAFE_HOURS } from "@/design/data";
import { getLandingPhotos } from "@/lib/landing-actions";

// ISR: HTML servido do cache CDN da Vercel (TTFB ~0, sem cold start nem query
// por visita). As actions do admin chamam revalidatePath("/") ao mexer nas
// fotos; o revalidate diário é só rede de segurança.
export const revalidate = 86400;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CafeOrCoffeeShop",
  "@id": `${SITE_URL}/#cafe`,
  name: CAFE.name,
  legalName: CAFE.legalName,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}/opengraph-image`,
  telephone: CAFE.phone,
  priceRange: "€",
  servesCuisine: ["Café", "Pequeno-almoço", "Sandes", "Pastelaria"],
  acceptsReservations: true,
  address: {
    "@type": "PostalAddress",
    streetAddress: CAFE.street,
    postalCode: CAFE.postal,
    addressLocality: CAFE.city,
    addressRegion: CAFE.region,
    addressCountry: CAFE.country,
  },
  geo: { "@type": "GeoCoordinates", latitude: CAFE.lat, longitude: CAFE.lng },
  hasMap: CAFE.mapsUrl,
  // Horário de CAFE_HOURS (fonte única — a UI da landing lê do mesmo sítio).
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: CAFE_HOURS[1].open,
      closes: CAFE_HOURS[1].close,
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday", "Sunday"],
      opens: CAFE_HOURS[6].open,
      closes: CAFE_HOURS[6].close,
    },
  ],
};

export default async function HomePage() {
  const photos = await getLandingPhotos();
  return (
    <Stage>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Landing photos={photos} />
    </Stage>
  );
}
