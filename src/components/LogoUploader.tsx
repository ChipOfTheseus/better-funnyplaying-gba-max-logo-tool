import { Alert, Button, Col, Form, Row, Spinner } from "react-bootstrap";
import { useRef, useState } from "react";
import { MdOutlineUsb, MdOutlineUsbOff } from "react-icons/md";
import { SerialPortState, useSerialPort } from "../hooks/useSerialPort.tsx";
import hexarray from "hex-array";
import {
  createMaxScreenLogoUploadBlocks,
  type MaxScreenCompressedImageBuffers
} from "../utility/maxScreenImageUtility.ts";
import { toast } from "react-toastify";
import { AnimatePresence, motion } from "motion/react";
import { basicFadeInAnimationProps } from "../utility/basicFadeInAnimationVariants.ts";
import React from "react";
import { LuImageUp } from "react-icons/lu";

export function LogoUploader(props: {
  maxScreenLogoCompressedImageBuffers: MaxScreenCompressedImageBuffers | null,
}) {
  const {maxScreenLogoCompressedImageBuffers} = props;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [logoSlotIndex, setLogoSlotIndex] = useState(0);
  const serialReceiveBufferRef = useRef<number[]>([]);

  const serialPortDataReceived = (data: Uint8Array) => {
    serialReceiveBufferRef.current.push(...data);

    const hex = hexarray.toString(data, {grouping: 1, uppercase: true});
    console.log(`<< [${hex}]`);
  }

  const port = useSerialPort({
    dataReceivedCallback: serialPortDataReceived
  });

  const onConnectClicked = async () => {
    await port.open(
      {
        filters: [{
          usbVendorId: 0x1A86,
          usbProductId: 0x7523
        }]
      },
      {
        baudRate: 115200,
        bufferSize: 1024 * 1024 // Makes sure the packets aren't fragmented
      }
    );
  }

  const onDisconnectClicked = async () => {
    await port.disconnect();
  }

  const onSendCommand = async () => {
    const waitForAck = async (ackByteCount: number) => {
      const timeout = 2000;
      const startDate = Date.now();

      while (serialReceiveBufferRef.current.length < ackByteCount) {
        const timeDelta = Date.now() - startDate;
        if (timeDelta >= timeout) {
          throw new Error("Timed out waiting for ack, make sure screen is connected properly");
        }

        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const allAckBytesAreExpected = serialReceiveBufferRef.current.slice(ackByteCount).findIndex(x => x !== 0x55) === -1;
      if (!allAckBytesAreExpected) {
        throw new Error("Invalid ack received");
      }
    }

    setIsUploading(true);

    const writer = port.port!.writable.getWriter();
    try {
      const uploadBlocks = createMaxScreenLogoUploadBlocks(logoSlotIndex, maxScreenLogoCompressedImageBuffers!);

      setUploadProgress(0);
      const uploadStartTime = Date.now();
      for (let uploadBlockIndex = 0; uploadBlockIndex < uploadBlocks.length; uploadBlockIndex++) {
        const uploadBlock = uploadBlocks[uploadBlockIndex];
        console.log(`Uploading block ${uploadBlockIndex + 1} / ${uploadBlocks.length} (${uploadBlock.length} bytes)`);
        console.log(`>> [${hexarray.toString(uploadBlock, {grouping: 1, uppercase: true})}]`);

        serialReceiveBufferRef.current.length = 0;
        await writer.write(uploadBlock);

        let expectedAckBytesCount: number;
        switch (uploadBlockIndex) {
          case 0:
            expectedAckBytesCount = 1;
            break;
          case uploadBlocks.length - 1:
            // Last block has an extra byte to confirm upload completion
            expectedAckBytesCount = uploadBlock.length + 1;
            break;
          default:
            expectedAckBytesCount = uploadBlock.length;
            break;
        }

        await waitForAck(expectedAckBytesCount);

        setUploadProgress(uploadBlockIndex / (uploadBlocks.length - 1));
      }

      setUploadProgress(1);
      console.log(`Logo upload completed! Took ${Date.now() - uploadStartTime} ms`);
      toast.success(`Logo uploaded to slot ${logoSlotIndex + 1}!`, { position: "bottom-center" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    } finally {
      writer.releaseLock();
    }

    setIsUploading(false);
  }

  const hasValidLogo = maxScreenLogoCompressedImageBuffers?.valid === true;

  return <>
    <Row className="mt-4">
      <Col xs={12} sm="auto" className="align-content-center">
        <h2 className="mb-0">
          2. Connect to Screen
        </h2>
      </Col>
      <Col>
        {port.portState !== SerialPortState.Open && <>
            <Button
                disabled={port.portState !== SerialPortState.Closed}
                onClick={() => onConnectClicked()}
                className="connect-button"
            >
              {port.portState === SerialPortState.Closed && <><MdOutlineUsb/> Connect</>}
              {port.portState === SerialPortState.Opening && <><Spinner size="sm" className="me-2"/> Connecting...</>}
              {port.portState === SerialPortState.Closing && <><MdOutlineUsb/> Connect</>}
            </Button>
        </>}

        {port.portState === SerialPortState.Open && <>
            <Button
                disabled={isUploading}
                onClick={() => onDisconnectClicked()}
                className="connect-button"
            >
                <MdOutlineUsbOff/> Disconnect
            </Button>
        </>}
      </Col>
    </Row>

    <AnimatePresence>
      {port.portState === SerialPortState.Open && <>
          <motion.div
              className="d-flex flex-column"
              {...basicFadeInAnimationProps(0.2, false, false)}
          >
            <h2 className="mt-3">3. Upload Logo</h2>

            {!hasValidLogo && <>
                <Alert variant="warning" className="mb-0">Please choose a valid logo image first.</Alert>
            </>}

            {hasValidLogo && <>
                <Form.Label className="mt-0">Logo slot:</Form.Label>

                <div className="btn-group" role="group">
                  {[...Array(10)].map((_, logoSlotIndex) => (
                    <React.Fragment key={`logo-slot-radio-${logoSlotIndex}`}>
                      <input
                        type="radio"
                        className="btn-check"
                        id={`logoSlotIndexRadio-${logoSlotIndex}`}
                        name="logoSlotIndexRadio"
                        defaultChecked={logoSlotIndex === 0}
                        value={logoSlotIndex.toString()}
                        onChange={e => setLogoSlotIndex(parseInt(e.target.value))}
                      />

                      <Button
                        as="label"
                        htmlFor={`logoSlotIndexRadio-${logoSlotIndex}`}
                        variant="outline-primary"
                        className="logo-slot-button"
                      >
                        {logoSlotIndex + 1}
                      </Button>
                    </React.Fragment>
                  ))}
                </div>

                <Button
                    onClick={() => onSendCommand()}
                    disabled={isUploading}
                    className={`mt-3 big-button ${isUploading ? "progress-bar progress-bar-striped progress-bar-animated" : ""}`}
                >
                  {isUploading && <>
                      <Spinner size="sm" className="me-2"/> Uploading...
                  </>}
                  {!isUploading && <><LuImageUp/> Upload Logo</>}
                </Button>

                <AnimatePresence>
                  {isUploading && <>
                      <motion.div
                          className="text-center mt-3 fs-4 fw-bold"
                          {...basicFadeInAnimationProps(0.2, false, false)}
                      >
                        {uploadProgress.toLocaleString('en-US', {style: 'percent', maximumFractionDigits: 0})}
                      </motion.div>
                  </>}
                </AnimatePresence>
            </>}
          </motion.div>
      </>}
    </AnimatePresence>
  </>;
}