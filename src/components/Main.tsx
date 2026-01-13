import { Alert, Card, Container } from "react-bootstrap";
import { IsWebSerialSupported } from "../utility/browserFeatureSupport.ts";
import LogoConverter from "./LogoConverter.tsx";
import { LogoUploader } from "./LogoUploader.tsx";
import { useState } from "react";
import type {
  MaxScreenCompressedImageBuffers
} from "../utility/maxScreenImageUtility.ts";

function Main() {
  const [maxScreenLogoCompressedImageBuffers, setMaxScreenLogoCompressedImageBuffers] = useState<MaxScreenCompressedImageBuffers | null>(null);

  return <>
    <Container className="main-container py-3 px-3 px-lg-5">
      <Card className="main-card">
        <Card.Body className="d-flex flex-column">
          <h1 className="text-center fw-semibold mb-4">
            Better FunnyPlaying GBA MAX Screen Logo Tool
          </h1>

          <h2>1. Choose Logo Image</h2>
          <LogoConverter
            maxScreenLogoCompressedImageBuffers={maxScreenLogoCompressedImageBuffers}
            setMaxScreenLogoCompressedImageBuffers={setMaxScreenLogoCompressedImageBuffers}
          />

          {!IsWebSerialSupported && <>
              <h2 className="mt-4">
                  2. Connect to Screen
              </h2>

              <Alert variant="warning" className="mb-0">
                  Unfortunately, your browser doesn't support{" "}
                  <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API"
                     target="_blank">WebSerial</a>,
                  which is required for uploading logos to the screen.
                  Please use any of the Chrome-based browsers, such as Google Chrome, Microsoft Edge, Opera and
                  others.
              </Alert>
          </>}

          {IsWebSerialSupported && (
            <LogoUploader
              maxScreenLogoCompressedImageBuffers={maxScreenLogoCompressedImageBuffers?.valid ? maxScreenLogoCompressedImageBuffers : null}
            />
          )}
        </Card.Body>
      </Card>

      <footer className="d-flex flex-column gap-1 mt-3 text-center text-secondary-emphasis fs-6">
        <span>
          This page is a single file and runs completely locally.
          You can use 'Save As' to save it as an <span className="font-monospace">.html</span> file and use it offline.
        </span>

        <a href="https://github.com/ChipOfTheseus/better-funnyplaying-gba-max-logo-tool" target="_blank" className="text-secondary-emphasis">
          GitHub Repo
        </a>

        <span className="fw-bold">
          © <a href="https://www.chipoftheseus.shop/linktree" target="_blank" className="text-secondary-emphasis">
          Chip of Theseus
          </a>, {new Date().getFullYear()}
        </span>
      </footer>
    </Container>
  </>
}

export default Main;