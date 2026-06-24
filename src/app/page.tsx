import { Stage } from "@/design/ui";
import { Landing } from "@/design/screens/Landing";
import { SITE_URL, CAFE } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CafeOrCoffeeShop",
  name: CAFE.name,
  legalName: CAFE.legalName,
  url: SITE_URL,
  image: `${SITE_URL}/opengraph-image`,
  telephone: CAFE.phone,
  priceRange: "€",
  servesCuisine: ["Café", "Pequeno-almoço", "Sandes", "Pastelaria"],
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
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "06:30",
      closes: "17:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday", "Sunday"],
      opens: "07:00",
      closes: "15:00",
    },
  ],
};

export default function HomePage() {
  return (
    <Stage>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Landing />
    </Stage>
  );
}
