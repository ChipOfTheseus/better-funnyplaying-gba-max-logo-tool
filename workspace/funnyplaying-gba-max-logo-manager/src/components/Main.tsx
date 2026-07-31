import { Alert } from "react-bootstrap";
import { ConfiguratorLayout } from "@chipoftheseus/configurator-template/ConfiguratorLayout";
import { IsWebSerialSupported } from "../utility/browserFeatureSupport.ts";
import LogoConverter from "./LogoConverter.tsx";
import { LogoUploader } from "./LogoUploader.tsx";
import { useState } from "react";
import type {
  MaxScreenCompressedImageBuffers
} from "../utility/maxScreenImageUtility.ts";

function Main() {
  const [maxScreenLogoCompressedImageBuffers, setMaxScreenLogoCompressedImageBuffers] = useState<MaxScreenCompressedImageBuffers | null>(null);

  return <ConfiguratorLayout title="Better FunnyPlaying GBA IPS MAX Screen Logo Tool" footer={<>
    <span>
      This page is a single file and runs completely locally. You can save it as an
      <span className="font-monospace">.html</span> file and use it offline.
    </span>
    <a href="https://github.com/ChipOfTheseus/better-funnyplaying-gba-max-logo-tool"
       target="_blank"
       className="text-secondary-emphasis">
      GitHub Repo
    </a>
    <span className="fw-bold">
      © <a href="https://www.chipoftheseus.shop/linktree"
           target="_blank"
           className="text-secondary-emphasis">Chip of Theseus</a>,
      {new Date().getFullYear()}
    </span>
  </>}>

    <h2>1. Choose Logo Image</h2>
    <LogoConverter
      maxScreenLogoCompressedImageBuffers={maxScreenLogoCompressedImageBuffers}
      setMaxScreenLogoCompressedImageBuffers={setMaxScreenLogoCompressedImageBuffers}
    />

    {!IsWebSerialSupported && <Alert variant="warning" className="mt-4 mb-0">
        This browser does not support <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API"
                                         target="_blank">WebSerial</a>.
        Use a Chromium-based browser to upload logos.
    </Alert>}

    {IsWebSerialSupported &&
        <LogoUploader
            maxScreenLogoCompressedImageBuffers={maxScreenLogoCompressedImageBuffers?.valid ? maxScreenLogoCompressedImageBuffers : null}/>
    }
  </ConfiguratorLayout>
}

export default Main;
