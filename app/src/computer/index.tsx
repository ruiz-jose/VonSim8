// Mantener los imports de React y librerías externas al principio
import { useEffect, useRef } from "react";
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

import { ZoomControls } from "@/components/ZoomControls";
import { RegisterTransferMessages } from "@/computer/cpu/RegisterTransferMessages";
import { hideControlBusTextsOnInit } from "@/computer/shared/animate";

import { SystemBus } from "./bus/SystemBus";
import { Clock } from "./clock/Clock";
import { CPU } from "./cpu/CPU";
import { CPUStats } from "./cpu/CPUStats";
import { F10 } from "./f10/F10";
import { Handshake } from "./handshake/Handshake";
import { Keyboard } from "./keyboard/Keyboard";
import { Leds } from "./leds/Leds";
import { Memory } from "./memory/Memory";
import { PIC } from "./pic/PIC";
import { PIO } from "./pio/PIO";
import { Printer } from "./printer/Printer";
import { Screen } from "./screen/Screen";
import { Switches } from "./switches/Switches";
import { Timer } from "./timer/Timer";

// Notes about Z index:
// - The SystemBus should have a z-index of 5.
// - Components (CPU, Memory, etc) should have a z-index of 10.
// - Control lines that exit a component should have a z-index of 15.
// - Registers/subcomponents should have a z-index of 20.
export function ComputerContainer() {
  const wrapperRef = useRef<ReactZoomPanPinchRef>(null);

  // Ocultar textos de bus de control al iniciar
  useEffect(() => {
    hideControlBusTextsOnInit();
  }, []);

  return (
    <div className="relative size-full">
      <TransformWrapper
        minScale={0.3}
        initialScale={0.75}
        ref={wrapperRef}
        doubleClick={{ disabled: true }}
        panning={{ excluded: ["input"] }}
      >
        <TransformComponent wrapperClass="!w-full !h-full" contentClass="!p-[200px]">
          <div className="relative h-[1300px] w-[1900px]">
            <SystemBus />

            {/* CPUStats posicionado arriba a la izquierda del CPU (ubicación original) */}
            <div className="absolute left-[120px] top-[-120px] z-20">
              <CPUStats />
            </div>

            <CPU />
            <RegisterTransferMessages />
            <Memory />

            <Handshake />
            <PIC />
            <PIO />
            <Timer />

            <Clock />
            <F10 />
            <Keyboard />
            <Leds />
            <Printer />
            <Switches />
            <Screen />
          </div>
        </TransformComponent>
        <ZoomControls wrapperRef={wrapperRef} />
      </TransformWrapper>
    </div>
  );
}
