// Common origins of USMLE examinees first, then alphabetical.
export const COUNTRIES: { code: string; name: string }[] = [
  { code: "US", name: "United States" }, { code: "IN", name: "India" }, { code: "PK", name: "Pakistan" },
  { code: "GB", name: "United Kingdom" }, { code: "CA", name: "Canada" }, { code: "EG", name: "Egypt" },
  { code: "NG", name: "Nigeria" }, { code: "BD", name: "Bangladesh" }, { code: "PH", name: "Philippines" },
  { code: "SA", name: "Saudi Arabia" }, { code: "AE", name: "United Arab Emirates" }, { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" }, { code: "JO", name: "Jordan" }, { code: "LB", name: "Lebanon" }, { code: "SY", name: "Syria" },
  { code: "NP", name: "Nepal" }, { code: "LK", name: "Sri Lanka" }, { code: "CN", name: "China" }, { code: "KR", name: "South Korea" },
  { code: "JP", name: "Japan" }, { code: "BR", name: "Brazil" }, { code: "MX", name: "Mexico" }, { code: "CO", name: "Colombia" },
  { code: "VE", name: "Venezuela" }, { code: "PE", name: "Peru" }, { code: "AR", name: "Argentina" }, { code: "DE", name: "Germany" },
  { code: "FR", name: "France" }, { code: "IT", name: "Italy" }, { code: "ES", name: "Spain" }, { code: "PL", name: "Poland" },
  { code: "RO", name: "Romania" }, { code: "UA", name: "Ukraine" }, { code: "RU", name: "Russia" }, { code: "TR", name: "Turkey" },
  { code: "GR", name: "Greece" }, { code: "IL", name: "Israel" }, { code: "IE", name: "Ireland" }, { code: "NL", name: "Netherlands" },
  { code: "KE", name: "Kenya" }, { code: "GH", name: "Ghana" }, { code: "ET", name: "Ethiopia" }, { code: "ZA", name: "South Africa" },
  { code: "MY", name: "Malaysia" }, { code: "SG", name: "Singapore" }, { code: "ID", name: "Indonesia" }, { code: "VN", name: "Vietnam" },
  { code: "TH", name: "Thailand" }, { code: "AU", name: "Australia" }, { code: "NZ", name: "New Zealand" }, { code: "CU", name: "Cuba" },
  { code: "DO", name: "Dominican Republic" }, { code: "JM", name: "Jamaica" }, { code: "TT", name: "Trinidad and Tobago" },
  { code: "KW", name: "Kuwait" }, { code: "QA", name: "Qatar" }, { code: "OM", name: "Oman" }, { code: "BH", name: "Bahrain" },
  { code: "MA", name: "Morocco" }, { code: "TN", name: "Tunisia" }, { code: "DZ", name: "Algeria" }, { code: "LY", name: "Libya" },
  { code: "SD", name: "Sudan" }, { code: "AF", name: "Afghanistan" }, { code: "UZ", name: "Uzbekistan" }, { code: "KZ", name: "Kazakhstan" },
];

export function flagEmoji(code?: string | null) {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
