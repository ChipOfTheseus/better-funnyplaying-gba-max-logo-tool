import * as iq from "image-q";
import MaxScreen from "../data/MaxScreen.ts";
import type { ImageQuantization } from "image-q";
import colorConvert from 'color-convert';

export interface MaxScreenCompatibleRawImageData {
  palette: iq.utils.Point[];
  imageData: ImageData;
}

export interface MaxScreenCompressedImageBuffers {
  valid: boolean;
  paletteBuffer: Uint8Array<ArrayBuffer>;
  compressedImageDataBuffer: Uint8Array<ArrayBuffer>;
}

export function createMaxScreenCompatibleRawImageData(
  imageCanvas: OffscreenCanvas,
  backgroundColor: string,
  brightness: number,
  contrast: number,
  maxColorCount: number,
  colorizeColor: string | null,
  imageQuantizationType: ImageQuantization
): MaxScreenCompatibleRawImageData {
  const imageWidth = imageCanvas.width;
  const imageHeight = imageCanvas.height;

  const imageContext = imageCanvas.getContext("2d", {willReadFrequently: true})!;
  const adjustedImageData = imageContext.getImageData(0, 0, imageWidth, imageHeight);

  function applyBrightnessAndContrast(c: number) {
    return Math.min(Math.max(((c + brightness) - 128) * contrast + 128, 0), 255);
  }

  const colorizeColorHsl = colorizeColor !== null ? colorConvert.rgb.hsl(colorConvert.hex.rgb(colorizeColor)) : null;
  for (let i = 0; i < adjustedImageData.data.length; i += 4) {
    adjustedImageData.data[i] = applyBrightnessAndContrast(adjustedImageData.data[i]);
    adjustedImageData.data[i + 1] = applyBrightnessAndContrast(adjustedImageData.data[i + 1]);
    adjustedImageData.data[i + 2] = applyBrightnessAndContrast(adjustedImageData.data[i + 2]);

    if (colorizeColorHsl !== null) {
      const hslPixel = colorConvert.rgb.hsl(adjustedImageData.data[i], adjustedImageData.data[i + 1], adjustedImageData.data[i + 2]);

      // Apply colorization by changing hue and saturation to one from the base color
      hslPixel[0] = colorizeColorHsl[0];
      hslPixel[1] = colorizeColorHsl[1];

      const rgbPixelTemp = colorConvert.hsl.rgb(hslPixel);
      adjustedImageData.data[i] = rgbPixelTemp[0];
      adjustedImageData.data[i + 1] = rgbPixelTemp[1];
      adjustedImageData.data[i + 2] = rgbPixelTemp[2];
    }
  }

  const adjustedImageCanvas = new OffscreenCanvas(imageWidth, imageHeight);
  const adjustedImageContext = adjustedImageCanvas.getContext("2d", {willReadFrequently: true})!;
  adjustedImageContext.putImageData(adjustedImageData, 0, 0);

  const workCanvas = new OffscreenCanvas(imageWidth, imageHeight);
  const workContext = workCanvas.getContext("2d", {willReadFrequently: true})!;

  workContext.fillStyle = backgroundColor;
  workContext.fillRect(0, 0, workCanvas.width, workCanvas.height);
  workContext.drawImage(adjustedImageCanvas, 0, 0, workCanvas.width, workCanvas.height);

  const workImageData = workContext.getImageData(0, 0, workCanvas.width, workCanvas.height);

  const workImageDataPoints = iq.utils.PointContainer.fromImageData(workImageData);
  const workImagePalette = iq.buildPaletteSync(
    [workImageDataPoints],
    {
      colors: maxColorCount,
      paletteQuantization: "rgbquant",
      colorDistanceFormula: "euclidean-bt709-noalpha"
    }
  );

  const reducedWorkImageDataPoints = iq.applyPaletteSync(
    workImageDataPoints,
    workImagePalette,
    {
      imageQuantization: imageQuantizationType
    }
  );

  const reducedImageBuffer = Uint8ClampedArray.from(reducedWorkImageDataPoints.toUint8Array());
  const reducedImageData = new ImageData(reducedImageBuffer, workCanvas.width, workCanvas.height);

  return {
    palette: workImagePalette.getPointContainer().getPointArray(),
    imageData: reducedImageData,
  };
}

