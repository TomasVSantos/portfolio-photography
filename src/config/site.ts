export const siteConfig = {
  name: "Tomás Santos",
  title: "Tomás Santos | Photography",
  description:
    "Photography of places, people, live music, and everyday moments by Tomás Santos.",
  url: "https://tomasvsantos.pt",
  email: "tomasvsantos04@gmail.com",
  instagram: "https://instagram.com/tomas.vsantos",
  github: "https://github.com/tomasvsantos",
} as const;

export const navigation = [
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/gear", label: "Gear" },
  { href: "/contact", label: "Contact" },
] as const;
