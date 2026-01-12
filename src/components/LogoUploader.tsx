import { Button, Form, Spinner } from "react-bootstrap";
import { useRef, useState } from "react";
import { MdOutlineUsb } from "react-icons/md";
import { SerialPortState, useSerialPort } from "../hooks/useSerialPort.tsx";
import hexarray from "hex-array";
import {
  createMaxScreenCompressedImageBuffers,
  createMaxScreenLogoUploadBlocks,
  type MaxScreenCompatibleRawImageData
} from "../utility/maxScreenImageUtility.ts";

export function LogoUploader(props: {
  logoData: MaxScreenCompatibleRawImageData
}) {
  const receiveBufferRef = useRef<number[]>([]);

  const [command, setCommand] = useState("AT+VER");
  const [serialLog, setSerialLog] = useState("");

  const serialPortDataReceived = (data: Uint8Array) => {
    receiveBufferRef.current.push(...data);

    const hex = hexarray.toString(data, {grouping: 1, uppercase: true});
    console.log(`<< [${hex}]`);
    setSerialLog((log) => log + "\r\n" + hex);
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
        bufferSize: 1024 * 1024 //!!!!
      }
    );
  }

  const onDisconnectClicked = async () => {
    await port.disconnect();
  }

  const onSendCommand = async () => {
    const imageBuffers = createMaxScreenCompressedImageBuffers(props.logoData.palette, props.logoData.imageData);
    const uploadBlocks = createMaxScreenLogoUploadBlocks(1, imageBuffers);

    const waitForAck = async (ackByteCount: number) => {
      while (receiveBufferRef.current.length < ackByteCount) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const allAckBytesAreExpected = receiveBufferRef.current.slice(ackByteCount).findIndex(x => x !== 0x55) === -1;
      if (!allAckBytesAreExpected) {
        throw new Error("Invalid ack received");
      }
    }

    const writer = port.port!.writable.getWriter();

    for (let uploadBlockIndex = 0; uploadBlockIndex < uploadBlocks.length; uploadBlockIndex++) {
      const uploadBlock = uploadBlocks[uploadBlockIndex];
      console.log(`Uploading block ${uploadBlockIndex + 1} / ${uploadBlocks.length} (${uploadBlock.length} bytes)`);
      console.log(`>> [${hexarray.toString(uploadBlock, {grouping: 1, uppercase: true})}]`);

      receiveBufferRef.current.length = 0;
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
    }

    console.log("Logo upload completed!")
    writer.releaseLock();
  }

  return <>
    {port.portState !== SerialPortState.Open && <>
        <Button
            disabled={port.portState !== SerialPortState.Closed}
            onClick={() => onConnectClicked()}
            className="big-button mt-3"
        >
          {port.portState === SerialPortState.Closed && <><MdOutlineUsb/> Connect</>}
          {port.portState === SerialPortState.Opening && <><Spinner size={"sm"}/> Connecting...</>}
          {port.portState === SerialPortState.Closing && <><Spinner size={"sm"}/> Disconnecting...</>}
        </Button>
    </>}

    {port.portState === SerialPortState.Open && <>
        <Button
            onClick={() => onDisconnectClicked()}
            className="big-button mt-3"
        >
            Disconnect
        </Button>

        <Form.Group className="mb-3">
            <Form.Label>Command</Form.Label>
            <Form.Control type="text" placeholder="command..." value={command}
                          onChange={e => setCommand(e.target.value)}/>
        </Form.Group>

        <Button onClick={() => onSendCommand()}>Send command</Button>

        <Form.Group className="mb-3">
            <Form.Label>Log</Form.Label>
            <Form.Control as="textarea" placeholder="log..." rows={10} readOnly value={serialLog}/>
        </Form.Group>
    </>}
  </>;
}