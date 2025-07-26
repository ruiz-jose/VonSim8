import clsx from "clsx";
import { atom } from "jotai";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Switch } from "@/components/ui/Switch";
import { stopAllAnimations } from "@/computer/shared/animate";
import { useSimulation } from "@/computer/simulation";
import { useTranslate } from "@/lib/i18n";
import { HANDSHAKE_CONNECTIONS, PIO_CONNECTIONS, useSettings } from "@/lib/settings";
import { defaultSettings } from "@/lib/settings/schema";

export const settingsOpenAtom = atom(false);

// Función helper para calcular la frecuencia del timer
function getTimerFrequency(clockSpeedMs: number): string {
  const frequencyHz = 1000 / clockSpeedMs;
  return frequencyHz.toFixed(1);
}

export function Settings({ className }: { className?: string }) {
  const translate = useTranslate();
  const [settings, setSettings] = useSettings();
  const { status } = useSimulation();

  return (
    <div className={clsx("overflow-auto scrollbar-stone-700", className)}>
      <h3 className="flex items-center gap-2 border-b border-stone-600 py-2 pl-4 text-xl font-semibold">
        <span className="icon-[lucide--settings] size-6" /> {translate("settings.title")}
      </h3>

      <Setting>
        <SettingInfo>
          <SettingTitle>
            <span className="icon-[lucide--rotate-3d] size-6" />
            {translate("settings.animations.label")}
          </SettingTitle>
          <SettingSubtitle>{translate("settings.animations.description")}</SettingSubtitle>
        </SettingInfo>

        <Switch
          className="ml-8"
          checked={settings.animations}
          onCheckedChange={value => {
            setSettings(prev => ({ ...prev, animations: value }));
            if (value === false) stopAllAnimations();
          }}
        />
      </Setting>

      <Setting>
        <SettingInfo>
          <SettingTitle>
            <span className="icon-[lucide--gauge] size-6" />
            {translate("settings.speeds.executionUnit")}
          </SettingTitle>
        </SettingInfo>

        <Slider
          className="w-44"
          {...logSlider({
            value: settings.executionUnit,
            onValueChange: (value: number) =>
              setSettings(prev => ({ ...prev, executionUnit: value })),
            min: 500,
            max: 1,
          })}
        />
      </Setting>

      <hr className="border-stone-600" />

      <Setting>
        <SettingInfo>
          <SettingTitle>{translate("settings.instructionCycle.label")}</SettingTitle>
        </SettingInfo>

        <Switch
          className="ml-8"
          checked={settings.showInstructionCycle}
          onCheckedChange={value => setSettings(prev => ({ ...prev, showInstructionCycle: value }))}
        />
      </Setting>

      <Setting>
        <SettingInfo>
          <SettingTitle>{translate("settings.statsCPU.label")}</SettingTitle>
        </SettingInfo>

        <Switch
          className="ml-8"
          checked={settings.showStatsCPU}
          onCheckedChange={value => setSettings(prev => ({ ...prev, showStatsCPU: value }))}
        />
      </Setting>



      <Setting>
        <SettingInfo>
          <SettingTitle>
            <span className="icon-[lucide--cpu] size-6" />
            Velocidad CPU (Hz)
          </SettingTitle>
          <SettingSubtitle>Velocidad del procesador. Determina el tiempo de ciclo de la CPU.</SettingSubtitle>
        </SettingInfo>

        {/* Select para cpuSpeed con opciones en Hz */}
        <Select
          value={settings.cpuSpeed}
          onValueChange={(value: "1" | "2" | "4" | "10") => setSettings(prev => ({ ...prev, cpuSpeed: value }))}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1" title="1 Hz = 1 segundo por ciclo - Muy lenta">1 Hz (1.0s)</SelectItem>
            <SelectItem value="2" title="2 Hz = 0.5 segundos por ciclo - Lenta">2 Hz (0.5s)</SelectItem>
            <SelectItem value="4" title="4 Hz = 0.25 segundos por ciclo - Normal">4 Hz (0.25s)</SelectItem>
            <SelectItem value="10" title="10 Hz = 0.1 segundos por ciclo - Rápida">10 Hz (0.1s)</SelectItem>
          </SelectContent>
        </Select>
      </Setting>

      <Setting>
        <SettingInfo>
          <SettingTitle>
            <span className="icon-[lucide--flag] size-6" />
            {translate("settings.flags.label")}
          </SettingTitle>
          <SettingSubtitle>{translate("settings.flags.description")}</SettingSubtitle>
        </SettingInfo>

        <Select
          value={settings.flagsVisibility}
          onValueChange={value => setSettings(prev => ({ ...prev, flagsVisibility: value as any }))}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CF_ZF">C Z</SelectItem>
            <SelectItem value="SF_OF_CF_ZF">S O C Z</SelectItem>
          </SelectContent>
        </Select>
      </Setting>

      <hr className="border-stone-600" />

      <Setting>
        <SettingInfo>
          <SettingTitle>
            <span className="icon-[lucide--monitor-smartphone] size-6" />
            {translate("settings.devices.label")}
          </SettingTitle>
          <SettingSubtitle>{translate("settings.devices.description")}</SettingSubtitle>
        </SettingInfo>
      </Setting>

      <Setting>
        <SettingInfo>
          <SettingTitle>{translate("settings.devices.keyboard-and-screen")}</SettingTitle>
        </SettingInfo>

        <Switch
          className="ml-8"
          checked={settings.devices.keyboardAndScreen}
          onCheckedChange={value =>
            setSettings(prev => ({
              ...prev,
              devices: { ...prev.devices, keyboardAndScreen: value },
            }))
          }
          // Comentando la línea disabled
          // disabled={status.type !== "stopped"}
        />
      </Setting>

      <Setting>
        <SettingInfo>
          <SettingTitle>{translate("settings.devices.pic.label")}</SettingTitle>
          <SettingSubtitle>{translate("settings.devices.pic.description")}</SettingSubtitle>
        </SettingInfo>

        <Switch
          className="ml-8"
          checked={settings.devices.pic}
          onCheckedChange={value =>
            setSettings(prev => ({
              ...prev,
              devices: { ...prev.devices, pic: value },
            }))
          }
          // Comentando la línea disabled
          // disabled={status.type !== "stopped"}
        />
      </Setting>

      <Setting>
        <SettingInfo>
          <SettingTitle>{translate("settings.devices.pio.label")}</SettingTitle>
        </SettingInfo>

        <Select
          value={settings.devices.pio ?? "null"}
          onValueChange={value =>
            setSettings(prev => ({
              ...prev,
              devices: {
                ...prev.devices,
                pio: value === "null" ? null : (value as any),
                handshake: prev.devices.handshake === value ? null : prev.devices.handshake,
              },
            }))
          }
          // Comentando la línea disabled
          // disabled={status.type !== "stopped"}
        >
          <SelectTrigger className="w-52 min-w-[theme(width.52)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PIO_CONNECTIONS.map(value => (
              <SelectItem key={value} value={value}>
                {translate(`settings.devices.pio.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Setting>

      <Setting>
        <SettingInfo>
          <SettingTitle>{translate("settings.devices.handshake.label")}</SettingTitle>
        </SettingInfo>

        <Select
          value={settings.devices.handshake ?? "null"}
          onValueChange={value =>
            setSettings(prev => ({
              ...prev,
              devices: {
                ...prev.devices,
                handshake: value === "null" ? null : (value as any),
                pio: prev.devices.pio === value ? null : prev.devices.pio,
              },
            }))
          }
          disabled={status.type !== "stopped"}
        >
          <SelectTrigger className="w-52 min-w-[theme(width.52)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HANDSHAKE_CONNECTIONS.map(value => (
              <SelectItem key={value} value={value}>
                {translate(`settings.devices.handshake.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Setting>

      {/* Velocidad de impresión - Solo visible si hay impresora seleccionada */}
      {(settings.devices.pio === "printer" || settings.devices.handshake === "printer") && (
        <Setting>
          <SettingInfo>
            <SettingTitle>
              <span className="icon-[lucide--printer] size-6" />
              {translate("settings.speeds.printerSpeed")}
            </SettingTitle>
          </SettingInfo>

          <Slider
            className="w-44"
            {...logSlider({
              value: settings.printerSpeed,
              onValueChange: (value: number) =>
                setSettings(prev => ({ ...prev, printerSpeed: value })),
              min: 20000,
              max: 500,
            })}
          />
        </Setting>
      )}

      <Setting>
        <SettingInfo>
          <SettingTitle>
            <span className="icon-[lucide--timer] size-6" />
            Frecuencia del Timer
          </SettingTitle>
        </SettingInfo>

        <div className="flex flex-col gap-2">
          {/* Select para clockSpeed con opciones descriptivas */}
          <Select
            value={settings.clockSpeed.toString()}
            onValueChange={(value) => setSettings(prev => ({ ...prev, clockSpeed: parseInt(value) }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100" title="Timer muy frecuente - Interrupciones cada 0.1 segundos">
                <div className="flex items-center justify-between w-full">
                  <span>Muy Frecuente</span>
                  <span className="text-xs text-stone-400">0.1s</span>
                </div>
              </SelectItem>
              <SelectItem value="400" title="Timer frecuente - Interrupciones cada 0.4 segundos">
                <div className="flex items-center justify-between w-full">
                  <span>Frecuente</span>
                  <span className="text-xs text-stone-400">0.4s</span>
                </div>
              </SelectItem>
              <SelectItem value="600" title="Timer normal - Interrupciones cada 0.6 segundos">
                <div className="flex items-center justify-between w-full">
                  <span>Normal</span>
                  <span className="text-xs text-stone-400">0.6s</span>
                </div>
              </SelectItem>
              <SelectItem value="800" title="Timer lento - Interrupciones cada 0.8 segundos">
                <div className="flex items-center justify-between w-full">
                  <span>Lento</span>
                  <span className="text-xs text-stone-400">0.8s</span>
                </div>
              </SelectItem>
              <SelectItem value="1000" title="Timer muy lento - Interrupciones cada 1 segundo">
                <div className="flex items-center justify-between w-full">
                  <span>Muy Lento</span>
                  <span className="text-xs text-stone-400">1.0s</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Indicador de frecuencia */}
          <div className="flex items-center gap-1 text-xs text-stone-400">
            <span className="icon-[lucide--info] size-4" />
            <span>Frecuencia: {getTimerFrequency(settings.clockSpeed)} Hz</span>
          </div>
        </div>
      </Setting>




      <Setting>
        <SettingInfo>
          <SettingTitle>
            <span className="icon-[lucide--contrast] size-6" />
            {translate("settings.filters.label")}
          </SettingTitle>
          <SettingSubtitle>
            {translate("settings.filters.description")}
            <button
              className="mt-1 block text-mantis-400 transition-colors hover:text-mantis-300"
              onClick={() =>
                setSettings(prev => ({
                  ...prev,
                  filterBightness: defaultSettings.filterBightness,
                  filterContrast: defaultSettings.filterContrast,
                  filterInvert: defaultSettings.filterInvert,
                  filterSaturation: defaultSettings.filterSaturation,
                }))
              }
            >
              {translate("settings.filters.revert")}
            </button>
          </SettingSubtitle>
        </SettingInfo>

        <div className="ml-8 grid w-64 grid-cols-[min-content,auto] items-center gap-2">
          <span className="text-xs">{translate("settings.filters.brightness")}</span>
          <Slider
            value={[settings.filterBightness]}
            onValueChange={([value]) => setSettings(prev => ({ ...prev, filterBightness: value }))}
            min={0}
            max={5}
            step={0.05}
          />

          <span className="text-xs">{translate("settings.filters.contrast")}</span>
          <Slider
            value={[settings.filterContrast]}
            onValueChange={([value]) => setSettings(prev => ({ ...prev, filterContrast: value }))}
            min={0}
            max={5}
            step={0.05}
          />

          <span className="text-xs">{translate("settings.filters.invert")}</span>
          <Switch
            checked={settings.filterInvert}
            onCheckedChange={value => setSettings(prev => ({ ...prev, filterInvert: value }))}
          />

          <span className="text-xs">{translate("settings.filters.saturation")}</span>
          <Slider
            value={[settings.filterSaturation]}
            onValueChange={([value]) => setSettings(prev => ({ ...prev, filterSaturation: value }))}
            min={0}
            max={5}
            step={0.05}
          />
        </div>
      </Setting>

      <hr className="border-stone-600" />

      <div className="flex justify-end p-4">
        <button
          className="inline-flex items-center gap-1 text-sm text-red-500 transition-colors hover:text-red-400"
          onClick={() =>
            setSettings(prev => ({
              ...defaultSettings,
              // Keep language because, why would you want to reset it?
              language: prev.language,
              // Keep devices because it could break the simulation
              devices: prev.devices,
            }))
          }
        >
          <span className="icon-[lucide--trash-2] size-4" />
          {translate("settings.reset")}
        </button>
      </div>
    </div>
  );
}

function Setting({ children }: { children?: React.ReactNode }) {
  return <div className="m-4 flex items-center justify-between gap-4">{children}</div>;
}

function SettingInfo({ children }: { children?: React.ReactNode }) {
  return <div className="grow">{children}</div>;
}

function SettingTitle({ children }: { children?: React.ReactNode }) {
  return <p className="flex items-center gap-2 font-medium">{children}</p>;
}

function SettingSubtitle({ children }: { children?: React.ReactNode }) {
  return <p className="mt-1 text-xs text-stone-400">{children}</p>;
}

function logSlider({
  value,
  onValueChange,
  min,
  max,
}: {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
}): {
  value: [number];
  onValueChange: (value: [number]) => void;
  min: number;
  max: number;
} {
  const minl = Math.log(min);
  const maxl = Math.log(max);
  const scale = (maxl - minl) / 100;

  return {
    value: [(Math.log(value) - minl) / scale],
    onValueChange: (value: [number]) => onValueChange(Math.exp(minl + scale * value[0])),
    min: 0,
    max: 100,
  };
}
