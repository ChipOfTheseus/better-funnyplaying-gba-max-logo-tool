import { Alert, Card, Container, Tab, Tabs } from "react-bootstrap";
import { IsWebSerialSupported } from "../utility/browserFeatureSupport.ts";
import LogoConverter from "./LogoConverter.tsx";
import { LogoUploader } from "./LogoUploader.tsx";
import { useState } from "react";
import type { MaxScreenCompatibleRawImageData } from "../utility/maxScreenImageUtility.ts";

function Main() {
  const [logoData, setLogoData] = useState<MaxScreenCompatibleRawImageData>();

  return <>
    <Container className="main-container py-3 px-3 px-lg-5">
      <Card className="main-card">
        <Card.Body className="d-flex flex-column">
          <h1 className="text-center fw-semibold mb-4">
            FunnyPlaying GBA MAX Display Logo Tool
          </h1>

          <Tabs
            defaultActiveKey={IsWebSerialSupported ? "uploader" : "converter"}
            className="mb-3"
            justify
          >
            <Tab eventKey="uploader" title="Uploader">
              {!IsWebSerialSupported && (
                <Alert variant="warning" className="mb-0">
                  Unfortunately, your browser doesn't support{" "}
                  <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API"
                     target="_blank">WebSerial</a>,
                  which is required for uploading logos to the screen.
                  Please use any of the Chrome-based browsers, such as Google Chrome, Microsoft Edge, Opera and
                  others.
                </Alert>
              )}

              {IsWebSerialSupported && <LogoUploader
                logoData={logoData!}
              />}
            </Tab>
            <Tab eventKey="converter" title="Converter">
              <LogoConverter sendLogoToUploader={(data) => setLogoData(data)} />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      <footer className="mt-3 text-center text-secondary-emphasis fs-6 fw-bold">
        © <a href="https://www.chipoftheseus.shop/linktree" target="_blank" className="text-secondary-emphasis">
        Chip of Theseus
      </a>, {new Date().getFullYear()}
      </footer>
    </Container>
  </>
}

export default Main;