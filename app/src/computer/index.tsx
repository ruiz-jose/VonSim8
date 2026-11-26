// Mantener los imports de React y librerías externas al principio
import { useCallback, useEffect, useRef } from "react";
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

import { ZoomControls } from "@/components/ZoomControls";
import { RegisterTransferMessages } from "@/computer/cpu/RegisterTransferMessages";
import {
  hideALULeftTextOnInit,
  hideALUResultTextOnInit,
  hideALURightTextOnInit,
  hideControlBusTextsOnInit,
} from "@/computer/shared/animate";

import { SystemBus } from "./bus/SystemBus";
import { Clock } from "./clock/Clock";
import { CPU } from "./cpu/CPU";
import { CPUStats } from "./cpu/CPUStats";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // Mientras el usuario no haga zoom o desplace la vista a mano, la
  // computadora se encuadra sola para que se vean todos los componentes.
  const userAdjustedRef = useRef(false);
  const markUserAdjusted = useCallback(() => {
    userAdjustedRef.current = true;
  }, []);

  const fitToView = useCallback((animationTime = 300) => {
    const api = wrapperRef.current;
    const container = containerRef.current;
    const content = contentRef.current;
    if (!api || !container || !content) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return; // Panel oculto (p. ej. pestaña inactiva en móvil)

    // Caja que envuelve a los componentes visibles (CPU, memoria, dispositivos)
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const el of Array.from(content.children)) {
      if (!(el instanceof HTMLDivElement)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      minX = Math.min(minX, rect.left);
      minY = Math.min(minY, rect.top);
      maxX = Math.max(maxX, rect.right);
      maxY = Math.max(maxY, rect.bottom);
    }
    if (!Number.isFinite(minX)) return;

    const { scale, positionX, positionY } = api.instance.transformState;
    const origin = container.getBoundingClientRect();
    const localX = (minX - origin.left - positionX) / scale;
    const localY = (minY - origin.top - positionY) / scale;
    const boxWidth = (maxX - minX) / scale;
    const boxHeight = (maxY - minY) / scale;

    // Margen extra a la derecha para no quedar debajo de los botones de zoom
    const marginX = 24;
    const marginRight = 56;
    const marginY = 24;
    const nextScale = Math.min(
      1.1,
      Math.max(
        0.3,
        Math.min((width - marginX - marginRight) / boxWidth, (height - marginY * 2) / boxHeight),
      ),
    );
    // Centrar si entra; si no entra ni con el zoom mínimo (pantallas muy
    // chicas), alinear a la izquierda para que la CPU se vea completa.
    const x =
      marginX +
      Math.max(0, (width - marginX - marginRight - boxWidth * nextScale) / 2) -
      localX * nextScale;
    const y = Math.max(marginY, (height - boxHeight * nextScale) / 2) - localY * nextScale;
    api.setTransform(x, y, nextScale, animationTime);
  }, []);

  // Encuadre automático al montar, al cambiar el tamaño del panel y cuando
  // aparecen o desaparecen componentes (memoria, dispositivos de E/S).
  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleFit = () => {
      if (userAdjustedRef.current) return;
      clearTimeout(timer);
      timer = setTimeout(() => fitToView(0), 50);
    };

    scheduleFit();
    const resizeObserver = new ResizeObserver(scheduleFit);
    resizeObserver.observe(container);
    const mutationObserver = new MutationObserver(scheduleFit);
    mutationObserver.observe(content, { childList: true });

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [fitToView]);

  // Ocultar textos de bus de control al iniciar
  useEffect(() => {
    // Ejecutar inmediatamente
    hideControlBusTextsOnInit();
    hideALUResultTextOnInit();
    hideALULeftTextOnInit();
    hideALURightTextOnInit();

    // Retry después de un breve delay para asegurar que los springs estén disponibles
    const retryTimer = setTimeout(() => {
      hideControlBusTextsOnInit();
      hideALUResultTextOnInit();
      hideALULeftTextOnInit();
      hideALURightTextOnInit();
      // Verificar estado después del retry
      // Resetear spring si es necesario
    }, 100);

    return () => clearTimeout(retryTimer);
  }, []);

  return (
    <div ref={containerRef} className="relative size-full">
      <TransformWrapper
        minScale={0.3}
        initialScale={0.75}
        ref={wrapperRef}
        doubleClick={{ disabled: true }}
        panning={{ excluded: ["input"] }}
        onPanning={markUserAdjusted}
        onWheelStart={markUserAdjusted}
        onPinchingStart={markUserAdjusted}
      >
        <TransformComponent wrapperClass="!w-full !h-full" contentClass="!p-[200px]">
          <div ref={contentRef} className="relative h-[1300px] w-[1900px]">
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
            <Keyboard />
            <Leds />
            <Printer />
            <Switches />
            <Screen />
          </div>
        </TransformComponent>
        <ZoomControls
          wrapperRef={wrapperRef}
          onFit={() => {
            userAdjustedRef.current = false;
            fitToView();
          }}
          onManualZoom={markUserAdjusted}
        />
      </TransformWrapper>
    </div>
  );
}
