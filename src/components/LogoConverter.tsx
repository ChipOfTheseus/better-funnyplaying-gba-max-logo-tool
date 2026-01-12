import { type ChangeEvent, useRef, useState } from "react";
import { type ImageQuantization } from "image-q";
import MaxScreen from "../data/MaxScreen.ts";
import useAsyncEffect from "use-async-effect";
import { Alert, Button, Col, Form, Row } from "react-bootstrap";
import saveImageDataAsIndexedPNG from "../utility/saveImageDataAsIndexedPNG.ts";
import { MdSave } from "react-icons/md";
import { ImDownload } from "react-icons/im";
import { IsWebSerialSupported } from "../utility/browserFeatureSupport.ts";
import { toast } from "react-toastify";
import {
  createMaxScreenCompatibleRawImageData, createMaxScreenCompressedImageBuffers, createMaxScreenLogoUploadBlocks,
  type MaxScreenCompatibleRawImageData, type MaxScreenCompressedImageBuffers
} from "../utility/maxScreenImageUtility.ts";
import { AnimatePresence, motion } from "motion/react"
import { basicFadeInAnimationProps } from "../utility/basicFadeInAnimationVariants.ts";
import { useDebouncedCallback } from "use-debounce";
import hexarray from "hex-array";

const ImageQuantizationTypes = [
  {type: "nearest", name: "None"},
  {type: "floyd-steinberg", name: "Floyd-Steinberg"},
  {type: "false-floyd-steinberg", name: "False Floyd-Steinberg"},
  {type: "stucki", name: "Stucki"},
  {type: "atkinson", name: "Atkinson"},
  {type: "jarvis", name: "Jarvis"},
  {type: "burkes", name: "Burkes"},
  {type: "sierra", name: "Sierra"},
  {type: "two-sierra", name: "Two-row Sierra"},
  {type: "riemersma", name: "Riemersma"},
  {type: "sierra-lite", name: "Sierra Lite"},
];

