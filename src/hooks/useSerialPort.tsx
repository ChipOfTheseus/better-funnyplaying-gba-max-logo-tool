import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

export enum SerialPortState {
  Closed,
  Closing,
  Open,
  Opening
}

export function useSerialPort(props: {
  dataReceivedCallback: (data: Uint8Array) => void;
}) {
  const [portState, setPortState] = useState(SerialPortState.Closed);
  const port = useRef<SerialPort | null>(null);
  const reader = useRef<ReadableStreamDefaultReader | null>(null);
  const abortRequested = useRef(false);
  const dataReceivedCallback = useRef<(data: Uint8Array) => void>(() => {
  });

  useEffect(() => {
    dataReceivedCallback.current = props.dataReceivedCallback ?? (() => {
    });
  }, [props.dataReceivedCallback])

  const markPortClosed = () => {
    port.current = null;
    reader.current = null;
    setPortState(SerialPortState.Closed);
  }

  const open = async (requestOptions: SerialPortRequestOptions, portOptions: SerialOptions) => {
    try {
      markPortClosed();
      abortRequested.current = false;

      setPortState(SerialPortState.Opening);

      const serialPort = await navigator.serial.requestPort(requestOptions);
      /*if (!(serialPort as any).connected) {
        toast.error("Unable to open port");
        return;
      }*/

      await serialPort.open(portOptions);
      port.current = serialPort;

      setPortState(SerialPortState.Open);

      const onSerialPortDisconnected = async () => {
        toast.warning("Port disconnected unexpectedly");
        markPortClosed();
      }

      port.current.addEventListener("disconnect", onSerialPortDisconnected);

      while (port.current.readable && !abortRequested.current) {
        reader.current = port.current.readable.getReader();
        try {
          while (true) {
            const {value, done} = await reader.current.read();
            if (done) {
              // |reader| has been canceled.
              break;
            }

            const valueUint8 = value as Uint8Array;

            dataReceivedCallback.current(valueUint8);
          }
        } catch (error: any) {
          console.error(error);
          toast.error(error.message);
        } finally {
          reader.current.releaseLock();
        }
      }

      await port.current.close();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    } finally {
      markPortClosed();
    }
  };

  const disconnect = async () => {
    if (portState !== SerialPortState.Open)
      return;

    setPortState(SerialPortState.Closing);
    abortRequested.current = true;
    reader.current?.cancel("user requested");
  }

  return {
    portState,
    port: port.current,
    open,
    disconnect
  }
}