export function createMaxScreenCompressedImageBuffers(palette: iq.utils.Point[], imageData: ImageData): MaxScreenCompressedImageBuffers {
  // Internal image format used by the screen allows up to 4 (four) 32-bit colors.
  // Pixel data is compressed using basic run-length encoding
  // Each RLE byte stream entry is: 2 bits color index in palette, 6 bits run-length

  const paletteColorsCount = palette.length;
  const paletteUint32 = new Uint32Array(4);
  for (let i = 0; i < paletteColorsCount; i++) {
    paletteUint32[i] = palette[i].uint32;
  }

  const imageDataArray = iq.utils.PointContainer.fromImageData(imageData).toUint32Array();

  function getPaletteColorIndex(colorUint32: number) {
    for (let i = 0; i < paletteColorsCount; i++) {
      if (paletteUint32[i] === colorUint32) {
        return i;
      }
    }

    throw new Error(`Failed to find color ${colorUint32}, this shouldn't happen`);
  }

  const rleImageData : number[] = [];

  function createRawRleEntry(paletteIndex: number, runLength: number) {
    //console.log(`[rle] index ${paletteIndex}: ${runLength}`);
    const paletteIndexBits = paletteIndex & 0b11;
    const runLengthBits = runLength & 0b111111;
    return (paletteIndexBits << 6) | runLengthBits;
  }

  function addColorRleEntry(colorUint32: number, runLength: number) {
    rleImageData.push(createRawRleEntry(getPaletteColorIndex(colorUint32), runLength));
  }

  //console.log(`[rle] start ========`);

  // RLE encoding
  const maxRunLength = 63;
  let currentPixelIndex = 0;
  while (currentPixelIndex < imageDataArray.length) {
    const currentRunStartPixel = imageDataArray[currentPixelIndex];
    let currentRunLength = 0;

    while (true) {
      currentPixelIndex++;
      currentRunLength++;

      if (currentPixelIndex >= imageDataArray.length) {
        addColorRleEntry(currentRunStartPixel, currentRunLength);
        break;
      }

      const currentPixel = imageDataArray[currentPixelIndex];
      if (currentPixel !== currentRunStartPixel) {
        addColorRleEntry(currentRunStartPixel, currentRunLength);
        break;
      }

      if (currentRunLength >= maxRunLength) {
        addColorRleEntry(currentRunStartPixel, currentRunLength);
        break;
      }
    }
  }

  //console.log(`[rle] end ========`);

  const valid = rleImageData.length < MaxScreen.maxLogoUploadImageDataSize;


  // RGB to BGR
  const paletteUint8 = new Uint8Array(MaxScreen.logoColorCount * 3);
  for (let i = 0; i < paletteColorsCount; i++) {
    paletteUint8[i * 3 + 0] = palette[i].b;
    paletteUint8[i * 3 + 1] = palette[i].g;
    paletteUint8[i * 3 + 2] = palette[i].r;
  }

  return {
    valid: valid,
    paletteBuffer: paletteUint8,
    compressedImageDataBuffer: new Uint8Array(rleImageData)
  }
}

export function createMaxScreenLogoUploadBlocks(logoIndex: number, data: MaxScreenCompressedImageBuffers): Uint8Array[] {
  function chunk(array: Uint8Array, size: number): Uint8Array[] {
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.subarray(i, i + size));
    }
    return chunks;
  }

  const paletteDataLength = 12;
  const totalLength = paletteDataLength + data.compressedImageDataBuffer.length;

  const headerBlock = new Uint8Array([
    0xAA,
    0x50 + logoIndex,
    (totalLength >> 8) & 0xFF,
    totalLength & 0xFF
  ]);

  const dataBuffer = new Uint8Array(paletteDataLength + data.compressedImageDataBuffer.length);
  dataBuffer.set(data.paletteBuffer, 0);
  dataBuffer.set(data.compressedImageDataBuffer, paletteDataLength);

  const dataBlocks = chunk(dataBuffer, 128);

  return [headerBlock, ...dataBlocks];
}