function LogoConverter(props: {
  sendLogoToUploader: (data: MaxScreenCompatibleRawImageData) => void;
}) {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageErrorText, setImageErrorText] = useState<string | null>("");
  const [imageCanvas, setImageCanvas] = useState<OffscreenCanvas | null>(null);
  const [imageHasNonOpaquePixels, setImageHasNonOpaquePixels] = useState(false);
  const [maxScreenLogoImageData, setMaxScreenLogoImageData] = useState<MaxScreenCompatibleRawImageData | null>(null);
  const [maxScreenLogoCompressedImageBuffers, setMaxScreenLogoCompressedImageBuffers] = useState<MaxScreenCompressedImageBuffers | null>(null);

  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1);
  const [maxColorCount, setMaxColorCount] = useState(4);
  const [imageQuantizationType, setImageQuantizationType] = useState<ImageQuantization>("nearest");
  const [useColorization, setUseColorization] = useState(false);
  const [colorizationColor, setColorizationColor] = useState("#ff0000");

  const isCompressedImageValid = maxScreenLogoCompressedImageBuffers !== null && maxScreenLogoCompressedImageBuffers.valid;

  const onImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setImageFile(null);
    setImageErrorText(null);
    setImageCanvas(null);

    if (!event.target.files || !event.target.files[0])
      return;

    try {
      const image = new Image();
      image.src = URL.createObjectURL(event.target.files[0]);
      await image.decode();
      if (image.naturalWidth !== MaxScreen.logoWidth || image.naturalHeight !== MaxScreen.logoHeight) {
        setImageErrorText(
          `Logo image must be of ${MaxScreen.logoWidth}x${MaxScreen.logoHeight} resolution, 
        got ${image.naturalWidth}x${image.naturalHeight} instead.`
        );
        return;
      }
      const canvas = new OffscreenCanvas(MaxScreen.logoWidth, MaxScreen.logoHeight);
      const context = canvas.getContext("2d", {willReadFrequently: true})!;
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      let foundNonOpaquePixels = false;
      for (let i = 0; i < imageData.data.length; i += 4) {
        if (imageData.data[i + 3] !== 255) {
          foundNonOpaquePixels = true;
          break;
        }
      }

      setImageFile(event.target.files[0]);
      setImageCanvas(canvas);
      setImageHasNonOpaquePixels(foundNonOpaquePixels);
    } catch (err: any) {
      console.log(err);
      toast.error(err.message);
    }
  }

  const onResetImageAdjustments = () => {
    setBackgroundColor("#000000");
    setContrast(1);
    setBrightness(0);
    setMaxColorCount(4);
    setImageQuantizationType("nearest");
    setUseColorization(false);
    setColorizationColor("#ff0000");
  }

  const onSaveConvertedImageAsPng = async () => {
    /*const maxScreenLogoUploadBlocks = createMaxScreenLogoUploadBlocks(1, maxScreenLogoCompressedImageBuffers!);
    let buffer : number[] = [];
    for (const block of maxScreenLogoUploadBlocks) {
      buffer = [...buffer, ...block];
    }

    const pngBlob = new Blob([new Uint8Array(buffer).buffer], {type: 'image/png'});
    const pngDataUrl = URL.createObjectURL(pngBlob);

    const a = document.createElement('a');
    a.href = pngDataUrl;
    a.download = "testdump.bin";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(pngDataUrl);

    return;*/
    await saveImageDataAsIndexedPNG(
      maxScreenLogoImageData!.imageData,
      maxScreenLogoImageData!.palette.length,
      imageFile?.name!.replace(/\.[^/.]+$/, "") + "-converted.png"
    )
  };

  const updateImageData = useDebouncedCallback(() => {
    if (imageCanvas === null || previewCanvasRef.current === null)
      return;

    const compatibleRawImageData = createMaxScreenCompatibleRawImageData(
      imageCanvas,
      backgroundColor,
      brightness,
      contrast,
      maxColorCount,
      useColorization ? colorizationColor : null,
      imageQuantizationType
    );

    setMaxScreenLogoImageData(compatibleRawImageData);

    const compressedImageBuffers = createMaxScreenCompressedImageBuffers(compatibleRawImageData.palette, compatibleRawImageData.imageData);
    setMaxScreenLogoCompressedImageBuffers(compressedImageBuffers);

    const previewContext = previewCanvasRef.current.getContext('2d', {willReadFrequently: true})!;
    previewContext.putImageData(compatibleRawImageData.imageData, 0, 0);

    let fff = createMaxScreenLogoUploadBlocks(1, compressedImageBuffers);
    console.log(fff);
    console.log(hexarray.toString(fff[1], { grouping: 1, uppercase: true }));
  }, 250, {
    maxWait: 250,
    leading: true
  });

  useAsyncEffect(() => {
    setMaxScreenLogoImageData(null);
    setMaxScreenLogoCompressedImageBuffers(null);

    updateImageData();
  }, [backgroundColor, brightness, contrast, maxColorCount, useColorization, colorizationColor, imageQuantizationType, imageCanvas]);

  return <>
    <Form.Group controlId="formFile" className="">
      <Form.Label>Image file (960x80 pixels):</Form.Label>
      <Form.Control type="file" accept="image/*" onChange={onImageChange}/>
    </Form.Group>

    {imageErrorText && <Alert variant="danger mt-3 mb-0">{imageErrorText}</Alert>}

    {imageCanvas !== null && <>
        <canvas
            ref={previewCanvasRef}
            width={MaxScreen.logoWidth}
            height={MaxScreen.logoHeight}
            className="d-block mx-auto my-4 max-logo-image"
        />

        <Row className="justify-content-center g-4">
          {imageHasNonOpaquePixels && (
            <Form.Group as={Col} md={6} lg={3}>
              <Form.Label>Background color:</Form.Label>
              <Form.Control
                type="color"
                className="w-100"
                value={backgroundColor}
                onChange={e => setBackgroundColor(e.currentTarget.value)}
              />
            </Form.Group>
          )}

            <Form.Group as={Col} md={6} lg={2}>
                <Form.Label>Brightness: {brightness}</Form.Label>
                <Form.Range
                    min={-200}
                    max={200}
                    step={1}
                    value={brightness}
                    onChange={e => setBrightness(Number(e.currentTarget.value))}
                />
            </Form.Group>

            <Form.Group as={Col} md={6} lg={2}>
                <Form.Label>Contrast: {contrast}</Form.Label>
                <Form.Range
                    min={0.1}
                    max={2}
                    step={0.05}
                    value={contrast}
                    onChange={e => setContrast(Number(e.currentTarget.value))}
                />
            </Form.Group>

            <Form.Group as={Col} md={6} lg={2}>
                <Form.Label>Max colors: {maxColorCount}</Form.Label>
                <Form.Range
                    min={2}
                    max={4}
                    step={1}
                    value={maxColorCount}
                    onChange={e => setMaxColorCount(Number(e.currentTarget.value))}
                />
            </Form.Group>

            <Form.Group as={Col} md={6} lg={2}>
                <Form.Label>Dithering:</Form.Label>
                <Form.Select
                    value={imageQuantizationType}
                    onChange={e => setImageQuantizationType(e.target.value as ImageQuantization)}
                >
                  {ImageQuantizationTypes.map(type => (
                    <option
                      key={`image-quantization-${type.type}`}
                      value={type.type}
                    >{type.name}</option>
                  ))}
                </Form.Select>
            </Form.Group>

            <Form.Group as={Col} md={6} lg={3}>
                <Form.Label>
                    <Form.Check
                        type="checkbox"
                        id="use-colorization"
                        label="Apply color tint"
                        checked={useColorization}
                        onChange={e => setUseColorization(e.target.checked)}
                    />
                </Form.Label>

                <Form.Control
                    type="color"
                    className="w-100"
                    disabled={!useColorization}
                    value={colorizationColor}
                    onChange={e => setColorizationColor(e.currentTarget.value)}
                />
            </Form.Group>

            <Col xs={12} lg={1} className="d-flex py-2 justify-content-center">
                <Button onClick={onResetImageAdjustments} className="px-3">
                    Reset
                </Button>
            </Col>
        </Row>

        <AnimatePresence>
          {maxScreenLogoCompressedImageBuffers !== null && !isCompressedImageValid && <>
              <motion.div {...basicFadeInAnimationProps(0.5, false, false)}>
                  <Alert variant="danger" className="mt-3 mb-0">
                      <p>
                          Compressed logo image size:{" "}
                          <span className="fw-bold">
                          {maxScreenLogoCompressedImageBuffers!.compressedImageDataBuffer.length} / {MaxScreen.maxLogoUploadImageDataSize} bytes
                          </span>{" "}
                          ({(maxScreenLogoCompressedImageBuffers!.compressedImageDataBuffer.length / MaxScreen.maxLogoUploadImageDataSize - 1.0)
                        .toLocaleString('en-US', {style: 'percent', maximumFractionDigits: 2})} overboard).
                      </p>

                      <p>
                          The compressed image exceeds the size limit. Things you can try to get it under the limit:
                      </p>

                      <ul className="mb-0">
                          <li> Increasing brightness slightly.</li>
                          <li> Decreasing contrast slightly.</li>
                          <li> Setting dithering type to None.</li>
                          <li> Reducing max colors count.</li>
                      </ul>
                  </Alert>
              </motion.div>
          </>}
        </AnimatePresence>

        <div className="d-flex flex-row justify-content-center gap-4 pt-3">
            <Button
                disabled={!isCompressedImageValid}
                onClick={() => onSaveConvertedImageAsPng()}
                className="big-button mx-0"
            >
                <MdSave/> Save as PNG
            </Button>

          {IsWebSerialSupported && (
            <Button
              disabled={!isCompressedImageValid}
              onClick={() => props.sendLogoToUploader(maxScreenLogoImageData!)}
              className="big-button mx-0"
            >
              <ImDownload/> Upload to screen
            </Button>
          )}
        </div>
    </>}
  </>
}

export default LogoConverter