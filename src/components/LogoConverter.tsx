import { type ChangeEvent, type Dispatch, type SetStateAction, useRef, useState } from "react";
import { type ImageQuantization } from "image-q";
import MaxScreen from "../data/MaxScreen.ts";
import useAsyncEffect from "use-async-effect";
import { Alert, Button, Col, Form, Row } from "react-bootstrap";
import saveImageDataAsIndexedPNG from "../utility/saveImageDataAsIndexedPNG.ts";
import { MdSave } from "react-icons/md";
import { toast } from "react-toastify";
import {
  createMaxScreenCompatibleRawImageData,
  createMaxScreenCompressedImageBuffers,
  type MaxScreenCompatibleRawImageData,
  type MaxScreenCompressedImageBuffers
} from "../utility/maxScreenImageUtility.ts";
import { AnimatePresence, motion } from "motion/react"
import { basicFadeInAnimationProps } from "../utility/basicFadeInAnimationVariants.ts";
import { useDebouncedCallback } from "use-debounce";
import { type PremadeLogoData } from "../data/PremadeLogos.ts";
import { PremadeLogosGalleryModal } from "./PremadeLogosGalleryModal.tsx";

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

enum SourceImageSourceType {
  File,
  Gallery,
}

function LogoConverter(props: {
  maxScreenLogoCompressedImageBuffers: MaxScreenCompressedImageBuffers | null,
  setMaxScreenLogoCompressedImageBuffers: Dispatch<SetStateAction<MaxScreenCompressedImageBuffers | null>>
}) {
  const {maxScreenLogoCompressedImageBuffers, setMaxScreenLogoCompressedImageBuffers} = props;
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [sourceImageSource, setSourceImageSource] = useState(SourceImageSourceType.File);
  const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
  const [sourceImageGallery, setSourceImageGallery] = useState<PremadeLogoData | null>(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  const [sourceImageFileName, setSourceImageFileName] = useState<string | null>(null);
  const [sourceImageErrorText, setSourceImageErrorText] = useState<string | null>("");
  const [sourceImageCanvas, setSourceImageCanvas] = useState<OffscreenCanvas | null>(null);
  const [sourceImageHasNonOpaquePixels, setSourceImageHasNonOpaquePixels] = useState(false);

  const [maxScreenLogoImageData, setMaxScreenLogoImageData] = useState<MaxScreenCompatibleRawImageData | null>(null);

  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1);
  const [maxColorCount, setMaxColorCount] = useState(4);
  const [imageQuantizationType, setImageQuantizationType] = useState<ImageQuantization>("nearest");
  const [useColorization, setUseColorization] = useState(false);
  const [colorizationColor, setColorizationColor] = useState("#ff0000");

  const isCompressedImageValid = maxScreenLogoCompressedImageBuffers !== null && maxScreenLogoCompressedImageBuffers.valid;

  const resetImageAdjustments = (premadeLogo: PremadeLogoData | null) => {
    setBackgroundColor("#000000");
    setContrast(1);
    setBrightness(0);
    setMaxColorCount(4);
    setImageQuantizationType("nearest");
    setUseColorization(false);
    //setColorizationColor("#ff0000");

    if (premadeLogo !== null) {
      if (premadeLogo.backgroundColor !== undefined) {
        setBackgroundColor(premadeLogo.backgroundColor);
      }

      if (premadeLogo.colorTint !== undefined) {
        setUseColorization(true);
        setColorizationColor(premadeLogo.colorTint);
      }

      if (premadeLogo.brightness !== undefined) {
        setBrightness(premadeLogo.brightness);
      }

      if (premadeLogo.contrast !== undefined) {
        setContrast(premadeLogo.contrast);
      }

      if (premadeLogo.maxColors !== undefined) {
        setMaxColorCount(premadeLogo.maxColors);
      }
    }
  }

  const updateInputImageData = (imageData: ImageData) => {
    let foundNonOpaquePixels = false;
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i + 3] !== 255) {
        foundNonOpaquePixels = true;
        break;
      }
    }

    const canvas = new OffscreenCanvas(MaxScreen.logoWidth, MaxScreen.logoHeight);
    const context = canvas.getContext("2d", {willReadFrequently: true})!;
    context.putImageData(imageData, 0, 0);

    setSourceImageCanvas(canvas);
    setSourceImageHasNonOpaquePixels(foundNonOpaquePixels);
  }

  const loadImageFromSrc = async (imageSrc: string, imageFileName: string) => {
    try {
      const image = new Image();
      image.src = imageSrc;
      await image.decode();
      if (image.naturalWidth !== MaxScreen.logoWidth || image.naturalHeight !== MaxScreen.logoHeight) {
        setSourceImageCanvas(null);
        setSourceImageFile(null);

        setSourceImageErrorText(
          `Logo image must be of ${MaxScreen.logoWidth}x${MaxScreen.logoHeight} resolution, 
        got ${image.naturalWidth}x${image.naturalHeight} instead.`
        );
        return;
      }
      const canvas = new OffscreenCanvas(MaxScreen.logoWidth, MaxScreen.logoHeight);
      const context = canvas.getContext("2d", {willReadFrequently: true})!;
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      setSourceImageFileName(imageFileName);
      updateInputImageData(imageData);
    } catch (err: any) {
      setSourceImageCanvas(null);
      setSourceImageFile(null);

      console.log(err);
      toast.error(err.message);
    }
  }

  const loadImageFromFile = async (file: File | null | undefined) => {
    setSourceImageErrorText(null);
    if (!file) {
      setSourceImageCanvas(null);
      setSourceImageFile(null);
      return;
    }

    const imageSrc = URL.createObjectURL(file);
    await loadImageFromSrc(imageSrc, file.name);
    setSourceImageFile(file);

    resetImageAdjustments(null);
  }

  const loadImageFromGallery = async (logo: PremadeLogoData | null) => {
    setSourceImageErrorText(null);
    if (!logo) {
      setSourceImageCanvas(null);
      setSourceImageGallery(null);
      return;
    }

    await loadImageFromSrc(logo.file, logo.name);
    setSourceImageGallery(logo);

    resetImageAdjustments(logo);
  }

  const onResetImageAdjustmentsClick = () => {
    resetImageAdjustments(
      sourceImageSource === SourceImageSourceType.Gallery && sourceImageGallery !== null ?
        sourceImageGallery :
        null
    );
  }

  const onImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await loadImageFromFile(event.target.files?.[0]);
  }

  const setSourceImageFromGallery = async (logo: PremadeLogoData) => {
    if (sourceImageGallery === logo) {
      return;
    }

    await loadImageFromGallery(logo);
  }

  const onSaveConvertedImageAsPng = async () => {
    await saveImageDataAsIndexedPNG(
      maxScreenLogoImageData!.imageData,
      maxScreenLogoImageData!.palette.length,
      sourceImageFileName!.replace(/\.[^/.]+$/, "") + "-converted.png"
    )
  };

  const onSelectFromGalleryClicked = () => {
    setShowGalleryModal(true);
  }

  const updateConvertedImageData = useDebouncedCallback(() => {
    if (sourceImageCanvas === null || previewCanvasRef.current === null)
      return;

    const compatibleRawImageData = createMaxScreenCompatibleRawImageData(
      sourceImageCanvas,
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
    console.log("compressedImageBuffers.compressedImageDataBuffer.length", compressedImageBuffers.compressedImageDataBuffer.length)

    const previewContext = previewCanvasRef.current.getContext('2d', {willReadFrequently: true})!;
    previewContext.putImageData(compatibleRawImageData.imageData, 0, 0);
  }, 250, {
    maxWait: 250,
    leading: true
  });

  useAsyncEffect(async () => {
    if (sourceImageSource === SourceImageSourceType.File) {
      await loadImageFromFile(sourceImageFile);
    } else {
      await loadImageFromGallery(sourceImageGallery);
    }
  }, [sourceImageSource])

  useAsyncEffect(() => {
    setMaxScreenLogoImageData(null);

    updateConvertedImageData();
  }, [backgroundColor, brightness, contrast, maxColorCount, useColorization, colorizationColor, imageQuantizationType, sourceImageCanvas]);

  return <>
    <div className="d-flex flex-column gap-3">
      <Row className="align-items-center">
        <Col xs={16} sm={4}>
          <Form.Check
            type="radio"
            id="sourceImageSourceFile"
            name="sourceImageSource"
            label={<>Image file ({MaxScreen.logoWidth}x{MaxScreen.logoHeight} pixels)</>}
            defaultChecked
            value={SourceImageSourceType.File}
            onChange={e => setSourceImageSource(parseInt(e.target.value))}
          />
        </Col>

        <Col>
          <Form.Control
            disabled={sourceImageSource !== SourceImageSourceType.File}
            type="file"
            accept="image/*"
            onChange={onImageFileChange}
          />
        </Col>
      </Row>

      <Row className="align-items-center">
        <Col xs={16} sm={4}>
          <Form.Check
            type="radio"
            id="sourceImageSourceGallery"
            name="sourceImageSource"
            label={<>Select from premade logos</>}
            value={SourceImageSourceType.Gallery}
            onChange={e => setSourceImageSource(parseInt(e.target.value))}
          />
        </Col>

        <Col>
          <Button
            onClick={() => onSelectFromGalleryClicked()}
            disabled={sourceImageSource !== SourceImageSourceType.Gallery}
            className="px-5"
          >
            Gallery...
          </Button>
        </Col>
      </Row>
    </div>

    {sourceImageErrorText && <Alert variant="danger mt-3 mb-0">{sourceImageErrorText}</Alert>}

    <AnimatePresence>
      {sourceImageCanvas !== null && <>
          <motion.div {...basicFadeInAnimationProps(0.25, false, false)}>
              <canvas
                  ref={previewCanvasRef}
                  width={MaxScreen.logoWidth}
                  height={MaxScreen.logoHeight}
                  className="d-block mx-auto my-4 max-logo-image"
              />

              <Row className="justify-content-center g-4">
                {sourceImageHasNonOpaquePixels && (
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

                  <Col xs={12} lg={1} className="d-flex py-2 justify-content-center">
                      <Button onClick={onResetImageAdjustmentsClick} className="px-3">
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
                                The compressed image exceeds the size limit. This generally means the image is too
                                complex.
                                Things you can try to get it under the limit:
                            </p>

                            <ul className="mb-0">
                                <li>Increasing brightness slightly.</li>
                                <li>Decreasing contrast slightly.</li>
                                <li>Setting dithering type to None.</li>
                                <li>Reducing max colors count.</li>
                                <li>Adjusting the source image to reduce the amount of fine detail.</li>
                            </ul>
                        </Alert>
                    </motion.div>
                </>}
              </AnimatePresence>

              <div className="d-flex flex-row justify-content-center gap-4 pt-3">
                  <Button
                      disabled={!isCompressedImageValid}
                      onClick={() => onSaveConvertedImageAsPng()}
                      className="medium-button mx-0"
                  >
                      <MdSave/> Save as PNG
                  </Button>
              </div>
          </motion.div>
      </>}
    </AnimatePresence>

    <PremadeLogosGalleryModal
      show={showGalleryModal}
      setShow={setShowGalleryModal}
      setLogo={logo => setSourceImageFromGallery(logo)}
    />
  </>
}

export default LogoConverter