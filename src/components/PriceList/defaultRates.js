export const DEFAULT_RATES = {
  // PRACE PRZYGOTOWAWCZE
  "PRZYGOT_WYWOZ": {
    category: "Przygotowanie",
    name: "Wywóz gruzu kontenerem",
    unit: "m³",
    priceNet: 60,
    vat: 0.08,
  },
  "PRZYGOT_DEMONTAZ_DRZWI": {
    category: "Przygotowanie",
    name: "Demontaż drzwi wewnętrznych",
    unit: "szt",
    priceNet: 35,
    vat: 0.08,
  },
  "PRZYGOT_DEMONTAZ_OKIEN": {
    category: "Przygotowanie",
    name: "Demontaż okien",
    unit: "szt",
    priceNet: 50,
    vat: 0.08,
  },
  "PRZYGOT_ZABEZPIECZENIE": {
    category: "Przygotowanie",
    name: "Zabezpieczenie powierzchni folią",
    unit: "m²",
    priceNet: 2,
    vat: 0.08,
  },

  // MALOWANIE
  "MAL_SCIANY": {
    category: "Malowanie",
    name: "Malowanie ścian i sufitów farbą lateksową (2x)",
    unit: "m²",
    priceNet: 18,
    vat: 0.08,
  },
  "MAL_SCIANY_STRUKTURALNA": {
    category: "Malowanie",
    name: "Malowanie farbą strukturalną",
    unit: "m²",
    priceNet: 25,
    vat: 0.08,
  },
  "MAL_GRUNTING": {
    category: "Malowanie",
    name: "Gruntowanie ścian",
    unit: "m²",
    priceNet: 5,
    vat: 0.08,
  },
  "MAL_GIPSOWANIE": {
    category: "Malowanie",
    name: "Szpachlowanie i szlifowanie ścian",
    unit: "m²",
    priceNet: 15,
    vat: 0.08,
  },
  "MAL_LISTWY": {
    category: "Malowanie",
    name: "Malowanie listew przypodłogowych",
    unit: "mb",
    priceNet: 8,
    vat: 0.08,
  },

  // GŁADZIE GIPSOWE
  "GLADZ_SCIANY": {
    category: "Gładzie",
    name: "Wykonanie gładzi gipsowej na ścianach",
    unit: "m²",
    priceNet: 22,
    vat: 0.08,
  },
  "GLADZ_SUFIT": {
    category: "Gładzie",
    name: "Wykonanie gładzi gipsowej na sufitach",
    unit: "m²",
    priceNet: 25,
    vat: 0.08,
  },
  "GLADZ_Q4": {
    category: "Gładzie",
    name: "Wykonanie gładzi w standardzie Q4",
    unit: "m²",
    priceNet: 30,
    vat: 0.08,
  },

  // PODŁOGI
  "PODL_PANELE": {
    category: "Podłogi",
    name: "Układanie paneli podłogowych",
    unit: "m²",
    priceNet: 25,
    vat: 0.08,
  },
  "PODL_PARKIET": {
    category: "Podłogi",
    name: "Układanie parkietu",
    unit: "m²",
    priceNet: 45,
    vat: 0.08,
  },
  "PODL_PLYTKI": {
    category: "Podłogi",
    name: "Układanie płytek podłogowych",
    unit: "m²",
    priceNet: 55,
    vat: 0.08,
  },
  "PODL_PODKLADOWA": {
    category: "Podłogi",
    name: "Wykładanie folii podkładowej",
    unit: "m²",
    priceNet: 3,
    vat: 0.08,
  },
  "PODL_LISTWY": {
    category: "Podłogi",
    name: "Montaż listew przypodłogowych",
    unit: "mb",
    priceNet: 12,
    vat: 0.08,
  },
  "PODL_WYROWNANIE": {
    category: "Podłogi",
    name: "Wyrównanie podłoża masą samopoziomującą",
    unit: "m²",
    priceNet: 30,
    vat: 0.08,
  },

  // PŁYTKI ŚCIENNE
  "PLYTKI_SCIANY": {
    category: "Płytki",
    name: "Układanie płytek ściennych",
    unit: "m²",
    priceNet: 60,
    vat: 0.08,
  },
  "PLYTKI_MOZAIKA": {
    category: "Płytki",
    name: "Układanie mozaiki",
    unit: "m²",
    priceNet: 90,
    vat: 0.08,
  },
  "PLYTKI_FUGOWANIE": {
    category: "Płytki",
    name: "Fugowanie płytek",
    unit: "m²",
    priceNet: 15,
    vat: 0.08,
  },
  "PLYTKI_OTWOR": {
    category: "Płytki",
    name: "Wykonanie otworów w płytkach (gniazdko, włącznik)",
    unit: "szt",
    priceNet: 20,
    vat: 0.08,
  },

  // ZABUDOWY KARTON-GIPS
  "KG_SCIANA": {
    category: "Karton-gips",
    name: "Zabudowa ściany płytami GK (1 warstwa)",
    unit: "m²",
    priceNet: 35,
    vat: 0.08,
  },
  "KG_SCIANA_2W": {
    category: "Karton-gips",
    name: "Zabudowa ściany płytami GK (2 warstwy)",
    unit: "m²",
    priceNet: 55,
    vat: 0.08,
  },
  "KG_SUFIT": {
    category: "Karton-gips",
    name: "Zabudowa sufitu płytami GK",
    unit: "m²",
    priceNet: 40,
    vat: 0.08,
  },
  "KG_SUFIT_PODWIESZANY": {
    category: "Karton-gips",
    name: "Sufit podwieszany z GK",
    unit: "m²",
    priceNet: 50,
    vat: 0.08,
  },
  "KG_SCIANA_DZIALOWA": {
    category: "Karton-gips",
    name: "Ścianka działowa z GK na stelażu",
    unit: "m²",
    priceNet: 65,
    vat: 0.08,
  },

  // INSTALACJE ELEKTRYCZNE
  "ELEK_GNIAZDKO": {
    category: "Elektryka",
    name: "Montaż gniazdka elektrycznego",
    unit: "szt",
    priceNet: 40,
    vat: 0.08,
  },
  "ELEK_WLACZNIK": {
    category: "Elektryka",
    name: "Montaż włącznika światła",
    unit: "szt",
    priceNet: 35,
    vat: 0.08,
  },
  "ELEK_LAMPA": {
    category: "Elektryka",
    name: "Montaż oprawy oświetleniowej",
    unit: "szt",
    priceNet: 50,
    vat: 0.08,
  },
  "ELEK_BRUZDY": {
    category: "Elektryka",
    name: "Wykonanie bruzd pod instalację elektryczną",
    unit: "mb",
    priceNet: 15,
    vat: 0.08,
  },
  "ELEK_PRZEWODY": {
    category: "Elektryka",
    name: "Układanie przewodów elektrycznych",
    unit: "mb",
    priceNet: 8,
    vat: 0.08,
  },

  // INSTALACJE SANITARNE
  "SANIT_UMYWALKA": {
    category: "Hydraulika",
    name: "Montaż umywalki z syfonem",
    unit: "szt",
    priceNet: 120,
    vat: 0.08,
  },
  "SANIT_WC": {
    category: "Hydraulika",
    name: "Montaż miski WC z płuczką",
    unit: "szt",
    priceNet: 150,
    vat: 0.08,
  },
  "SANIT_KABINA": {
    category: "Hydraulika",
    name: "Montaż kabiny prysznicowej",
    unit: "szt",
    priceNet: 250,
    vat: 0.08,
  },
  "SANIT_WANNA": {
    category: "Hydraulika",
    name: "Montaż wanny z syfonem",
    unit: "szt",
    priceNet: 200,
    vat: 0.08,
  },
  "SANIT_BATERIA": {
    category: "Hydraulika",
    name: "Montaż baterii umywalkowej/natryskowej",
    unit: "szt",
    priceNet: 80,
    vat: 0.08,
  },

  // STOLARKA
  "STOL_DRZWI": {
    category: "Stolarka",
    name: "Montaż drzwi wewnętrznych z ościeżnicą",
    unit: "szt",
    priceNet: 180,
    vat: 0.08,
  },
  "STOL_PARAPETY": {
    category: "Stolarka",
    name: "Montaż parapetów wewnętrznych",
    unit: "mb",
    priceNet: 30,
    vat: 0.08,
  },
  "STOL_SZAFA": {
    category: "Stolarka",
    name: "Montaż zabudowy szafy wnękowej",
    unit: "m²",
    priceNet: 200,
    vat: 0.08,
  },

  // TYNKI
  "TYN_CEMENTOWO_WAPNIENNY": {
    category: "Tynki",
    name: "Tynk cementowo-wapienny maszynowy",
    unit: "m²",
    priceNet: 28,
    vat: 0.08,
  },
  "TYN_GIPSOWY": {
    category: "Tynki",
    name: "Tynk gipsowy maszynowy",
    unit: "m²",
    priceNet: 25,
    vat: 0.08,
  },

  // DODATKOWE
  "DOD_TRANSPORT": {
    category: "Dodatkowe",
    name: "Transport materiałów",
    unit: "kpl",
    priceNet: 200,
    vat: 0.08,
  },
  "DOD_SPRZATANIE": {
    category: "Dodatkowe",
    name: "Sprzątanie końcowe",
    unit: "m²",
    priceNet: 5,
    vat: 0.08,
  },
};