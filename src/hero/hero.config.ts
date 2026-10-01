/* =========================================================================
   CONFIGURAÇÃO DO HERO — tudo que muda fica aqui
   (portado de docs/referencias/hero-rape-xingu/index.html)
   -------------------------------------------------------------------------
   holdSeconds        tempo que cada composição fica parada
   transitionSeconds  duração da troca (produto + texto + fundo)
   autoplay           troca sozinha em loop infinito quando ninguém rola a página
   tabletScale        multiplica o tamanho do produto em tablets deitados
   scroll             trecho de scroll (em alturas de tela) que avança um sabor
                      enquanto o hero fica preso; depois a página é liberada
   slides[]:
     word         palavra grande atrás do produto
     line, name, composition, swatchLabel   textos do painel
     image        arquivo em public/ (provisório até as fotos da fábrica chegarem)
     colors       from = centro (luz atrás do produto), to = bordas
     swatch       cor da bolinha do seletor
     product      posição final: x / y em % da menor dimensão do hero,
                  rotate em graus, size = largura em % da menor dimensão
     mobile       (opcional) sobrescreve product no celular
     enter        direção de entrada: 'right' | 'left' | 'top' | 'bottom'
     dust         cor do pó (r,g,b) que explode quando o produto pousa
   ========================================================================= */

export type EnterFrom = "right" | "left" | "top" | "bottom";

export interface HeroPlacement {
  x: number;
  y: number;
  rotate: number;
  size: number;
}

export interface HeroSlide {
  word: string;
  line: string;
  name: string;
  composition: string;
  swatchLabel: string;
  image: { src: string; width: number; height: number; alt: string };
  colors: { from: string; to: string };
  swatch: string;
  product: HeroPlacement;
  mobile?: Partial<HeroPlacement>;
  enter: EnterFrom;
  dust: string;
}

export interface HeroConfig {
  holdSeconds: number;
  transitionSeconds: number;
  autoplay: boolean;
  tabletScale: number;
  scroll: { perSlide: number; perSlideMobile: number };
  slides: HeroSlide[];
}

export const HERO_CONFIG: HeroConfig = {
  holdSeconds: 1.8,
  transitionSeconds: 1.15,
  autoplay: true,
  tabletScale: 0.8,
  scroll: { perSlide: 0.6, perSlideMobile: 0.45 },
  slides: [
    {
      word: "Xingu",
      line: "Linha Xingu",
      name: "Eucaliptu’s Selva",
      composition: "Fumo, eucalipto e mentol.",
      swatchLabel: "Eucaliptu’s Selva",
      image: { src: "img/selva-3d.webp", width: 562, height: 516, alt: "Latinha de rapé Xingu Eucaliptu’s Selva" },
      colors: { from: "#46A862", to: "#164D2B" },
      swatch: "#3E9A57",
      product: { x: 2, y: 4, rotate: -8, size: 50 },
      mobile: { x: 0, y: -4, rotate: -8, size: 70 },
      enter: "right",
      dust: "28,18,10",
    },
    {
      word: "Zero°",
      line: "Linha Zero Grau",
      name: "Super Mentolado",
      composition: "Fumo, cravo, canela, anis, alecrim, eucalipto e mentol.",
      swatchLabel: "Super Mentolado",
      image: { src: "img/zero-grau.webp", width: 800, height: 800, alt: "Latinha de rapé Zero Grau Super Mentolado" },
      colors: { from: "#3A56CC", to: "#0E1A5E" },
      swatch: "#23399E",
      product: { x: -2, y: 5, rotate: 12, size: 40 },
      mobile: { x: 0, y: -4, rotate: 12, size: 60 },
      enter: "top",
      dust: "10,14,40",
    },
    {
      word: "Puro",
      line: "Linha Xingu",
      name: "Puro Tabaco",
      composition: "Fumo torrado e moído.",
      swatchLabel: "Puro Tabaco",
      image: { src: "img/puro-tabaco-aberto.webp", width: 1100, height: 573, alt: "Latinha de rapé Xingu Puro Tabaco aberta, ao lado da tampa" },
      colors: { from: "#D08A42", to: "#6A3612" },
      swatch: "#B8692A",
      product: { x: 0, y: 8, rotate: -5, size: 62 },
      mobile: { x: 0, y: -2, rotate: -5, size: 90 },
      enter: "left",
      dust: "46,26,10",
    },
    {
      word: "Raiz",
      line: "Fábrica de rapé em Alexânia, Goiás",
      name: "Tabaco, ervas e tempo.",
      composition:
        "Há [25] anos a Xingu torra o fumo, mói as ervas e enche cada latinha na própria fábrica. Conheça a linha e leve para a sua tabacaria.",
      swatchLabel: "A fábrica",
      image: { src: "img/selva-topo.webp", width: 760, height: 748, alt: "Tampa da latinha de rapé Xingu Eucaliptu’s Selva" },
      colors: { from: "#31785D", to: "#0C2E24" },
      swatch: "#1E5642",
      product: { x: 9, y: 4, rotate: 22, size: 36 },
      mobile: { x: 2, y: -4, rotate: 22, size: 52 },
      enter: "bottom",
      dust: "12,24,18",
    },
  ],
};
