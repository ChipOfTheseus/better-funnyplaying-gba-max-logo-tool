import UPNG from "@pdf-lib/upng";

async function saveImageDataAsIndexedPNG(imageData: ImageData, colorCount: number, fileName: string) {
  //const workCanvas = new OffscreenCanvas(imageData.width, imageData.height);
  //const workContext = workCanvas.getContext("2d")!;
  //workContext.putImageData(imageData, 0, 0);

  const pngBuffer: ArrayBuffer = UPNG.encode([imageData.data.buffer], imageData.width, imageData.height, colorCount);
  const pngBlob = new Blob([pngBuffer], {type: 'image/png'});
  const pngDataUrl = URL.createObjectURL(pngBlob);

  const a = document.createElement('a');
  a.href = pngDataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(pngDataUrl);
}

export default saveImageDataAsIndexedPNG;