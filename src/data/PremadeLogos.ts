import Logo_GameBoyAdvance from "../assets/images/premade-logos/Logo_GameBoyAdvance.png";
import Logo_GameBoyAdvance_Outlined from "../assets/images/premade-logos/Logo_GameBoyAdvance_Outlined.png";
import Logo_GameBoyAdvance_Pkmn_1 from "../assets/images/premade-logos/Logo_GameBoyAdvance_Pkmn_1.png";
import Logo_GameBoyAdvance_Pkmn_2 from "../assets/images/premade-logos/Logo_GameBoyAdvance_Pkmn_2.png";
import Logo_GameBoyAdvance_Pkmn_3 from "../assets/images/premade-logos/Logo_GameBoyAdvance_Pkmn_3.png";
import Logo_DMG from "../assets/images/premade-logos/Logo_DMG.png";
import Logo_NES_Horizontal from "../assets/images/premade-logos/Logo_NES_Horizontal.png";
import Logo_NES_Vertical from "../assets/images/premade-logos/Logo_NES_Vertical.png";
import Logo_Famicom_1 from "../assets/images/premade-logos/Logo_Famicom_1.png";
import Logo_Famicom_2 from "../assets/images/premade-logos/Logo_Famicom_2.png";
import Logo_SNES from "../assets/images/premade-logos/Logo_SNES.png";
import Logo_MGGBC from "../assets/images/premade-logos/Logo_MGGBC.png";
import Logo_Nintendo from "../assets/images/premade-logos/Logo_Nintendo.png";

export interface PremadeLogoData {
  file: string;
  name: string;

  backgroundColor?: string;
  colorTint?: string;
  brightness?: number;
  contrast?: number;
  maxColors?: number;
}

const PremadeLogos : PremadeLogoData[] = [
  {file: Logo_GameBoyAdvance, name: "Logo_GameBoyAdvance.png", maxColors: 3},
  {file: Logo_GameBoyAdvance_Outlined, name: "Logo_GameBoyAdvance_Outlined.png", colorTint: "#4f427e"},
  {file: Logo_GameBoyAdvance_Pkmn_1, name: "Logo_GameBoyAdvance_Pkmn_1.png"},
  {file: Logo_GameBoyAdvance_Pkmn_2, name: "Logo_GameBoyAdvance_Pkmn_2.png", maxColors: 2, colorTint: "#f9fe2b"},
  {file: Logo_GameBoyAdvance_Pkmn_3, name: "Logo_GameBoyAdvance_Pkmn_3.png", maxColors: 2, colorTint: "#f9fe2b"},
  {file: Logo_DMG, name: "Logo_DMG.png", backgroundColor: "#868394"},
  {file: Logo_DMG, name: "Logo_DMG.png", brightness: -6},
  {file: Logo_NES_Horizontal, name: "Logo_NES_Horizontal.png", maxColors: 3, colorTint: "#cc2131"},
  {file: Logo_NES_Vertical, name: "Logo_NES_Vertical.png", colorTint: "#cc2131"},
  {file: Logo_Famicom_1, name: "Logo_Famicom_1.png"},
  {file: Logo_Famicom_2, name: "Logo_Famicom_2.png", maxColors: 2, colorTint: "#e6361e"},
  {file: Logo_SNES, name: "Logo_SNES.png", maxColors: 2, colorTint: "#ff0000"},
  {file: Logo_Nintendo, name: "Logo_Nintendo.png", colorTint: "#cc2131"},
  {file: Logo_MGGBC, name: "Logo_MGGBC.png", maxColors: 2},
]

export default PremadeLogos;