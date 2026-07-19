export const siteConfig = {
  name: "Tomás Santos",
  title: "Tomás Santos — Photography",
  description: "Documentary, travel, and street photography by Tomás Santos.",
  url: "https://tomassantos.photo",
  email: "hello@tomassantos.photo",
  instagram: "https://instagram.com/",
  github: "https://github.com/",
} as const;

export const navigation = [
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/gear", label: "Gear" },
  { href: "/contact", label: "Contact" },
] as const;
