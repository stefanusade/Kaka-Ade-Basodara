export const SITE = {
  name: "Kaka Ade Basodara",
  tagline: "One Stop Digital Solution",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://kakaadebasodara.com",
  email: "hello@kakaadebasodara.com",
  phone: "+62 xxx-xxxx-xxxx",
};

export const NAV_LINKS = [
  { href: "/#services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Insights" },
  { href: "/#contact", label: "Contact" },
];

export const FOOTER_LINKS = {
  Services: ["Hosting", "Web Development", "B2B IoT Development", "Branding & Design"],
  Company: ["About", "Projects", "Insights", "Careers"],
  Legal: ["Privacy Policy", "Terms of Service"],
};
